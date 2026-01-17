#!/usr/bin/env python3
"""
ML Wait Time Prediction Service for Hospital Queue Management
Uses a simple ML model to predict patient wait times based on:
- Current queue length
- Time of day
- Day of week
- Historical average consultation times
- Doctor's workload
"""

import json
import sys
import os
from datetime import datetime, timedelta
import random

# Simple feature-based prediction model
# In production, this would use a trained sklearn/tensorflow model

class WaitTimePredictor:
    """Simple ML-based wait time predictor"""
    
    # Average consultation times by specialty (in minutes)
    SPECIALTY_TIMES = {
        'General': 15,
        'Cardiology': 25,
        'Orthopedics': 20,
        'Pediatrics': 18,
        'Dermatology': 12,
        'default': 15
    }
    
    # Time of day factors (rush hour multipliers)
    TIME_FACTORS = {
        'early_morning': 0.8,   # 8-10 AM
        'mid_morning': 1.2,     # 10-12 PM (busiest)
        'lunch': 0.9,           # 12-2 PM
        'afternoon': 1.1,       # 2-4 PM
        'late_afternoon': 0.85, # 4-6 PM
    }
    
    # Day of week factors
    DAY_FACTORS = {
        0: 1.15,  # Monday (busiest)
        1: 1.0,   # Tuesday
        2: 0.95,  # Wednesday
        3: 1.0,   # Thursday
        4: 1.1,   # Friday
        5: 0.6,   # Saturday
        6: 0.0,   # Sunday (closed)
    }
    
    def __init__(self):
        self.historical_data = []
        
    def _get_time_factor(self, hour: int) -> float:
        """Get time of day multiplier"""
        if 8 <= hour < 10:
            return self.TIME_FACTORS['early_morning']
        elif 10 <= hour < 12:
            return self.TIME_FACTORS['mid_morning']
        elif 12 <= hour < 14:
            return self.TIME_FACTORS['lunch']
        elif 14 <= hour < 16:
            return self.TIME_FACTORS['afternoon']
        else:
            return self.TIME_FACTORS['late_afternoon']
    
    def predict(self, 
                queue_length: int, 
                specialty: str = 'General',
                appointment_time: str = None,
                doctor_avg_time: float = None) -> dict:
        """
        Predict wait time for a patient
        
        Args:
            queue_length: Number of patients ahead in queue
            specialty: Doctor's specialty
            appointment_time: ISO format datetime string
            doctor_avg_time: Doctor's historical average consultation time
        
        Returns:
            dict with predicted_wait_minutes, confidence, and range
        """
        # Base consultation time
        base_time = self.SPECIALTY_TIMES.get(specialty, self.SPECIALTY_TIMES['default'])
        
        # Use doctor's historical average if available
        if doctor_avg_time and doctor_avg_time > 0:
            base_time = (base_time + doctor_avg_time) / 2
        
        # Get current time factors
        now = datetime.now()
        if appointment_time:
            try:
                now = datetime.fromisoformat(appointment_time.replace('Z', '+00:00'))
            except:
                pass
        
        time_factor = self._get_time_factor(now.hour)
        day_factor = self.DAY_FACTORS.get(now.weekday(), 1.0)
        
        # Calculate base wait time
        base_wait = queue_length * base_time
        
        # Apply factors
        adjusted_wait = base_wait * time_factor * day_factor
        
        # Add some variance (simulating ML uncertainty)
        variance = random.uniform(0.9, 1.1)
        predicted_wait = adjusted_wait * variance
        
        # Calculate confidence (decreases with queue length)
        confidence = max(0.6, 1.0 - (queue_length * 0.03))
        
        # Calculate range
        margin = predicted_wait * (1 - confidence)
        min_wait = max(0, predicted_wait - margin)
        max_wait = predicted_wait + margin
        
        return {
            'predicted_wait_minutes': round(predicted_wait),
            'min_wait_minutes': round(min_wait),
            'max_wait_minutes': round(max_wait),
            'confidence': round(confidence, 2),
            'factors': {
                'base_consultation_time': base_time,
                'time_of_day_factor': time_factor,
                'day_of_week_factor': day_factor,
                'queue_length': queue_length
            }
        }
    
    def predict_slot_availability(self, 
                                  doctor_id: int,
                                  slot_time: str,
                                  current_bookings: int = 0) -> dict:
        """
        Predict if a time slot is good for booking
        
        Args:
            doctor_id: Doctor's ID
            slot_time: ISO format datetime string
            current_bookings: Number of existing bookings for that slot
        
        Returns:
            dict with availability status and recommendation
        """
        try:
            slot_dt = datetime.fromisoformat(slot_time.replace('Z', '+00:00'))
        except:
            slot_dt = datetime.now()
        
        time_factor = self._get_time_factor(slot_dt.hour)
        day_factor = self.DAY_FACTORS.get(slot_dt.weekday(), 1.0)
        
        # Calculate expected wait based on typical patterns
        expected_wait = current_bookings * 15 * time_factor * day_factor
        
        # Determine availability status
        if expected_wait < 20:
            status = 'HIGH'
            recommendation = 'Excellent choice! Low expected wait time.'
        elif expected_wait < 40:
            status = 'MEDIUM'
            recommendation = 'Good availability. Moderate wait expected.'
        else:
            status = 'LOW'
            recommendation = 'Consider an earlier time for shorter wait.'
        
        return {
            'slot_time': slot_time,
            'availability': status,
            'expected_wait_minutes': round(expected_wait),
            'recommendation': recommendation,
            'factors': {
                'time_factor': time_factor,
                'day_factor': day_factor,
                'current_bookings': current_bookings
            }
        }


def main():
    """CLI interface for the prediction service"""
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'Usage: python ml_predictions.py <command> [args]'}))
        sys.exit(1)
    
    command = sys.argv[1]
    predictor = WaitTimePredictor()
    
    if command == 'predict_wait':
        # Args: queue_length, specialty, appointment_time, doctor_avg_time
        queue_length = int(sys.argv[2]) if len(sys.argv) > 2 else 0
        specialty = sys.argv[3] if len(sys.argv) > 3 else 'General'
        appointment_time = sys.argv[4] if len(sys.argv) > 4 else None
        doctor_avg_time = float(sys.argv[5]) if len(sys.argv) > 5 else None
        
        result = predictor.predict(queue_length, specialty, appointment_time, doctor_avg_time)
        print(json.dumps(result))
        
    elif command == 'predict_slot':
        # Args: doctor_id, slot_time, current_bookings
        doctor_id = int(sys.argv[2]) if len(sys.argv) > 2 else 1
        slot_time = sys.argv[3] if len(sys.argv) > 3 else datetime.now().isoformat()
        current_bookings = int(sys.argv[4]) if len(sys.argv) > 4 else 0
        
        result = predictor.predict_slot_availability(doctor_id, slot_time, current_bookings)
        print(json.dumps(result))
        
    else:
        print(json.dumps({'error': f'Unknown command: {command}'}))
        sys.exit(1)


if __name__ == '__main__':
    main()