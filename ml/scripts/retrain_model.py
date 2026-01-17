import pandas as pd
import psycopg2
import joblib
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor
import numpy as np

import pandas as pd
import sqlite3
import joblib
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor
import numpy as np

def export_data_to_csv(db_path, csv_path):
    conn = sqlite3.connect(db_path)
    query = """
    SELECT a.doctor_id, strftime('%H', a.appointment_time) + strftime('%M', a.appointment_time)/60.0 as time_of_day,
           strftime('%w', a.appointment_time) as day_of_week,
           COALESCE(avg_recent.avg_duration, 10) as avg_recent_duration,
           COALESCE(q.queue_length, 0) as queue_length,
           a.actual_duration as actual_wait_time
    FROM appointments a
    LEFT JOIN (
        SELECT doctor_id, date(appointment_time), AVG(actual_duration) as avg_duration
        FROM appointments
        WHERE actual_duration IS NOT NULL
        GROUP BY doctor_id, date(appointment_time)
    ) avg_recent ON a.doctor_id = avg_recent.doctor_id AND date(a.appointment_time) = avg_recent.date
    LEFT JOIN (
        SELECT doctor_id, date(created_at), COUNT(*) as queue_length
        FROM queue
        GROUP BY doctor_id, date(created_at)
    ) q ON a.doctor_id = q.doctor_id AND date(a.appointment_time) = q.date
    WHERE a.actual_duration IS NOT NULL
    """
    df = pd.read_sql_query(query, conn)
    df.to_csv(csv_path, index=False)
    conn.close()

def prepare_data(data):
    features = data[['doctor_id', 'time_of_day', 'day_of_week', 'avg_recent_duration', 'queue_length']]
    target_mean = data['actual_wait_time']
    data['variance'] = data.groupby('doctor_id')['actual_wait_time'].rolling(10).std().fillna(1)
    target_var = data['variance']
    return features, target_mean, target_var

def train_models(features, target_mean, target_var):
    scaler = StandardScaler()
    features_scaled = scaler.fit_transform(features)
    
    mean_model = RandomForestRegressor(n_estimators=100, random_state=42)
    mean_model.fit(features_scaled, target_mean)
    
    var_model = RandomForestRegressor(n_estimators=100, random_state=42)
    var_model.fit(features_scaled, target_var)
    
    return mean_model, var_model, scaler

if __name__ == "__main__":
    db_path = '../../backend/database.db'
    csv_path = '../data/historical_wait_times.csv'
    
    # Export latest data
    export_data_to_csv(db_path, csv_path)
    
    # Load and train
    data = pd.read_csv(csv_path)
    features, target_mean, target_var = prepare_data(data)
    mean_model, var_model, scaler = train_models(features, target_mean, target_var)
    
    # Save models
    joblib.dump(mean_model, '../models/mean_predictor.pkl')
    joblib.dump(var_model, '../models/var_predictor.pkl')
    joblib.dump(scaler, '../models/scaler.pkl')
    
    print("Data exported and models retrained.")