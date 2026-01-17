import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getUserByUsername, createUser, query, run, getPatientUserByEmail, createPatientUser, getPatientProfile } from '../utils/database';

const JWT_SECRET = process.env.JWT_SECRET || 'mediqueueai-secret-key-change-in-production';

class AuthController {
    // Staff login (admin, doctor, receptionist)
    async login(username: string, password: string) {
        const user = await getUserByUsername(username);
        if (!user || !await bcrypt.compare(password, user.password_hash)) {
            throw new Error('Invalid credentials');
        }
        
        // Get user's display name (doctor name if applicable)
        let displayName = user.username;
        if (user.doctor_id) {
            const doctor = await query('SELECT name FROM doctors WHERE id = ?', [user.doctor_id]);
            if (doctor[0]) displayName = doctor[0].name;
        }
        
        const token = jwt.sign({ 
            id: user.id, 
            role: user.role, 
            doctorId: user.doctor_id,
            username: user.username,
            userType: 'staff'
        }, JWT_SECRET, { expiresIn: '8h' });
        
        return { token, role: user.role, doctorId: user.doctor_id, displayName, userType: 'staff' };
    }

    // Patient login
    async patientLogin(email: string, password: string) {
        const user = await getPatientUserByEmail(email);
        if (!user || !await bcrypt.compare(password, user.password_hash)) {
            throw new Error('Invalid email or password');
        }
        
        const token = jwt.sign({ 
            id: user.id, 
            patientId: user.patient_id,
            email: user.email,
            name: user.name,
            userType: 'patient'
        }, JWT_SECRET, { expiresIn: '24h' });
        
        return { 
            token, 
            patientId: user.patient_id, 
            name: user.name, 
            email: user.email,
            userType: 'patient' 
        };
    }

    // Patient registration
    async patientRegister(data: {
        email: string;
        phone: string;
        password: string;
        name: string;
        age?: number;
        gender?: string;
        dateOfBirth?: string;
        address?: string;
        bloodGroup?: string;
        emergencyContact?: string;
    }) {
        // Check if email already exists
        const existing = await getPatientUserByEmail(data.email);
        if (existing) {
            throw new Error('An account with this email already exists');
        }
        
        // Validate required fields
        if (!data.email || !data.password || !data.name || !data.phone) {
            throw new Error('Email, password, name, and phone are required');
        }
        
        // Hash password
        const passwordHash = await bcrypt.hash(data.password, 10);
        
        // Create patient user
        const result = await createPatientUser({
            ...data,
            passwordHash
        });
        
        // Generate token for auto-login
        const token = jwt.sign({ 
            id: result.id, 
            patientId: result.patientId,
            email: data.email,
            name: data.name,
            userType: 'patient'
        }, JWT_SECRET, { expiresIn: '24h' });
        
        return { 
            message: 'Account created successfully', 
            token,
            patientId: result.patientId,
            name: data.name,
            userType: 'patient'
        };
    }

    // Get patient profile
    async getPatientProfile(patientUserId: number) {
        return await getPatientProfile(patientUserId);
    }

    // Staff registration (admin only)
    async register(username: string, password: string, role: string, doctorId?: number) {
        // Check if user already exists
        const existing = await getUserByUsername(username);
        if (existing) {
            throw new Error('Username already exists');
        }
        const hash = await bcrypt.hash(password, 10);
        await createUser(username, hash, role, doctorId);
        return { message: 'User created' };
    }

    verifyToken(token: string) {
        return jwt.verify(token, JWT_SECRET);
    }
    
    // License management
    async activateLicense(licenseKey: string, hospitalName: string) {
        // Validate license key format: MQAI-XXXX-XXXX-XXXX
        const licenseRegex = /^MQAI-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
        if (!licenseRegex.test(licenseKey)) {
            throw new Error('Invalid license key format');
        }
        
        // Check if license already activated
        const existing = await query('SELECT id FROM license WHERE license_key = ?', [licenseKey]);
        if (existing.length > 0) {
            throw new Error('License key already activated');
        }
        
        // Calculate expiry (1 year from now)
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        
        await run(
            'INSERT INTO license (license_key, hospital_name, expires_at) VALUES (?, ?, ?)',
            [licenseKey, hospitalName, expiresAt.toISOString()]
        );
        
        return { message: 'License activated successfully', expiresAt: expiresAt.toISOString() };
    }
    
    async getLicenseStatus() {
        const license = await query('SELECT * FROM license ORDER BY activated_at DESC LIMIT 1');
        if (license.length === 0) {
            return { activated: false };
        }
        
        const lic = license[0];
        const isExpired = new Date(lic.expires_at) < new Date();
        
        return {
            activated: true,
            hospitalName: lic.hospital_name,
            expiresAt: lic.expires_at,
            status: isExpired ? 'expired' : lic.status,
            features: JSON.parse(lic.features || '{}')
        };
    }
    
    // Change password (staff)
    async changePassword(userId: number, currentPassword: string, newPassword: string) {
        const user = await query('SELECT * FROM users WHERE id = ?', [userId]);
        if (!user[0] || !await bcrypt.compare(currentPassword, user[0].password_hash)) {
            throw new Error('Current password is incorrect');
        }
        
        const newHash = await bcrypt.hash(newPassword, 10);
        await run('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);
        return { message: 'Password changed successfully' };
    }
    
    // Change password (patient)
    async changePatientPassword(patientUserId: number, currentPassword: string, newPassword: string) {
        const user = await query('SELECT * FROM patient_users WHERE id = ?', [patientUserId]);
        if (!user[0] || !await bcrypt.compare(currentPassword, user[0].password_hash)) {
            throw new Error('Current password is incorrect');
        }
        
        const newHash = await bcrypt.hash(newPassword, 10);
        await run('UPDATE patient_users SET password_hash = ? WHERE id = ?', [newHash, patientUserId]);
        return { message: 'Password changed successfully' };
    }
}

export default new AuthController();