import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000
});

// Request interceptor to add auth token
api.interceptors.request.use(config => {
    // Check for patient token first, then staff token
    const patientToken = localStorage.getItem('patientToken');
    const staffToken = localStorage.getItem('token');
    const token = patientToken || staffToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Response interceptor to handle errors gracefully
api.interceptors.response.use(
    response => response,
    error => {
        console.error('API Error:', error.message);
        if (error.code === 'ERR_NETWORK') {
            console.error('Backend server is not running');
        }
        return Promise.reject(error);
    }
);

// Helper to safely return array data
const safeArrayResponse = async (promise: Promise<any>) => {
    try {
        const response = await promise;
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error('API call failed:', error);
        return [];
    }
};

export default api;

// ==========================================
// Patient Authentication
// ==========================================

export const patientLogin = async (email: string, password: string) => {
    const response = await api.post('/patient/login', { email, password });
    return response.data;
};

export const patientRegister = async (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    age?: number;
    gender?: string;
    address?: string;
    bloodGroup?: string;
    emergencyContact?: string;
}) => {
    const response = await api.post('/patient/register', data);
    return response.data;
};

export const getPatientProfile = async () => {
    const response = await api.get('/patient/profile');
    return response.data;
};

export const updatePatientProfile = async (data: {
    name?: string;
    age?: number;
    gender?: string;
    phone?: string;
    address?: string;
    bloodGroup?: string;
    emergencyContact?: string;
}) => {
    const response = await api.put('/patient/profile', data);
    return response.data;
};

export const getPatientAppointments = async () => {
    try {
        const response = await api.get('/patient/appointments');
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error('Failed to fetch patient appointments:', error);
        return [];
    }
};

export const changePatientPassword = async (currentPassword: string, newPassword: string) => {
    const response = await api.post('/patient/change-password', { currentPassword, newPassword });
    return response.data;
};

// ==========================================
// Staff Authentication
// ==========================================

export const login = async (username: string, password: string) => {
    const response = await api.post('/login', { username, password });
    return response.data;
};

export const getAvailableSlots = async (doctorId: string) => {
    try {
        const response = await api.get(`/available-slots/${doctorId}`);
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error('Failed to fetch available slots:', error);
        return [];
    }
};

// ==========================================
// Doctor Management
// ==========================================

export const fetchDoctors = async () => {
    try {
        const response = await api.get('/doctors');
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error('Failed to fetch doctors:', error);
        return [];
    }
};

export const fetchAvailableDoctors = async () => {
    // Alias for backward compatibility
    return fetchDoctors();
};

export const createDoctor = async (name: string, specialty: string, experienceYears?: number) => {
    const response = await api.post('/doctors', { name, specialty, experienceYears });
    return response.data;
};

export const getDoctorSchedule = async (doctorId: string) => {
    const response = await api.get(`/doctors/${doctorId}/schedule`);
    return response.data;
};

export const updateDoctorSchedule = async (doctorId: string, schedule: {
    working_hours?: any;
    break_time?: any;
    slot_duration_minutes?: number;
    max_patients_per_day?: number;
}) => {
    const response = await api.put(`/doctors/${doctorId}/schedule`, schedule);
    return response.data;
};

export const generateDoctorSlots = async (doctorId: string, daysAhead?: number) => {
    const response = await api.post(`/doctors/${doctorId}/generate-slots`, { daysAhead });
    return response.data;
};

export const getDoctorsBySpecialty = async (specialty: string) => {
    const response = await api.get(`/doctors/specialty/${specialty}`);
    return response.data;
};

// ==========================================
// Booking & Appointments
// ==========================================

export const bookSlot = async (doctorId: string, patientData: {
    patientName: string;
    patientEmail?: string;
    patientPhone?: string;
    slotTime: string;
}) => {
    const response = await api.post('/book', { doctorId, ...patientData });
    return response.data;
};

// Book appointment for authenticated patient
export const bookAppointmentForPatient = async (doctorId: string, data: {
    slotTime: string;
}) => {
    const response = await api.post('/patient/book', { doctorId, slotTime: data.slotTime });
    return response.data;
};

export const checkSlotAndPredict = async (doctorId: string, slotTime: string) => {
    const response = await api.post(`/check-slot-predict/${doctorId}`, { slotTime });
    return response.data;
};

// ==========================================
// Appointment Lookup (for patients)
// ==========================================

export const lookupAppointment = async (confirmationCode: string) => {
    const response = await api.get(`/appointment/${confirmationCode}`);
    return response.data;
};

export const cancelAppointment = async (confirmationCode: string) => {
    const response = await api.delete(`/appointment/${confirmationCode}`);
    return response.data;
};

export const checkInWithCode = async (confirmationCode: string) => {
    const response = await api.post(`/check-in/${confirmationCode}`);
    return response.data;
};

// ==========================================
// Queue Management
// ==========================================

export const getQueueStatus = async (doctorId: string) => {
    try {
        const response = await api.get(`/queue-status/${doctorId}`);
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error('Failed to fetch queue status:', error);
        return [];
    }
};

export const updateSlotTime = async (doctorId: string, patientId: string, actualDuration: number) => {
    const response = await api.post(`/update-slot-time/${doctorId}`, { patientId, actualDuration });
    return response.data;
};

// ==========================================
// Multi-Queue System
// ==========================================

export const getQueueTypes = async () => {
    try {
        const response = await api.get('/queue-types');
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error('Failed to fetch queue types:', error);
        return [];
    }
};

export const getAllQueuesStatus = async () => {
    const response = await api.get('/queues/status');
    return response.data;
};

export const getQueueByType = async (queueTypeId: number, doctorId?: number) => {
    const params = doctorId ? `?doctorId=${doctorId}` : '';
    const response = await api.get(`/queues/${queueTypeId}${params}`);
    return response.data;
};

export const addToQueue = async (queueTypeId: number, patientId: number, doctorId?: number, notes?: string) => {
    const response = await api.post(`/queues/${queueTypeId}/add`, { patientId, doctorId, notes });
    return response.data;
};

export const transferToQueue = async (currentQueueId: number, newQueueTypeId: number, newDoctorId?: number, notes?: string) => {
    const response = await api.post('/queues/transfer', { currentQueueId, newQueueTypeId, newDoctorId, notes });
    return response.data;
};

export const removeFromQueueEntry = async (queueId: number) => {
    const response = await api.delete(`/queues/entry/${queueId}`);
    return response.data;
};

// ==========================================
// ML Predictions
// ==========================================

export const predictWaitTime = async (queueLength: number, specialty?: string, appointmentTime?: string, doctorAvgTime?: number) => {
    const response = await api.post('/predict/wait-time', {
        queueLength,
        specialty: specialty || 'General',
        appointmentTime,
        doctorAvgTime
    });
    return response.data;
};

export const predictSlotAvailability = async (doctorId: string, slotTime: string, currentBookings?: number) => {
    const response = await api.post('/predict/slot-availability', {
        doctorId,
        slotTime,
        currentBookings
    });
    return response.data;
};

export const getQueueWithPredictions = async (doctorId: string) => {
    const response = await api.get(`/queue/${doctorId}/predictions`);
    return response.data;
};

// ==========================================
// Notifications
// ==========================================

export const getNotifications = async () => {
    const response = await api.get('/notifications');
    return response.data;
};

export const markNotificationRead = async (notificationId: string) => {
    const response = await api.post(`/notifications/${notificationId}/read`);
    return response.data;
};

// ==========================================
// User Management
// ==========================================

export const register = async (username: string, password: string, role: string, doctorId?: number) => {
    const response = await api.post('/register', { username, password, role, doctorId });
    return response.data;
};

export const getUsers = async () => {
    const response = await api.get('/users');
    return response.data;
};

export const createUser = async (username: string, password: string, role: string, doctorId?: number) => {
    const response = await api.post('/create-user', { username, password, role, doctorId });
    return response.data;
};
// ==========================================
// Medical Reports & Prescriptions
// ==========================================

export const createMedicalReport = async (data: {
    patientId: number;
    appointmentId?: number;
    doctorId?: number;
    diagnosis?: string;
    symptoms?: string;
    notes?: string;
    vitalSigns?: {
        bloodPressure?: string;
        heartRate?: number;
        temperature?: number;
        weight?: number;
        height?: number;
    };
    labTestsOrdered?: string[];
    prescriptions?: {
        medicineName: string;
        dosage?: string;
        frequency?: string;
        duration?: string;
        instructions?: string;
    }[];
}) => {
    const response = await api.post('/reports', data);
    return response.data;
};

export const getMedicalReportById = async (reportId: number) => {
    const response = await api.get(`/reports/${reportId}`);
    return response.data;
};

export const getAllMedicalReports = async (status?: string) => {
    try {
        const params = status ? `?status=${status}` : '';
        const response = await api.get(`/reports${params}`);
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error('Failed to fetch reports:', error);
        return [];
    }
};

export const getReportsByDoctor = async (doctorId: number) => {
    try {
        const response = await api.get(`/reports/doctor/${doctorId}`);
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error('Failed to fetch doctor reports:', error);
        return [];
    }
};

export const getPatientReports = async () => {
    try {
        const response = await api.get('/patient/reports');
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error('Failed to fetch patient reports:', error);
        return [];
    }
};

export const getPatientReportById = async (reportId: number) => {
    const response = await api.get(`/patient/reports/${reportId}`);
    return response.data;
};

export const getPendingPrescriptions = async () => {
    try {
        const response = await api.get('/prescriptions/pending');
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error('Failed to fetch pending prescriptions:', error);
        return [];
    }
};

export const dispensePrescription = async (prescriptionId: number) => {
    const response = await api.post(`/prescriptions/${prescriptionId}/dispense`);
    return response.data;
};

export const dispenseAllPrescriptions = async (reportId: number) => {
    const response = await api.post(`/reports/${reportId}/dispense-all`);
    return response.data;
};

// ==========================================
// Billing
// ==========================================

export const createBill = async (data: {
    patientId: number;
    appointmentId?: number;
    reportId?: number;
    items: { description: string; amount: number }[];
    tax?: number;
    discount?: number;
}) => {
    const response = await api.post('/bills', data);
    return response.data;
};

export const getPatientBills = async () => {
    try {
        const response = await api.get('/patient/bills');
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error('Failed to fetch patient bills:', error);
        return [];
    }
};

export const updateBillStatus = async (billId: number, status: string, paymentMethod?: string) => {
    const response = await api.put(`/bills/${billId}/status`, { status, paymentMethod });
    return response.data;
};
