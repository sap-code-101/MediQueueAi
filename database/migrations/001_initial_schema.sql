-- MediQueueAI Database Schema
-- This file is for documentation/reference only.
-- Actual schema is created by the backend's database.ts initDB()

-- Staff users (admin, doctor, receptionist)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    doctor_id INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

-- Patient accounts (separate from staff)
CREATE TABLE IF NOT EXISTS patient_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password_hash TEXT NOT NULL,
    patient_id INTEGER,
    is_verified INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (patient_id) REFERENCES patients(id)
);

CREATE TABLE IF NOT EXISTS doctors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    specialty TEXT,
    experience_years INTEGER DEFAULT 0,
    available_slots TEXT DEFAULT '[]',
    slot_duration_minutes INTEGER DEFAULT 30,
    working_hours TEXT,
    break_time TEXT,
    max_patients_per_day INTEGER DEFAULT 20,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    age INTEGER,
    gender TEXT,
    date_of_birth TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    blood_group TEXT,
    emergency_contact TEXT,
    priority TEXT DEFAULT 'normal',
    visit_type TEXT,
    no_show_rate REAL DEFAULT 0.0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Queue types for multi-queue system
CREATE TABLE IF NOT EXISTS queue_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT DEFAULT '#3b8bff',
    is_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    confirmation_code TEXT UNIQUE NOT NULL,
    patient_id INTEGER,
    doctor_id INTEGER,
    appointment_time TEXT NOT NULL,
    status TEXT DEFAULT 'booked',
    actual_duration REAL,
    check_in_time TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

-- Multi-queue support
CREATE TABLE IF NOT EXISTS queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    queue_type_id INTEGER DEFAULT 1,
    doctor_id INTEGER,
    patient_id INTEGER,
    position INTEGER NOT NULL,
    estimated_wait REAL,
    estimated_duration REAL DEFAULT 10.0,
    stage TEXT DEFAULT 'waiting',
    stage_start_time TEXT,
    check_in_time TEXT,
    slot_time TEXT,
    notes TEXT,
    transferred_from INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (queue_type_id) REFERENCES queue_types(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id),
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (transferred_from) REFERENCES queue(id)
);

CREATE TABLE IF NOT EXISTS external_factors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    weather_condition TEXT,
    traffic_level INTEGER DEFAULT 0,
    hospital_occupancy REAL DEFAULT 0.0
);

CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER,
    patient_rating INTEGER,
    actual_wait REAL,
    comments TEXT,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);

CREATE TABLE IF NOT EXISTS anomalies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    doctor_id INTEGER,
    date TEXT NOT NULL,
    description TEXT,
    severity TEXT DEFAULT 'low',
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT DEFAULT 'medium',
    read_status TEXT DEFAULT 'unread',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
