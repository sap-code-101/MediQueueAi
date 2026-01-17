import express from 'express';
import multer from 'multer';
import { spawn } from 'child_process';
import path from 'path';
import BookingController from '../controllers/booking';
import QueueController from '../controllers/queue';
import * as database from '../utils/database';
import authController from '../controllers/auth';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Middleware for protected routes (staff)
const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    try {
        req.user = authController.verifyToken(token);
        next();
    } catch (e: any) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Middleware for patient authentication
const authenticatePatient = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    try {
        const decoded = authController.verifyToken(token) as any;
        if (decoded.userType !== 'patient') {
            return res.status(403).json({ error: 'Patient access only' });
        }
        req.patient = decoded;
        next();
    } catch (e: any) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

const bookingController = new BookingController(database);
const queueController = new QueueController(database);

// ==========================================
// Staff Auth Routes (admin, doctor, receptionist)
// ==========================================
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await authController.login(username, password);
        res.json(result);
    } catch (e: any) {
        res.status(401).json({ error: e.message });
    }
});

router.post('/register', async (req, res) => {
    try {
        const { username, password, role, doctorId } = req.body;
        const result = await authController.register(username, password, role, doctorId);
        res.json(result);
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

// ==========================================
// Patient Auth Routes
// ==========================================
router.post('/patient/register', async (req, res) => {
    try {
        const result = await authController.patientRegister(req.body);
        res.json(result);
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

router.post('/patient/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await authController.patientLogin(email, password);
        res.json(result);
    } catch (e: any) {
        res.status(401).json({ error: e.message });
    }
});

router.get('/patient/profile', authenticatePatient, async (req, res) => {
    try {
        const profile = await authController.getPatientProfile(req.patient.id);
        res.json(profile);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.put('/patient/profile', authenticatePatient, async (req, res) => {
    try {
        await database.updatePatientProfile(req.patient.patientId, req.body);
        res.json({ message: 'Profile updated successfully' });
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

router.get('/patient/appointments', authenticatePatient, async (req, res) => {
    try {
        const appointments = await database.getPatientAppointments(req.patient.patientId);
        res.json(appointments);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/patient/change-password', authenticatePatient, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const result = await authController.changePatientPassword(req.patient.id, currentPassword, newPassword);
        res.json(result);
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

// ==========================================
// License management
// ==========================================
router.get('/license', async (req, res) => {
    try {
        const status = await authController.getLicenseStatus();
        res.json(status);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/license/activate', async (req, res) => {
    try {
        const { licenseKey, hospitalName } = req.body;
        if (!licenseKey || !hospitalName) {
            return res.status(400).json({ error: 'License key and hospital name are required' });
        }
        const result = await authController.activateLicense(licenseKey, hospitalName);
        res.json(result);
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

// Change password (staff - authenticated)
router.post('/change-password', authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new password are required' });
        }
        const result = await authController.changePassword(req.user.id, currentPassword, newPassword);
        res.json(result);
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

// Data import for retraining
router.post('/upload-data', authenticate, upload.single('file'), async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const filePath = req.file.path;
    // Move to ml/data
    const dest = path.join(__dirname, '../../../ml/data/historical_wait_times.csv');
    require('fs').renameSync(filePath, dest);
    // Retrain
    const pythonProcess = spawn('python', [path.join(__dirname, '../../../ml/scripts/train_model.py')]);
    pythonProcess.on('close', (code) => {
        if (code === 0) res.json({ message: 'Data uploaded and model retrained' });
        else res.status(500).json({ error: 'Retraining failed' });
    });
});

// Patients
router.get('/patients', authenticate, async (req, res) => {
    const patients = await database.query('SELECT * FROM patients');
    res.json(patients);
});

router.post('/patients', authenticate, async (req, res) => {
    const { name, age, priority } = req.body;
    const result = await database.run('INSERT INTO patients (name, age, priority) VALUES (?, ?, ?)', [name, age, priority]);
    res.json({ id: result.lastID });
});

router.post('/add-to-queue', authenticate, async (req, res) => {
    try {
        const { patientId, doctorId } = req.body;
        if (!patientId || !doctorId) {
            return res.status(400).json({ error: 'Patient ID and Doctor ID are required' });
        }
        await database.addToQueue(doctorId.toString(), patientId);
        res.json({ message: 'Added to queue', success: true });
    } catch (e: any) {
        console.error('Failed to add to queue:', e);
        res.status(500).json({ error: e.message || 'Failed to add patient to queue' });
    }
});

// User management (admin only)
router.post('/create-user', authenticate, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { username, password, role, doctorId } = req.body;
    if (!username || !password || !role) return res.status(400).json({ error: 'Missing fields' });
    try {
        await authController.register(username, password, role, doctorId);
        res.json({ message: 'User created' });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

router.get('/users', authenticate, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const users = await database.query('SELECT id, username, role FROM users');
    res.json(users);
});

router.delete('/users/:id', authenticate, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    try {
        const userId = parseInt(req.params.id);
        // Prevent self-deletion
        if (userId === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }
        await database.query('DELETE FROM users WHERE id = ?', [userId]);
        res.json({ message: 'User deleted successfully' });
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

// ==========================================
// Doctor Management (admin/receptionist)
// ==========================================

// Get all doctors (public - for patient booking)
router.get('/doctors', async (req, res) => {
    try {
        const doctors = await database.getAllDoctors();
        res.json(doctors);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Create doctor (admin only)
router.post('/doctors', authenticate, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { name, specialty, experienceYears } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    try {
        const result = await database.createDoctor(name, specialty, experienceYears);
        
        // Auto-generate available slots for the new doctor (7 days ahead)
        try {
            await database.generateAvailableSlots(result.id, 7);
        } catch (slotError) {
            console.log('Note: Could not auto-generate slots for new doctor');
        }
        
        res.json({ message: 'Doctor created', id: result.id });
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

// Get doctor schedule
router.get('/doctors/:id/schedule', authenticate, async (req, res) => {
    try {
        const schedule = await database.getDoctorSchedule(parseInt(req.params.id));
        if (!schedule) return res.status(404).json({ error: 'Doctor not found' });
        res.json(schedule);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Update doctor schedule (admin only)
router.put('/doctors/:id/schedule', authenticate, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    // Support both camelCase and snake_case
    const workingHours = req.body.working_hours || req.body.workingHours;
    const breakTime = req.body.break_time || req.body.breakTime;
    const slotDuration = req.body.slot_duration_minutes || req.body.slotDuration;
    const maxPatientsPerDay = req.body.max_patients_per_day || req.body.maxPatientsPerDay;
    try {
        await database.updateDoctorSchedule(parseInt(req.params.id), {
            workingHours,
            breakTime,
            slotDuration,
            maxPatientsPerDay
        });
        // Regenerate available slots after schedule update
        await database.generateAvailableSlots(parseInt(req.params.id), 14);
        res.json({ message: 'Schedule updated' });
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

// Generate/refresh available slots for a doctor
router.post('/doctors/:id/generate-slots', authenticate, async (req, res) => {
    if (!['admin', 'receptionist'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Admin or receptionist only' });
    }
    const daysAhead = req.body.daysAhead || 14;
    try {
        const slots = await database.generateAvailableSlots(parseInt(req.params.id), daysAhead);
        res.json({ message: 'Slots generated', count: slots.length, slots });
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

// ==========================================
// Booking routes (public for patients)
// ==========================================

router.post('/book', async (req, res) => {
    const { doctorId, patientName, patientEmail, patientPhone, slotTime } = req.body;
    if (!doctorId || !patientName || !slotTime) {
        return res.status(400).json({ error: 'Missing required fields: doctorId, patientName, slotTime' });
    }
    try {
        const result = await database.bookSlot(doctorId, {
            patientName,
            patientEmail,
            patientPhone,
            slotTime: new Date(slotTime)
        });
        res.json({ 
            success: true, 
            message: 'Appointment booked successfully!',
            confirmationCode: result.confirmationCode,
            appointmentId: result.id
        });
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

router.get('/available-slots/:doctorId', async (req, res) => {
    try {
        // First generate fresh slots based on schedule
        await database.generateAvailableSlots(parseInt(req.params.doctorId), 14);
        const slots = await database.getAvailableSlots(parseInt(req.params.doctorId));
        res.json(slots);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/check-slot-predict/:doctorId', async (req, res) => {
    const { slotTime } = req.body;
    const result = await bookingController.checkSlotAndPredict(req.params.doctorId, new Date(slotTime));
    res.json(result);
});

// ==========================================
// Appointment Lookup (for patients - public)
// ==========================================

// Lookup appointment by confirmation code
router.get('/appointment/:code', async (req, res) => {
    try {
        const appointment = await database.getAppointmentByCode(req.params.code);
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found. Please check your confirmation code.' });
        }
        res.json(appointment);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Cancel appointment
router.delete('/appointment/:code', async (req, res) => {
    try {
        const appointment = await database.getAppointmentByCode(req.params.code);
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        if (appointment.status === 'cancelled') {
            return res.status(400).json({ error: 'Appointment is already cancelled' });
        }
        await database.cancelAppointment(req.params.code);
        res.json({ message: 'Appointment cancelled successfully' });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Patient check-in with confirmation code
router.post('/check-in/:code', async (req, res) => {
    try {
        const result = await database.checkInAppointment(req.params.code);
        if (!result) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        res.json({ 
            message: 'Checked in successfully! Please take a seat.', 
            appointment: result 
        });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Feedback
router.post('/feedback', authenticate, async (req, res) => {
    const { appointmentId, rating, actualWait, comments } = req.body;
    await database.addFeedback(appointmentId, rating, actualWait, comments);
    res.json({ message: 'Feedback submitted' });
});

// EHR Integration (HL7 FHIR)
router.post('/fhir/Patient', authenticate, (req, res) => {
    const patient = req.body; // FHIR Patient resource
    const name = patient.name[0].given[0] + ' ' + patient.name[0].family;
    const age = Math.floor((new Date() - new Date(patient.birthDate)) / (365.25 * 24 * 60 * 60 * 1000));
    database.run('INSERT INTO patients (name, age, priority) VALUES (?, ?, ?)', [name, age, 'normal']);
    res.status(200).json({ message: 'Patient imported' });
});

router.get('/fhir/Encounter', authenticate, (req, res) => {
    res.json({ resourceType: 'Bundle', entry: [] });
});

// Queue management
router.get('/queue-status/:doctorId', authenticate, queueController.getQueueStatus.bind(queueController));
router.post('/advance-stage', authenticate, queueController.advanceStage.bind(queueController));
router.get('/multi-stage-status/:doctorId', authenticate, queueController.getMultiStageStatus.bind(queueController));

// Check-in patient from queue (receptionist)
router.post('/check-in', authenticate, async (req, res) => {
    try {
        const { queueId } = req.body;
        if (!queueId) {
            return res.status(400).json({ error: 'Queue ID is required' });
        }
        await database.run(
            'UPDATE queue SET check_in_time = datetime(\'now\'), stage = \'triage\' WHERE id = ?',
            [queueId]
        );
        res.json({ message: 'Patient checked in successfully' });
    } catch (e: any) {
        console.error('Check-in error:', e);
        res.status(500).json({ error: e.message || 'Failed to check in patient' });
    }
});

// Complete appointment (remove from queue)
router.post('/complete-appointment', authenticate, async (req, res) => {
    try {
        const { queueId, doctorId } = req.body;
        if (!queueId) {
            return res.status(400).json({ error: 'Queue ID is required' });
        }
        await database.run('DELETE FROM queue WHERE id = ?', [queueId]);
        res.json({ message: 'Appointment completed and removed from queue' });
    } catch (e: any) {
        console.error('Complete appointment error:', e);
        res.status(500).json({ error: e.message || 'Failed to complete appointment' });
    }
});

router.post('/update-slot-time/:doctorId', queueController.updateSlotTime.bind(queueController));

// Notifications
router.get('/notifications', authenticate, async (req, res) => {
    const notifications = await database.query(
        'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
        [req.user.id]
    );
    res.json(notifications);
});

router.post('/notifications/:id/read', authenticate, async (req, res) => {
    await database.run(
        'UPDATE notifications SET read_status = "read" WHERE id = ? AND user_id = ?',
        [req.params.id, req.user.id]
    );
    res.json({ message: 'Notification marked as read' });
});

// ==========================================
// ML Prediction Routes
// ==========================================

// Predict wait time for a patient
router.post('/predict/wait-time', async (req, res) => {
    const { queueLength, specialty, appointmentTime, doctorAvgTime } = req.body;
    try {
        const pythonProcess = spawn('python3', [
            path.join(__dirname, '../services/ml_predictions.py'),
            'predict_wait',
            String(queueLength || 0),
            specialty || 'General',
            appointmentTime || '',
            String(doctorAvgTime || 0)
        ]);
        
        let result = '';
        pythonProcess.stdout.on('data', (data) => { result += data.toString(); });
        pythonProcess.stderr.on('data', (data) => { console.error('ML Error:', data.toString()); });
        
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                try {
                    res.json(JSON.parse(result));
                } catch (e) {
                    res.status(500).json({ error: 'Invalid ML response' });
                }
            } else {
                res.status(500).json({ error: 'ML prediction failed' });
            }
        });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Predict slot availability
router.post('/predict/slot-availability', async (req, res) => {
    const { doctorId, slotTime, currentBookings } = req.body;
    try {
        const pythonProcess = spawn('python3', [
            path.join(__dirname, '../services/ml_predictions.py'),
            'predict_slot',
            String(doctorId || 1),
            slotTime || new Date().toISOString(),
            String(currentBookings || 0)
        ]);
        
        let result = '';
        pythonProcess.stdout.on('data', (data) => { result += data.toString(); });
        pythonProcess.stderr.on('data', (data) => { console.error('ML Error:', data.toString()); });
        
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                try {
                    res.json(JSON.parse(result));
                } catch (e) {
                    res.status(500).json({ error: 'Invalid ML response' });
                }
            } else {
                res.status(500).json({ error: 'ML prediction failed' });
            }
        });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Get current queue with ML predictions
router.get('/queue/:doctorId/predictions', authenticate, async (req, res) => {
    try {
        const doctorId = parseInt(req.params.doctorId);
        const queue = await database.query(
            `SELECT a.*, 
                    ROW_NUMBER() OVER (ORDER BY a.slot_time) as position
             FROM appointments a
             WHERE a.doctor_id = ? 
               AND a.status IN ('checked_in', 'waiting')
               AND DATE(a.slot_time) = DATE('now')
             ORDER BY a.slot_time`,
            [doctorId]
        );
        
        // Add ML predictions for each patient
        const queueWithPredictions = await Promise.all(queue.map(async (patient: any, index: number) => {
            return new Promise((resolve) => {
                const pythonProcess = spawn('python3', [
                    path.join(__dirname, '../services/ml_predictions.py'),
                    'predict_wait',
                    String(index),
                    'General',
                    patient.slot_time || '',
                    '15'
                ]);
                
                let result = '';
                pythonProcess.stdout.on('data', (data) => { result += data.toString(); });
                
                pythonProcess.on('close', (code) => {
                    let prediction = null;
                    if (code === 0) {
                        try {
                            prediction = JSON.parse(result);
                        } catch (e) {}
                    }
                    resolve({ ...patient, prediction });
                });
            });
        }));
        
        res.json(queueWithPredictions);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// ==========================================
// Multi-Queue System Routes
// ==========================================

// Get all queue types
router.get('/queue-types', async (req, res) => {
    try {
        const queueTypes = await database.getQueueTypes();
        res.json(queueTypes);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Get overall queue status for all types
router.get('/queues/status', authenticate, async (req, res) => {
    try {
        const status = await database.getAllQueuesStatus();
        res.json(status);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Get specific queue by type
router.get('/queues/:queueTypeId', authenticate, async (req, res) => {
    try {
        const queueTypeId = parseInt(req.params.queueTypeId);
        const doctorId = req.query.doctorId ? parseInt(req.query.doctorId as string) : undefined;
        const queue = await database.getQueueByType(queueTypeId, doctorId);
        res.json(queue);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Add patient to specific queue
router.post('/queues/:queueTypeId/add', authenticate, async (req, res) => {
    try {
        const queueTypeId = parseInt(req.params.queueTypeId);
        const { patientId, doctorId, notes } = req.body;
        const result = await database.addToQueueWithType(queueTypeId, patientId, doctorId, notes);
        res.json(result);
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

// Transfer patient to different queue (e.g., doctor sends to lab)
router.post('/queues/transfer', authenticate, async (req, res) => {
    try {
        const { currentQueueId, newQueueTypeId, newDoctorId, notes } = req.body;
        const result = await database.transferToQueue(currentQueueId, newQueueTypeId, newDoctorId, notes);
        
        // Emit socket event for real-time updates
        const io = (global as any).io;
        if (io) {
            io.emit('queue-transfer', { 
                from: currentQueueId, 
                to: result.id,
                queueTypeId: newQueueTypeId 
            });
        }
        
        res.json(result);
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

// Remove patient from queue (completed or cancelled)
router.delete('/queues/entry/:queueId', authenticate, async (req, res) => {
    try {
        const queueId = parseInt(req.params.queueId);
        await database.removeFromQueue(queueId);
        res.json({ message: 'Patient removed from queue' });
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

// Get doctors by specialty (for lab/radiology assignment)
router.get('/doctors/specialty/:specialty', async (req, res) => {
    try {
        const doctors = await database.getDoctorsBySpecialty(req.params.specialty);
        res.json(doctors);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// ==========================================
// MEDICAL REPORTS & PRESCRIPTIONS
// ==========================================

// Create a medical report (doctor only)
router.post('/reports', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only doctors can create reports' });
        }
        
        const { patientId, appointmentId, diagnosis, symptoms, notes, vitalSigns, labTestsOrdered, prescriptions } = req.body;
        
        // Create the report
        const report = await database.createMedicalReport({
            patientId,
            doctorId: req.user.doctorId || req.body.doctorId,
            appointmentId,
            diagnosis,
            symptoms,
            notes,
            vitalSigns,
            labTestsOrdered
        });
        
        // Add prescriptions if provided
        if (prescriptions && Array.isArray(prescriptions)) {
            for (const rx of prescriptions) {
                await database.addPrescriptionToReport({
                    reportId: report.id,
                    medicineName: rx.medicineName,
                    dosage: rx.dosage,
                    frequency: rx.frequency,
                    duration: rx.duration,
                    instructions: rx.instructions
                });
            }
        }
        
        res.json({ id: report.id, message: 'Report created successfully' });
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

// Get a specific report
router.get('/reports/:id', authenticate, async (req, res) => {
    try {
        const report = await database.getMedicalReportById(parseInt(req.params.id));
        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }
        res.json(report);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Get all reports (for clinic staff / admin)
router.get('/reports', authenticate, async (req, res) => {
    try {
        const status = req.query.status as string | undefined;
        const reports = await database.getAllMedicalReports(status);
        res.json(reports);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Get reports by doctor
router.get('/reports/doctor/:doctorId', authenticate, async (req, res) => {
    try {
        const reports = await database.getMedicalReportsByDoctor(parseInt(req.params.doctorId));
        res.json(reports);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Get patient's medical reports (for patient)
router.get('/patient/reports', authenticatePatient, async (req, res) => {
    try {
        const reports = await database.getMedicalReportsByPatient(req.patient.patientId);
        res.json(reports);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Get specific report for patient
router.get('/patient/reports/:id', authenticatePatient, async (req, res) => {
    try {
        const report = await database.getMedicalReportById(parseInt(req.params.id));
        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }
        // Verify this report belongs to the patient
        if (report.patient_id !== req.patient.patientId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        res.json(report);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Get pending prescriptions (for clinic staff)
router.get('/prescriptions/pending', authenticate, async (req, res) => {
    try {
        const prescriptions = await database.getPendingPrescriptions();
        res.json(prescriptions);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Dispense a prescription (clinic staff)
router.post('/prescriptions/:id/dispense', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'clinic_staff' && req.user.role !== 'admin' && req.user.role !== 'receptionist') {
            return res.status(403).json({ error: 'Only clinic staff can dispense prescriptions' });
        }
        await database.dispensePrescription(parseInt(req.params.id), req.user.id);
        res.json({ message: 'Prescription dispensed successfully' });
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

// Dispense all prescriptions for a report
router.post('/reports/:id/dispense-all', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'clinic_staff' && req.user.role !== 'admin' && req.user.role !== 'receptionist') {
            return res.status(403).json({ error: 'Only clinic staff can dispense prescriptions' });
        }
        await database.dispenseAllPrescriptionsForReport(parseInt(req.params.id), req.user.id);
        res.json({ message: 'All prescriptions dispensed successfully' });
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

// ==========================================
// BILLING (Basic - for future integration)
// ==========================================

router.post('/bills', authenticate, async (req, res) => {
    try {
        const { patientId, appointmentId, reportId, items, tax, discount } = req.body;
        const bill = await database.createBill({ patientId, appointmentId, reportId, items, tax, discount });
        res.json(bill);
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

router.get('/patient/bills', authenticatePatient, async (req, res) => {
    try {
        const bills = await database.getBillsByPatient(req.patient.patientId);
        res.json(bills);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.put('/bills/:id/status', authenticate, async (req, res) => {
    try {
        const { status, paymentMethod } = req.body;
        await database.updateBillStatus(parseInt(req.params.id), status, paymentMethod);
        res.json({ message: 'Bill updated successfully' });
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

export default router;