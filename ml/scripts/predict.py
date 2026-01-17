import pandas as pd
import joblib
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
import numpy as np
import sys
import json
from datetime import datetime
from scipy.stats import norm

class WaitTimePredictor:
    def __init__(self, model_mean_path, model_variance_path, scaler_path):
        self.model_mean = joblib.load(model_mean_path)
        self.model_variance = joblib.load(model_variance_path)
        self.scaler = joblib.load(scaler_path)

    def predict(self, features):
        features_scaled = self.scaler.transform([features])
        mean_prediction = self.model_mean.predict(features_scaled)[0]
        variance_prediction = self.model_variance.predict(features_scaled)[0]
        return mean_prediction, variance_prediction

def prepare_features(total_queue_length, patients_at_current_stage, staff_at_current_stage, hospital_occupancy, patient_age, traffic_level, doctor_experience, time_of_day, day_of_week, time_slot):
    # Include temporal features
    time_slot_encoded = {'morning': 0, 'afternoon': 1, 'evening': 2}[time_slot]
    features = [total_queue_length, patients_at_current_stage, staff_at_current_stage, hospital_occupancy, patient_age, traffic_level, doctor_experience, time_of_day, day_of_week, time_slot_encoded]
    return features

def calculate_tail_risk(mean, variance, threshold=30):
    # Assuming normal distribution, P(wait > threshold)
    std = np.sqrt(variance)
    return 1 - norm.cdf(threshold, mean, std)

if __name__ == "__main__":
    if len(sys.argv) < 9:
        print("Usage: python predict.py <total_queue_length> <patients_at_current_stage> <staff_at_current_stage> <hospital_occupancy> <patient_age> <traffic_level> <doctor_experience> <slot_time>")
        sys.exit(1)
    
    total_queue_length = int(sys.argv[1])
    patients_at_current_stage = int(sys.argv[2])
    staff_at_current_stage = int(sys.argv[3])
    hospital_occupancy = float(sys.argv[4])
    patient_age = int(sys.argv[5])
    traffic_level = int(sys.argv[6])
    doctor_experience = int(sys.argv[7])
    slot_time_str = sys.argv[8]
    
    # Calculate temporal features from slot_time
    dt = datetime.fromisoformat(slot_time_str.replace('Z', '+00:00'))
    time_of_day = dt.hour + dt.minute / 60
    day_of_week = dt.weekday()
    time_slot = 'morning' if time_of_day < 12 else 'afternoon' if time_of_day < 17 else 'evening'
    
    model_mean_path = '../models/wait_time_predictor_mean.pkl'
    model_variance_path = '../models/wait_time_predictor_variance.pkl'
    scaler_path = '../models/scaler.pkl'
    
    predictor = WaitTimePredictor(model_mean_path, model_variance_path, scaler_path)
    features = prepare_features(total_queue_length, patients_at_current_stage, staff_at_current_stage, hospital_occupancy, patient_age, traffic_level, doctor_experience, time_of_day, day_of_week, time_slot)
    mean, variance = predictor.predict(features)
    tail_risk = calculate_tail_risk(mean, variance)
    
    print(json.dumps({'mean': mean, 'variance': variance, 'tail_risk': tail_risk}))