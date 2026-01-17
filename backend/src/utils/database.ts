import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import bcrypt from 'bcrypt';
import fs from 'fs';

let db: Database;

// Use path relative to this file for consistent behavior
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../../database/queue.db');

// License key from environment - this becomes the admin password
// Format: MQAI-XXXX-XXXX-XXXX (provided when customer purchases license)
const LICENSE_KEY = process.env.LICENSE_KEY || process.env.MEDIQUEUEAI_LICENSE;

export const initDB = async () => {
    // Delete old database if schema is incompatible (dev mode)
    if (process.env.RESET_DB === 'true' && fs.existsSync(DB_PATH)) {
        fs.unlinkSync(DB_PATH);
        console.log('Database reset for fresh start');
    }
    
    db = await open({
        filename: DB_PATH,
        driver: sqlite3.Database,
    });
    
    await db.exec(`
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
            working_hours TEXT DEFAULT '{"mon":{"start":"09:00","end":"17:00"},"tue":{"start":"09:00","end":"17:00"},"wed":{"start":"09:00","end":"17:00"},"thu":{"start":"09:00","end":"17:00"},"fri":{"start":"09:00","end":"17:00"}}',
            break_time TEXT DEFAULT '{"start":"12:00","end":"13:00"}',
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
            severity TEXT DEFAULT 'low'
        );
        
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            patient_user_id INTEGER,
            message TEXT NOT NULL,
            type TEXT DEFAULT 'info',
            read_status TEXT DEFAULT 'unread',
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (patient_user_id) REFERENCES patient_users(id)
        );
        
        CREATE TABLE IF NOT EXISTS license (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            license_key TEXT UNIQUE NOT NULL,
            hospital_name TEXT NOT NULL,
            activated_at TEXT DEFAULT (datetime('now')),
            expires_at TEXT,
            features TEXT DEFAULT '{"maxDoctors": 10, "maxReceptionists": 5}',
            status TEXT DEFAULT 'active'
        );
        
        -- Medical Reports (Doctor creates after consultation)
        CREATE TABLE IF NOT EXISTS medical_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            doctor_id INTEGER NOT NULL,
            appointment_id INTEGER,
            diagnosis TEXT,
            symptoms TEXT,
            notes TEXT,
            vital_signs TEXT,
            lab_tests_ordered TEXT,
            status TEXT DEFAULT 'draft',
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (patient_id) REFERENCES patients(id),
            FOREIGN KEY (doctor_id) REFERENCES doctors(id),
            FOREIGN KEY (appointment_id) REFERENCES appointments(id)
        );
        
        -- Prescriptions (Part of medical report)
        CREATE TABLE IF NOT EXISTS prescriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            report_id INTEGER NOT NULL,
            medicine_name TEXT NOT NULL,
            dosage TEXT,
            frequency TEXT,
            duration TEXT,
            instructions TEXT,
            dispensed INTEGER DEFAULT 0,
            dispensed_by INTEGER,
            dispensed_at TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (report_id) REFERENCES medical_reports(id),
            FOREIGN KEY (dispensed_by) REFERENCES users(id)
        );
        
        -- Billing (for future integration)
        CREATE TABLE IF NOT EXISTS bills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            appointment_id INTEGER,
            report_id INTEGER,
            items TEXT,
            subtotal REAL DEFAULT 0,
            tax REAL DEFAULT 0,
            discount REAL DEFAULT 0,
            total REAL DEFAULT 0,
            status TEXT DEFAULT 'pending',
            payment_method TEXT,
            paid_at TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (patient_id) REFERENCES patients(id),
            FOREIGN KEY (appointment_id) REFERENCES appointments(id),
            FOREIGN KEY (report_id) REFERENCES medical_reports(id)
        );
    `);
    
    // Run migrations for existing databases
    await runMigrations();
    
    // Seed queue types
    await seedQueueTypes();
    
    // Seed default admin if no users exist
    await seedDefaultAdmin();
    
    // Seed demo doctors if none exist
    await seedDemoDoctors();
};

// Run migrations for schema updates
const runMigrations = async () => {
    try {
        // Check if confirmation_code column exists
        const tableInfo = await db.all('PRAGMA table_info(appointments)');
        const hasConfirmationCode = tableInfo.some((col: any) => col.name === 'confirmation_code');
        
        if (!hasConfirmationCode) {
            console.log('Migration: Adding confirmation_code column to appointments');
            await db.exec('ALTER TABLE appointments ADD COLUMN confirmation_code TEXT');
            // Update existing appointments with generated codes
            const appointments = await db.all('SELECT id FROM appointments WHERE confirmation_code IS NULL');
            for (const apt of appointments) {
                const code = generateConfirmationCode();
                await db.run('UPDATE appointments SET confirmation_code = ? WHERE id = ?', [code, apt.id]);
            }
        }
        
        // Check if queue_type_id column exists in queue table
        const queueInfo = await db.all('PRAGMA table_info(queue)');
        const hasQueueTypeId = queueInfo.some((col: any) => col.name === 'queue_type_id');
        if (!hasQueueTypeId) {
            console.log('Migration: Adding queue_type_id column to queue');
            await db.exec('ALTER TABLE queue ADD COLUMN queue_type_id INTEGER DEFAULT 1');
        }
    } catch (e) {
        console.log('Migration check completed');
    }
};

// Seed default queue types
const seedQueueTypes = async () => {
    const existing = await db.get('SELECT id FROM queue_types LIMIT 1');
    if (!existing) {
        console.log('Seeding queue types...');
        const queueTypes = [
            { name: 'consultation', description: 'Doctor Consultation Queue', icon: 'stethoscope', color: '#3b8bff' },
            { name: 'laboratory', description: 'Lab Tests Queue', icon: 'flask', color: '#8b5cf6' },
            { name: 'pharmacy', description: 'Pharmacy/Medicine Collection', icon: 'pill', color: '#22c55e' },
            { name: 'radiology', description: 'X-Ray & Imaging Queue', icon: 'scan', color: '#f59e0b' },
            { name: 'billing', description: 'Billing & Payment Queue', icon: 'receipt', color: '#06b6d4' },
        ];
        for (const qt of queueTypes) {
            await db.run(
                'INSERT INTO queue_types (name, description, icon, color) VALUES (?, ?, ?, ?)',
                [qt.name, qt.description, qt.icon, qt.color]
            );
        }
        console.log('Queue types created');
    }
};

// Seed admin account using LICENSE_KEY as password
const seedDefaultAdmin = async () => {
    const existingAdmin = await db.get('SELECT id FROM users WHERE role = "admin" LIMIT 1');
    if (!existingAdmin) {
        if (!LICENSE_KEY) {
            console.error('⚠️  WARNING: No LICENSE_KEY provided!');
            console.error('   Set LICENSE_KEY environment variable with your purchased license.');
            console.error('   Example: LICENSE_KEY=MQAI-XXXX-XXXX-XXXX docker compose up');
            console.error('   Using demo key for testing: MQAI-DEMO-TEST-2024');
        }
        
        const adminPassword = LICENSE_KEY || 'MQAI-DEMO-TEST-2024';
        console.log('Creating admin account...');
        const hash = await bcrypt.hash(adminPassword, 10);
        
        await db.run(
            'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
            ['admin', hash, 'admin']
        );
        
        // Also store the license info
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        
        await db.run(
            'INSERT OR IGNORE INTO license (license_key, hospital_name, expires_at, status) VALUES (?, ?, ?, ?)',
            [adminPassword, LICENSE_KEY ? 'Licensed Hospital' : 'Demo Installation', expiresAt.toISOString(), LICENSE_KEY ? 'active' : 'demo']
        );
        
        console.log('✅ Admin account created');
        console.log(`   Username: admin`);
        console.log(`   Password: ${LICENSE_KEY ? '<your-license-key>' : 'MQAI-DEMO-TEST-2024'}`);
    }
};

// Seed demo doctors
const seedDemoDoctors = async () => {
    const existingDoctors = await db.all('SELECT id FROM doctors LIMIT 1');
    if (existingDoctors.length === 0) {
        console.log('Seeding demo doctors...');
        const doctors = [
            { name: 'Dr. Sarah Smith', specialty: 'General Medicine', experience: 10 },
            { name: 'Dr. James Wilson', specialty: 'Cardiology', experience: 15 },
            { name: 'Dr. Emily Chen', specialty: 'Pediatrics', experience: 8 },
        ];
        for (const doc of doctors) {
            await db.run(
                'INSERT INTO doctors (name, specialty, experience_years) VALUES (?, ?, ?)',
                [doc.name, doc.specialty, doc.experience]
            );
        }
        console.log('Demo doctors created');
    }
}

export const query = async (sql: string, params?: any[]) => {
    return db.all(sql, params);
};

export const run = async (sql: string, params?: any[]) => {
    return db.run(sql, params);
};

export const getAvailableSlots = async (doctorId: number) => {
    const res = await query('SELECT available_slots FROM doctors WHERE id = ?', [doctorId]);
    return JSON.parse(res[0]?.available_slots || '[]');
};

export const setAvailableSlots = async (doctorId: number, slots: Date[]) => {
    await run('UPDATE doctors SET available_slots = ? WHERE id = ?', [JSON.stringify(slots), doctorId]);
};

export const getQueueLength = async (doctorId: number) => {
    const res = await query('SELECT COUNT(*) as count FROM queue WHERE doctor_id = ?', [doctorId]);
    return res[0].count;
};

export const getRecentActualTimes = async (doctorId: number) => {
    const res = await query('SELECT actual_duration FROM appointments WHERE doctor_id = ? AND actual_duration IS NOT NULL AND date(appointment_time) = date(\'now\') ORDER BY appointment_time DESC LIMIT 10', [doctorId]);
    return res.map(row => row.actual_duration);
};

// Generate unique confirmation code
const generateConfirmationCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like 0,O,1,I
    let code = 'MQ-'; // MediQueueAI prefix
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

export const bookSlot = async (doctorId: string, patientData: { 
    patientName: string, 
    patientEmail?: string,
    patientPhone?: string,
    slotTime: Date 
}) => {
    // Create patient record with contact info
    const patientRes = await run(
        'INSERT INTO patients (name, email, phone) VALUES (?, ?, ?)', 
        [patientData.patientName, patientData.patientEmail || null, patientData.patientPhone || null]
    );
    const patientId = patientRes.lastID;
    
    // Generate unique confirmation code
    const confirmationCode = generateConfirmationCode();
    
    // Create appointment with confirmation code
    const res = await run(
        'INSERT INTO appointments (confirmation_code, patient_id, doctor_id, appointment_time, status) VALUES (?, ?, ?, ?, ?)', 
        [confirmationCode, patientId, doctorId, patientData.slotTime.toISOString(), 'booked']
    );
    
    return { id: res.lastID, confirmationCode, patientId };
};

export const addToQueue = async (doctorId: string, patientId: number) => {
    const maxPos = await query('SELECT MAX(position) as pos FROM queue WHERE doctor_id = ?', [doctorId]);
    const position = (maxPos[0]?.pos || 0) + 1;
    await run('INSERT INTO queue (doctor_id, patient_id, position) VALUES (?, ?, ?)', [doctorId, patientId, position]);
};

export const saveActualTime = async (doctorId: string, patientId: string, actualDuration: number) => {
    await run('UPDATE appointments SET actual_duration = ?, status = \'completed\' WHERE doctor_id = ? AND patient_id = ? AND status = \'in_queue\'', [actualDuration, doctorId, patientId]);
};

export const getQueueStatus = async (doctorId: string) => {
    const res = await query('SELECT q.*, p.name FROM queue q JOIN patients p ON q.patient_id = p.id WHERE q.doctor_id = ? ORDER BY q.position', [doctorId]);
    return res;
};

export const updateWaitTimes = async (doctorId: string, queue: any[]) => {
    for (const item of queue) {
        await run('UPDATE queue SET estimated_wait = ? WHERE id = ?', [item.estimatedWait, item.id]);
    }
};

// New methods for enhanced features
export const getPatientDetails = async (patientId: number) => {
    const res = await query('SELECT * FROM patients WHERE id = ?', [patientId]);
    return res[0];
};

export const getDoctorDetails = async (doctorId: number) => {
    const res = await query('SELECT * FROM doctors WHERE id = ?', [doctorId]);
    return res[0];
};

export const getExternalFactors = async (date: string) => {
    const res = await query('SELECT * FROM external_factors WHERE date = ?', [date]);
    return res[0] || { weather_condition: 'clear', traffic_level: 0, hospital_occupancy: 0.5 };
};

export const addFeedback = async (appointmentId: number, rating: number, actualWait: number, comments: string) => {
    await run('INSERT INTO feedback (appointment_id, patient_rating, actual_wait, comments) VALUES (?, ?, ?, ?)', [appointmentId, rating, actualWait, comments]);
};

export const detectAnomaly = async (doctorId: number, description: string, severity: string) => {
    await run('INSERT INTO anomalies (doctor_id, date, description, severity) VALUES (?, datetime(\'now\'), ?, ?)', [doctorId, description, severity]);
};

export const advanceStage = async (queueId: number, newStage: string) => {
    await run('UPDATE queue SET stage = ?, stage_start_time = datetime(\'now\') WHERE id = ?', [newStage, queueId]);
};

export const getStageDurations = async (doctorId: number) => {
    const stages = ['registration', 'triage', 'consultation'];
    const result: any = {};
    for (const stage of stages) {
        const res = await query('SELECT AVG(julianday(\'now\') - julianday(stage_start_time)) * 1440 as avg_duration FROM queue WHERE doctor_id = ? AND stage = ? AND stage_start_time IS NOT NULL', [doctorId, stage]);
        result[stage] = res[0].avg_duration || 10;
    }
    return result;
};

// Auth methods
export const getUserByUsername = async (username: string) => {
    const res = await query('SELECT * FROM users WHERE username = ?', [username]);
    return res[0];
};

export const createUser = async (username: string, passwordHash: string, role: string, doctorId?: number) => {
    await run('INSERT INTO users (username, password_hash, role, doctor_id) VALUES (?, ?, ?, ?)', [username, passwordHash, role, doctorId]);
};

// ==========================================
// Doctor Schedule Management
// ==========================================

export const getDoctorSchedule = async (doctorId: number) => {
    const res = await query('SELECT working_hours, break_time, slot_duration_minutes, max_patients_per_day FROM doctors WHERE id = ?', [doctorId]);
    if (!res[0]) return null;
    return {
        workingHours: JSON.parse(res[0].working_hours || '{}'),
        breakTime: JSON.parse(res[0].break_time || '{}'),
        slotDuration: res[0].slot_duration_minutes,
        maxPatientsPerDay: res[0].max_patients_per_day
    };
};

export const updateDoctorSchedule = async (doctorId: number, schedule: {
    workingHours?: any,
    breakTime?: any,
    slotDuration?: number,
    maxPatientsPerDay?: number
}) => {
    const updates: string[] = [];
    const params: any[] = [];
    
    if (schedule.workingHours) {
        updates.push('working_hours = ?');
        params.push(JSON.stringify(schedule.workingHours));
    }
    if (schedule.breakTime) {
        updates.push('break_time = ?');
        params.push(JSON.stringify(schedule.breakTime));
    }
    if (schedule.slotDuration) {
        updates.push('slot_duration_minutes = ?');
        params.push(schedule.slotDuration);
    }
    if (schedule.maxPatientsPerDay) {
        updates.push('max_patients_per_day = ?');
        params.push(schedule.maxPatientsPerDay);
    }
    
    if (updates.length > 0) {
        params.push(doctorId);
        await run(`UPDATE doctors SET ${updates.join(', ')} WHERE id = ?`, params);
    }
};

export const generateAvailableSlots = async (doctorId: number, daysAhead: number = 7) => {
    const schedule = await getDoctorSchedule(doctorId);
    if (!schedule) return [];
    
    const slots: string[] = [];
    const today = new Date();
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    
    // Get existing booked appointments for the period
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + daysAhead);
    const bookedSlots = await query(
        'SELECT appointment_time FROM appointments WHERE doctor_id = ? AND status IN ("booked", "in_queue") AND appointment_time >= datetime("now")',
        [doctorId]
    );
    const bookedTimes = new Set(bookedSlots.map(b => b.appointment_time));
    
    for (let d = 1; d <= daysAhead; d++) {
        const date = new Date(today);
        date.setDate(date.getDate() + d);
        const dayName = dayNames[date.getDay()];
        const daySchedule = schedule.workingHours[dayName];
        
        if (!daySchedule) continue; // No work on this day
        
        const [startHour, startMin] = daySchedule.start.split(':').map(Number);
        const [endHour, endMin] = daySchedule.end.split(':').map(Number);
        const [breakStartHour, breakStartMin] = (schedule.breakTime.start || '12:00').split(':').map(Number);
        const [breakEndHour, breakEndMin] = (schedule.breakTime.end || '13:00').split(':').map(Number);
        
        const slotDuration = schedule.slotDuration || 30;
        
        // Generate slots
        let currentTime = new Date(date);
        currentTime.setHours(startHour, startMin, 0, 0);
        
        const dayEndTime = new Date(date);
        dayEndTime.setHours(endHour, endMin, 0, 0);
        
        while (currentTime < dayEndTime) {
            const hour = currentTime.getHours();
            const min = currentTime.getMinutes();
            
            // Skip break time
            if (
                (hour > breakStartHour || (hour === breakStartHour && min >= breakStartMin)) &&
                (hour < breakEndHour || (hour === breakEndHour && min < breakEndMin))
            ) {
                currentTime.setMinutes(currentTime.getMinutes() + slotDuration);
                continue;
            }
            
            const slotTimeISO = currentTime.toISOString();
            
            // Check if not already booked
            if (!bookedTimes.has(slotTimeISO)) {
                slots.push(slotTimeISO);
            }
            
            currentTime.setMinutes(currentTime.getMinutes() + slotDuration);
        }
    }
    
    // Update doctor's available_slots
    await setAvailableSlots(doctorId, slots.map(s => new Date(s)));
    
    return slots;
};

// ==========================================
// Appointment Lookup & Management
// ==========================================

export const getAppointmentByCode = async (confirmationCode: string) => {
    const res = await query(
        `SELECT a.*, p.name as patient_name, p.email, p.phone, d.name as doctor_name, d.specialty 
         FROM appointments a 
         JOIN patients p ON a.patient_id = p.id 
         JOIN doctors d ON a.doctor_id = d.id 
         WHERE a.confirmation_code = ?`,
        [confirmationCode.toUpperCase()]
    );
    return res[0];
};

export const cancelAppointment = async (confirmationCode: string) => {
    await run(
        'UPDATE appointments SET status = "cancelled" WHERE confirmation_code = ?',
        [confirmationCode.toUpperCase()]
    );
};

export const checkInAppointment = async (confirmationCode: string) => {
    const appointment = await getAppointmentByCode(confirmationCode);
    if (!appointment) return null;
    
    await run(
        'UPDATE appointments SET status = "in_queue", check_in_time = datetime("now") WHERE confirmation_code = ?',
        [confirmationCode.toUpperCase()]
    );
    
    // Add to queue
    await addToQueue(appointment.doctor_id.toString(), appointment.patient_id);
    
    return appointment;
};

export const getAllDoctors = async () => {
    return await query('SELECT id, name, specialty, slot_duration_minutes, max_patients_per_day, is_active FROM doctors WHERE is_active = 1');
};

export const createDoctor = async (name: string, specialty: string, experienceYears: number = 0) => {
    const res = await run(
        'INSERT INTO doctors (name, specialty, experience_years) VALUES (?, ?, ?)',
        [name, specialty, experienceYears]
    );
    return { id: res.lastID };
};

// ==========================================
// Patient Authentication
// ==========================================

export const getPatientUserByEmail = async (email: string) => {
    const res = await query(
        `SELECT pu.*, p.name, p.phone as patient_phone, p.age, p.gender 
         FROM patient_users pu 
         LEFT JOIN patients p ON pu.patient_id = p.id 
         WHERE pu.email = ?`,
        [email.toLowerCase()]
    );
    return res[0];
};

export const createPatientUser = async (data: {
    email: string;
    phone: string;
    passwordHash: string;
    name: string;
    age?: number;
    gender?: string;
    dateOfBirth?: string;
    address?: string;
    bloodGroup?: string;
    emergencyContact?: string;
}) => {
    // First create the patient record
    const patientRes = await run(
        `INSERT INTO patients (name, age, gender, date_of_birth, email, phone, address, blood_group, emergency_contact) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [data.name, data.age || null, data.gender || null, data.dateOfBirth || null, 
         data.email.toLowerCase(), data.phone, data.address || null, data.bloodGroup || null, data.emergencyContact || null]
    );
    const patientId = patientRes.lastID;
    
    // Then create the patient user account
    const userRes = await run(
        'INSERT INTO patient_users (email, phone, password_hash, patient_id) VALUES (?, ?, ?, ?)',
        [data.email.toLowerCase(), data.phone, data.passwordHash, patientId]
    );
    
    return { id: userRes.lastID, patientId };
};

export const getPatientProfile = async (patientUserId: number) => {
    const res = await query(
        `SELECT pu.id as user_id, pu.email, pu.phone, pu.is_verified, pu.created_at as account_created,
                p.id as patient_id, p.name, p.age, p.gender, p.date_of_birth, p.address, 
                p.blood_group, p.emergency_contact
         FROM patient_users pu 
         JOIN patients p ON pu.patient_id = p.id 
         WHERE pu.id = ?`,
        [patientUserId]
    );
    return res[0];
};

export const updatePatientProfile = async (patientId: number, data: {
    name?: string;
    age?: number;
    gender?: string;
    phone?: string;
    address?: string;
    bloodGroup?: string;
    emergencyContact?: string;
}) => {
    const updates: string[] = [];
    const params: any[] = [];
    
    if (data.name) { updates.push('name = ?'); params.push(data.name); }
    if (data.age) { updates.push('age = ?'); params.push(data.age); }
    if (data.gender) { updates.push('gender = ?'); params.push(data.gender); }
    if (data.phone) { updates.push('phone = ?'); params.push(data.phone); }
    if (data.address) { updates.push('address = ?'); params.push(data.address); }
    if (data.bloodGroup) { updates.push('blood_group = ?'); params.push(data.bloodGroup); }
    if (data.emergencyContact) { updates.push('emergency_contact = ?'); params.push(data.emergencyContact); }
    
    if (updates.length > 0) {
        params.push(patientId);
        await run(`UPDATE patients SET ${updates.join(', ')} WHERE id = ?`, params);
    }
};

export const getPatientAppointments = async (patientId: number) => {
    return await query(
        `SELECT a.*, d.name as doctor_name, d.specialty 
         FROM appointments a 
         JOIN doctors d ON a.doctor_id = d.id 
         WHERE a.patient_id = ? 
         ORDER BY a.appointment_time DESC`,
        [patientId]
    );
};

// ==========================================
// Multi-Queue System
// ==========================================

export const getQueueTypes = async () => {
    return await query('SELECT * FROM queue_types WHERE is_active = 1 ORDER BY id');
};

export const getQueueByType = async (queueTypeId: number, doctorId?: number) => {
    let sql = `
        SELECT q.*, p.name as patient_name, p.phone, qt.name as queue_type_name, qt.color,
               d.name as doctor_name
        FROM queue q 
        JOIN patients p ON q.patient_id = p.id 
        JOIN queue_types qt ON q.queue_type_id = qt.id
        LEFT JOIN doctors d ON q.doctor_id = d.id
        WHERE q.queue_type_id = ?
    `;
    const params: any[] = [queueTypeId];
    
    if (doctorId) {
        sql += ' AND q.doctor_id = ?';
        params.push(doctorId);
    }
    
    sql += ' ORDER BY q.position';
    return await query(sql, params);
};

export const addToQueueWithType = async (
    queueTypeId: number, 
    patientId: number, 
    doctorId?: number,
    notes?: string,
    transferredFrom?: number
) => {
    // Get max position for this queue type
    const maxPos = await query(
        'SELECT MAX(position) as pos FROM queue WHERE queue_type_id = ?',
        [queueTypeId]
    );
    const position = (maxPos[0]?.pos || 0) + 1;
    
    const res = await run(
        `INSERT INTO queue (queue_type_id, doctor_id, patient_id, position, notes, transferred_from, check_in_time) 
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
        [queueTypeId, doctorId || null, patientId, position, notes || null, transferredFrom || null]
    );
    
    return { id: res.lastID, position };
};

export const transferToQueue = async (
    currentQueueId: number, 
    newQueueTypeId: number, 
    newDoctorId?: number,
    notes?: string
) => {
    // Get current queue entry
    const current = await query('SELECT * FROM queue WHERE id = ?', [currentQueueId]);
    if (!current[0]) throw new Error('Queue entry not found');
    
    // Remove from current queue
    await run('DELETE FROM queue WHERE id = ?', [currentQueueId]);
    
    // Add to new queue
    return await addToQueueWithType(
        newQueueTypeId, 
        current[0].patient_id, 
        newDoctorId,
        notes,
        currentQueueId
    );
};

export const removeFromQueue = async (queueId: number) => {
    await run('DELETE FROM queue WHERE id = ?', [queueId]);
};

export const getAllQueuesStatus = async () => {
    const queueTypes = await getQueueTypes();
    const result: any[] = [];
    
    for (const qt of queueTypes) {
        const count = await query('SELECT COUNT(*) as count FROM queue WHERE queue_type_id = ?', [qt.id]);
        result.push({
            ...qt,
            patientCount: count[0].count
        });
    }
    
    return result;
};

export const getDoctorsBySpecialty = async (specialty?: string) => {
    if (specialty) {
        return await query(
            'SELECT * FROM doctors WHERE specialty = ? AND is_active = 1',
            [specialty]
        );
    }
    return await query('SELECT * FROM doctors WHERE is_active = 1');
};

// ==========================================
// MEDICAL REPORTS & PRESCRIPTIONS
// ==========================================

export const createMedicalReport = async (data: {
    patientId: number;
    doctorId: number;
    appointmentId?: number;
    diagnosis?: string;
    symptoms?: string;
    notes?: string;
    vitalSigns?: any;
    labTestsOrdered?: string[];
}) => {
    const res = await run(
        `INSERT INTO medical_reports (patient_id, doctor_id, appointment_id, diagnosis, symptoms, notes, vital_signs, lab_tests_ordered, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed')`,
        [
            data.patientId,
            data.doctorId,
            data.appointmentId || null,
            data.diagnosis || null,
            data.symptoms || null,
            data.notes || null,
            data.vitalSigns ? JSON.stringify(data.vitalSigns) : null,
            data.labTestsOrdered ? JSON.stringify(data.labTestsOrdered) : null
        ]
    );
    return { id: res.lastID };
};

export const addPrescriptionToReport = async (data: {
    reportId: number;
    medicineName: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    instructions?: string;
}) => {
    const res = await run(
        `INSERT INTO prescriptions (report_id, medicine_name, dosage, frequency, duration, instructions)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [data.reportId, data.medicineName, data.dosage || null, data.frequency || null, data.duration || null, data.instructions || null]
    );
    return { id: res.lastID };
};

export const getMedicalReportById = async (reportId: number) => {
    const report = await query(
        `SELECT r.*, p.name as patient_name, d.name as doctor_name, d.specialty
         FROM medical_reports r
         JOIN patients p ON r.patient_id = p.id
         JOIN doctors d ON r.doctor_id = d.id
         WHERE r.id = ?`,
        [reportId]
    );
    
    if (!report[0]) return null;
    
    const prescriptions = await query(
        `SELECT p.*, u.username as dispensed_by_name 
         FROM prescriptions p
         LEFT JOIN users u ON p.dispensed_by = u.id
         WHERE p.report_id = ?`,
        [reportId]
    );
    
    return {
        ...report[0],
        vital_signs: report[0].vital_signs ? JSON.parse(report[0].vital_signs) : null,
        lab_tests_ordered: report[0].lab_tests_ordered ? JSON.parse(report[0].lab_tests_ordered) : [],
        prescriptions
    };
};

export const getMedicalReportsByPatient = async (patientId: number) => {
    const reports = await query(
        `SELECT r.*, d.name as doctor_name, d.specialty
         FROM medical_reports r
         JOIN doctors d ON r.doctor_id = d.id
         WHERE r.patient_id = ? AND r.status = 'completed'
         ORDER BY r.created_at DESC`,
        [patientId]
    );
    return reports;
};

export const getMedicalReportsByDoctor = async (doctorId: number) => {
    const reports = await query(
        `SELECT r.*, p.name as patient_name
         FROM medical_reports r
         JOIN patients p ON r.patient_id = p.id
         WHERE r.doctor_id = ?
         ORDER BY r.created_at DESC`,
        [doctorId]
    );
    return reports;
};

export const getAllMedicalReports = async (status?: string) => {
    let sql = `
        SELECT r.*, p.name as patient_name, d.name as doctor_name, d.specialty,
               (SELECT COUNT(*) FROM prescriptions WHERE report_id = r.id) as prescription_count,
               (SELECT COUNT(*) FROM prescriptions WHERE report_id = r.id AND dispensed = 0) as pending_prescriptions
        FROM medical_reports r
        JOIN patients p ON r.patient_id = p.id
        JOIN doctors d ON r.doctor_id = d.id
    `;
    
    if (status) {
        sql += ` WHERE r.status = ?`;
    }
    sql += ` ORDER BY r.created_at DESC`;
    
    return status ? await query(sql, [status]) : await query(sql);
};

export const getPendingPrescriptions = async () => {
    return await query(
        `SELECT p.*, r.patient_id, r.doctor_id, pt.name as patient_name, d.name as doctor_name
         FROM prescriptions p
         JOIN medical_reports r ON p.report_id = r.id
         JOIN patients pt ON r.patient_id = pt.id
         JOIN doctors d ON r.doctor_id = d.id
         WHERE p.dispensed = 0
         ORDER BY p.created_at ASC`
    );
};

export const dispensePrescription = async (prescriptionId: number, dispensedBy: number) => {
    await run(
        `UPDATE prescriptions SET dispensed = 1, dispensed_by = ?, dispensed_at = datetime('now')
         WHERE id = ?`,
        [dispensedBy, prescriptionId]
    );
};

export const dispenseAllPrescriptionsForReport = async (reportId: number, dispensedBy: number) => {
    await run(
        `UPDATE prescriptions SET dispensed = 1, dispensed_by = ?, dispensed_at = datetime('now')
         WHERE report_id = ? AND dispensed = 0`,
        [dispensedBy, reportId]
    );
};

// ==========================================
// BILLING
// ==========================================

export const createBill = async (data: {
    patientId: number;
    appointmentId?: number;
    reportId?: number;
    items: { description: string; amount: number }[];
    tax?: number;
    discount?: number;
}) => {
    const subtotal = data.items.reduce((sum, item) => sum + item.amount, 0);
    const tax = data.tax || 0;
    const discount = data.discount || 0;
    const total = subtotal + tax - discount;
    
    const res = await run(
        `INSERT INTO bills (patient_id, appointment_id, report_id, items, subtotal, tax, discount, total, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
            data.patientId,
            data.appointmentId || null,
            data.reportId || null,
            JSON.stringify(data.items),
            subtotal,
            tax,
            discount,
            total
        ]
    );
    return { id: res.lastID, total };
};

export const getBillsByPatient = async (patientId: number) => {
    const bills = await query(
        `SELECT b.*, d.name as doctor_name
         FROM bills b
         LEFT JOIN medical_reports r ON b.report_id = r.id
         LEFT JOIN doctors d ON r.doctor_id = d.id
         WHERE b.patient_id = ?
         ORDER BY b.created_at DESC`,
        [patientId]
    );
    return bills.map((b: any) => ({
        ...b,
        items: JSON.parse(b.items || '[]')
    }));
};

export const updateBillStatus = async (billId: number, status: string, paymentMethod?: string) => {
    if (status === 'paid') {
        await run(
            `UPDATE bills SET status = ?, payment_method = ?, paid_at = datetime('now') WHERE id = ?`,
            [status, paymentMethod || 'cash', billId]
        );
    } else {
        await run('UPDATE bills SET status = ? WHERE id = ?', [status, billId]);
    }
};