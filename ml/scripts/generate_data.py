import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

def generate_synthetic_data(num_samples=1000):
    data = []
    doctors = [1, 2, 3, 4, 5]  # Multiple doctors
    base_date = datetime(2023, 1, 1)
    
    for _ in range(num_samples):
        doctor_id = random.choice(doctors)
        # Random date within a year
        days_offset = random.randint(0, 365)
        slot_time = base_date + timedelta(days=days_offset)
        time_of_day = random.uniform(8, 18)  # 8 AM to 6 PM
        day_of_week = slot_time.weekday()
        day_of_month = slot_time.day
        month = slot_time.month
        
        # Multi-stage queue features (adapted for MediQueueAI)
        total_queue_length = random.randint(0, 15)
        # Stage-specific waiting
        patients_waiting_checkin = random.randint(0, 5)
        patients_waiting_triage = random.randint(0, total_queue_length // 3)
        patients_waiting_consultation = random.randint(0, total_queue_length // 2)
        patients_waiting_payment = random.randint(0, 3)
        
        # Staff serving each stage
        staff_checkin = random.randint(1, 3)
        staff_triage = random.randint(1, 2)
        staff_consultation = random.randint(1, 5)
        staff_payment = random.randint(1, 2)
        
        # Current stage for this prediction (simplified to consultation for booking)
        current_stage = 'consultation'
        patients_at_current_stage = patients_waiting_consultation
        staff_at_current_stage = staff_consultation
        
        # Recent durations (simulate past waits)
        avg_recent_duration = random.uniform(5, 25)
        
        # Patient features
        patient_age = random.randint(18, 80)
        patient_priority = random.choice(['normal', 'urgent', 'emergency'])
        patient_no_show_rate = random.uniform(0, 0.3)
        
        # Doctor features
        doctor_experience = random.randint(1, 30)
        
        # External factors
        traffic = random.randint(0, 10)
        occupancy = random.uniform(0.3, 0.9)
        
        # Time-based features
        time_slot = 'morning' if time_of_day < 12 else 'afternoon' if time_of_day < 17 else 'evening'
        
        # Actual wait time: realistic hospital wait times with temporal effects
        time_slot_multiplier = 1.0 if time_slot == 'morning' else 1.3 if time_slot == 'afternoon' else 0.8  # Afternoon peak, evening slower
        weekend_multiplier = 1.2 if day_of_week >= 5 else 1.0  # Weekend effects
        
        base_wait = 5 + total_queue_length * 0.8 + patients_at_current_stage * 1.2 + (5 / max(staff_at_current_stage, 1)) + patients_waiting_checkin * 0.3 + (18 - time_of_day) * 0.3 + patient_age * 0.05 + (1 if patient_priority == 'urgent' else 0) * 3 + doctor_experience * -0.1 + traffic * 0.3 + occupancy * 5
        base_wait = base_wait * time_slot_multiplier * weekend_multiplier
        noise = np.random.normal(0, 2)
        actual_wait_time = max(0, base_wait + noise)
        
        # Variance: realistic uncertainty
        variance = 0.5 + total_queue_length * 0.15 + patients_at_current_stage * 0.25 + traffic * 0.05 + random.uniform(0, 1)
        
        data.append({
            'doctor_id': doctor_id,
            'time_of_day': time_of_day,
            'day_of_week': day_of_week,
            'day_of_month': day_of_month,
            'month': month,
            'time_slot': time_slot,
            'avg_recent_duration': avg_recent_duration,
            'total_queue_length': total_queue_length,
            'patients_at_current_stage': patients_at_current_stage,
            'staff_at_current_stage': staff_at_current_stage,
            'patients_waiting_checkin': patients_waiting_checkin,
            'patient_age': patient_age,
            'patient_priority': patient_priority,
            'patient_no_show_rate': patient_no_show_rate,
            'doctor_experience': doctor_experience,
            'traffic_level': traffic,
            'hospital_occupancy': occupancy,
            'actual_wait_time': actual_wait_time,
            'variance': variance
        })
    
    return pd.DataFrame(data)

if __name__ == "__main__":
    df = generate_synthetic_data(1000)
    df.to_csv('../data/historical_wait_times.csv', index=False)
    print("Generated 1000 synthetic samples.")