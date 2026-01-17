import pandas as pd
import joblib
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_squared_error
import numpy as np

def load_historical_data(file_path):
    return pd.read_csv(file_path)

def prepare_data(data):
    # Include temporal features
    data_encoded = data.copy()
    data_encoded['time_slot_encoded'] = data_encoded['time_slot'].map({'morning': 0, 'afternoon': 1, 'evening': 2})
    
    features = data_encoded[['total_queue_length', 'patients_at_current_stage', 'staff_at_current_stage', 'hospital_occupancy', 'patient_age', 'traffic_level', 'doctor_experience', 'time_of_day', 'day_of_week', 'time_slot_encoded']]
    target_mean = data_encoded['actual_wait_time']
    target_variance = data_encoded['variance']
    return features, target_mean, target_variance

def train_model(features, target_mean, target_variance):
    scaler = StandardScaler()
    features_scaled = scaler.fit_transform(features)
    
    model_mean = RandomForestRegressor(n_estimators=100, random_state=42)
    model_mean.fit(features_scaled, target_mean)
    
    model_variance = RandomForestRegressor(n_estimators=100, random_state=42)
    model_variance.fit(features_scaled, target_variance)
    
    return model_mean, model_variance, scaler

if __name__ == "__main__":
    historical_data_path = '../data/historical_wait_times.csv'
    
    data = pd.read_csv(historical_data_path)
    features, target_mean, target_variance = prepare_data(data)
    
    # Evaluate mean model
    model_mean = RandomForestRegressor(n_estimators=100, random_state=42)
    scores_mean = cross_val_score(model_mean, features, target_mean, cv=5, scoring='neg_mean_squared_error')
    rmse_mean = np.sqrt(-scores_mean.mean())
    
    # Evaluate variance model
    model_variance = RandomForestRegressor(n_estimators=100, random_state=42)
    scores_variance = cross_val_score(model_variance, features, target_variance, cv=5, scoring='neg_mean_squared_error')
    rmse_variance = np.sqrt(-scores_variance.mean())
    
    # Train final models
    scaler = StandardScaler()
    features_scaled = scaler.fit_transform(features)
    model_mean.fit(features_scaled, target_mean)
    model_variance.fit(features_scaled, target_variance)
    
    joblib.dump(model_mean, '../models/wait_time_predictor_mean.pkl')
    joblib.dump(model_variance, '../models/wait_time_predictor_variance.pkl')
    joblib.dump(scaler, '../models/scaler.pkl')
    
    print(f"Mean model RMSE: {rmse_mean:.2f} minutes")
    print(f"Variance model RMSE: {rmse_variance:.2f}")
    print("Models trained and saved.")