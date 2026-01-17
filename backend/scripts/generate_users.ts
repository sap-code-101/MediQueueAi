/**
 * User Generation Script for MediQueueAI
 * 
 * Run with: bun run scripts/generate_users.ts
 * 
 * This script generates admin, doctor, and receptionist accounts
 * with credentials that can be viewed by anyone with codebase access.
 */

import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs';

// Bun-specific: import.meta.dir
declare global {
    interface ImportMeta {
        dir: string;
    }
}

const DB_PATH = path.join(import.meta.dir, '../../database/queue.db');

// ===========================================
// DEFAULT USER CREDENTIALS
// These are visible to anyone with codebase access
// ===========================================

const DEFAULT_USERS = {
  admin: {
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    displayName: 'System Administrator'
  },
  doctors: [
    {
      username: 'dr.smith',
      password: 'doctor123',
      displayName: 'Dr. Sarah Smith',
      specialty: 'General Medicine',
      experienceYears: 15
    },
    {
      username: 'dr.johnson',
      password: 'doctor123',
      displayName: 'Dr. Michael Johnson',
      specialty: 'Cardiology',
      experienceYears: 12
    },
    {
      username: 'dr.patel',
      password: 'doctor123',
      displayName: 'Dr. Priya Patel',
      specialty: 'Pediatrics',
      experienceYears: 8
    },
    {
      username: 'dr.chen',
      password: 'doctor123',
      displayName: 'Dr. David Chen',
      specialty: 'Orthopedics',
      experienceYears: 20
    }
  ],
  receptionists: [
    {
      username: 'reception1',
      password: 'reception123',
      displayName: 'Emily Davis'
    },
    {
      username: 'reception2',
      password: 'reception123',
      displayName: 'James Wilson'
    }
  ]
};

// ===========================================
// SCRIPT LOGIC
// ===========================================

async function initDatabase(db: Database) {
  // Create tables if they don't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'doctor', 'receptionist')),
      doctor_id INTEGER,
      display_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (doctor_id) REFERENCES doctors(id)
    );

    CREATE TABLE IF NOT EXISTS doctors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      specialty TEXT,
      experience_years INTEGER DEFAULT 0,
      available_slots TEXT DEFAULT '[]',
      avg_consultation_time INTEGER DEFAULT 15,
      working_hours TEXT DEFAULT '{"mon":{"start":"09:00","end":"17:00"},"tue":{"start":"09:00","end":"17:00"},"wed":{"start":"09:00","end":"17:00"},"thu":{"start":"09:00","end":"17:00"},"fri":{"start":"09:00","end":"17:00"}}',
      break_time TEXT DEFAULT '{"start":"12:00","end":"13:00"}',
      slot_duration_minutes INTEGER DEFAULT 30,
      max_patients_per_day INTEGER DEFAULT 20,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      age INTEGER,
      priority TEXT DEFAULT 'normal',
      visit_type TEXT DEFAULT 'general',
      no_show_rate REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER,
      doctor_id INTEGER,
      appointment_time DATETIME,
      status TEXT DEFAULT 'scheduled',
      actual_duration INTEGER,
      predicted_wait INTEGER,
      confirmation_code TEXT UNIQUE,
      check_in_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (doctor_id) REFERENCES doctors(id)
    );

    CREATE TABLE IF NOT EXISTS queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doctor_id INTEGER,
      patient_id INTEGER,
      position INTEGER,
      estimated_wait INTEGER DEFAULT 0,
      stage TEXT DEFAULT 'registration',
      stage_start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (doctor_id) REFERENCES doctors(id),
      FOREIGN KEY (patient_id) REFERENCES patients(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      read_status INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_id INTEGER,
      patient_rating INTEGER,
      actual_wait INTEGER,
      comments TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (appointment_id) REFERENCES appointments(id)
    );

    CREATE TABLE IF NOT EXISTS external_factors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATE,
      weather_condition TEXT,
      traffic_level INTEGER,
      hospital_occupancy REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function generateDefaultSlots(): string[] {
  const slots: string[] = [];
  const today = new Date();
  
  // Generate slots for the next 14 days
  for (let day = 0; day < 14; day++) {
    const date = new Date(today);
    date.setDate(date.getDate() + day);
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    
    // Morning slots: 9 AM to 12 PM
    for (let hour = 9; hour < 12; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const slot = new Date(date);
        slot.setHours(hour, min, 0, 0);
        slots.push(slot.toISOString());
      }
    }
    
    // Afternoon slots: 1 PM to 5 PM (skip lunch break)
    for (let hour = 13; hour < 17; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const slot = new Date(date);
        slot.setHours(hour, min, 0, 0);
        slots.push(slot.toISOString());
      }
    }
  }
  
  return slots;
}

async function generateUsers() {
  console.log('\n🏥 MediQueueAI User Generation Script\n');
  console.log('='.repeat(50));

  // Ensure database directory exists
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });
  
  try {
    await initDatabase(db);

    // Clear existing data for clean setup
    console.log('\n🗑️  Clearing existing users and doctors...');
    await db.exec('DELETE FROM users');
    await db.exec('DELETE FROM doctors');

    const createdUsers: { role: string; username: string; password: string; name: string }[] = [];

    // Default schedule for all doctors
    const defaultWorkingHours = {
      mon: { start: '09:00', end: '17:00' },
      tue: { start: '09:00', end: '17:00' },
      wed: { start: '09:00', end: '17:00' },
      thu: { start: '09:00', end: '17:00' },
      fri: { start: '09:00', end: '17:00' }
    };
    const defaultBreakTime = { start: '12:00', end: '13:00' };

    // Create Admin
    console.log('\n👤 Creating Admin Account...');
    const adminHash = await bcrypt.hash(DEFAULT_USERS.admin.password, 10);
    await db.run(
      `INSERT INTO users (username, password_hash, role, display_name) VALUES (?, ?, ?, ?)`,
      DEFAULT_USERS.admin.username,
      adminHash,
      DEFAULT_USERS.admin.role,
      DEFAULT_USERS.admin.displayName
    );
    createdUsers.push({
      role: 'Admin',
      username: DEFAULT_USERS.admin.username,
      password: DEFAULT_USERS.admin.password,
      name: DEFAULT_USERS.admin.displayName
    });

    // Create Doctors
    console.log('\n👨‍⚕️ Creating Doctor Accounts...');
    for (const doctor of DEFAULT_USERS.doctors) {
      // First create the doctor profile with schedule
      const result = await db.run(
        `INSERT INTO doctors (name, specialty, experience_years, available_slots, working_hours, break_time, slot_duration_minutes, max_patients_per_day) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        doctor.displayName,
        doctor.specialty,
        doctor.experienceYears,
        JSON.stringify(generateDefaultSlots()),
        JSON.stringify(defaultWorkingHours),
        JSON.stringify(defaultBreakTime),
        30,
        20
      );

      const doctorId = result.lastID;

      // Then create the user account linked to the doctor
      const passwordHash = await bcrypt.hash(doctor.password, 10);
      await db.run(
        `INSERT INTO users (username, password_hash, role, doctor_id, display_name) VALUES (?, ?, 'doctor', ?, ?)`,
        doctor.username,
        passwordHash,
        doctorId,
        doctor.displayName
      );

      createdUsers.push({
        role: 'Doctor',
        username: doctor.username,
        password: doctor.password,
        name: doctor.displayName
      });
    }

    // Create Receptionists
    console.log('\n💼 Creating Receptionist Accounts...');
    for (const receptionist of DEFAULT_USERS.receptionists) {
      const passwordHash = await bcrypt.hash(receptionist.password, 10);
      await db.run(
        `INSERT INTO users (username, password_hash, role, display_name) VALUES (?, ?, 'receptionist', ?)`,
        receptionist.username,
        passwordHash,
        receptionist.displayName
      );

      createdUsers.push({
        role: 'Receptionist',
        username: receptionist.username,
        password: receptionist.password,
        name: receptionist.displayName
      });
    }

    // Print credentials
    console.log('\n' + '='.repeat(50));
    console.log('✅ USER GENERATION COMPLETE');
    console.log('='.repeat(50));
    console.log('\n📋 GENERATED CREDENTIALS:\n');

    console.log('┌─────────────────────────────────────────────────────────────────┐');
    console.log('│  Role         │  Username      │  Password     │  Name         │');
    console.log('├─────────────────────────────────────────────────────────────────┤');
    
    for (const user of createdUsers) {
      const role = user.role.padEnd(12);
      const username = user.username.padEnd(14);
      const password = user.password.padEnd(13);
      const name = user.name.substring(0, 14).padEnd(14);
      console.log(`│  ${role}│  ${username}│  ${password}│  ${name}│`);
    }
    
    console.log('└─────────────────────────────────────────────────────────────────┘');

    console.log('\n⚠️  These credentials are for development/testing.');
    console.log('   Change them in production environments!\n');

    // Save credentials to a file for easy reference
    const credentialsPath = path.join(import.meta.dir, '../../CREDENTIALS.md');
    const credentialsContent = `# MediQueueAI Default Credentials

> ⚠️ **Warning**: These are default credentials for development/testing only.
> Change them immediately in production environments!

## Generated: ${new Date().toISOString()}

### Admin Account
| Username | Password | Role |
|----------|----------|------|
| ${DEFAULT_USERS.admin.username} | ${DEFAULT_USERS.admin.password} | Administrator |

### Doctor Accounts
| Username | Password | Name | Specialty |
|----------|----------|------|-----------|
${DEFAULT_USERS.doctors.map(d => `| ${d.username} | ${d.password} | ${d.displayName} | ${d.specialty} |`).join('\n')}

### Receptionist Accounts
| Username | Password | Name |
|----------|----------|------|
${DEFAULT_USERS.receptionists.map(r => `| ${r.username} | ${r.password} | ${r.displayName} |`).join('\n')}

---

## Patients
Patients do not require login. They can book appointments directly through the public patient portal.

## Confirmation Codes
When patients book appointments, they receive a unique confirmation code (format: QD-XXXXXX).
They can use this code to:
- Look up their appointment details
- Check in when they arrive
- Cancel their appointment
`;

    fs.writeFileSync(credentialsPath, credentialsContent);
    console.log(`📄 Credentials saved to: ${credentialsPath}\n`);

  } finally {
    await db.close();
  }
}

// Run the script
generateUsers().catch(console.error);
