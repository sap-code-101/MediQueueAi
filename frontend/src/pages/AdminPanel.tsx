import React, { useState, useEffect } from 'react';
import api, { fetchDoctors, createDoctor, updateDoctorSchedule, generateDoctorSlots } from '../utils/api';

interface User {
    id: string;
    username: string;
    role: string;
    doctor_id?: string;
}

interface Doctor {
    id: string;
    name: string;
    specialty?: string;
    slot_duration_minutes?: number;
    max_patients_per_day?: number;
}

const AdminPanel: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
    const [users, setUsers] = useState<User[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'doctor', doctorId: '' });
    const [newDoctor, setNewDoctor] = useState({ name: '', specialty: '', experienceYears: 0 });
    const [uploading, setUploading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'users' | 'doctors' | 'data'>('users');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDoctorModal, setShowDoctorModal] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [scheduleForm, setScheduleForm] = useState({
        slotDuration: 30,
        maxPatientsPerDay: 20,
        monStart: '09:00', monEnd: '17:00',
        tueStart: '09:00', tueEnd: '17:00',
        wedStart: '09:00', wedEnd: '17:00',
        thuStart: '09:00', thuEnd: '17:00',
        friStart: '09:00', friEnd: '17:00',
        breakStart: '12:00', breakEnd: '13:00'
    });
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
        loadDoctors();
    }, []);

    const loadDoctors = async () => {
        try {
            const data = await fetchDoctors();
            setDoctors(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('Failed to fetch doctors:', e);
            setDoctors([]);
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/users');
            setUsers(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            console.error('Failed to fetch users:', e);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setMessage('Please select a file first');
            setMessageType('error');
            return;
        }
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await api.post('/upload-data', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setMessage(res.data.message || 'Data uploaded and model retrained successfully!');
            setMessageType('success');
            setFile(null);
        } catch (e: any) {
            setMessage(e.response?.data?.error || 'Upload failed');
            setMessageType('error');
        } finally {
            setUploading(false);
        }
    };

    const createUser = async () => {
        if (!newUser.username || !newUser.password) {
            setMessage('Username and password are required');
            setMessageType('error');
            return;
        }
        setCreating(true);
        try {
            await api.post('/create-user', newUser);
            await fetchUsers();
            setNewUser({ username: '', password: '', role: 'doctor', doctorId: '' });
            setShowCreateModal(false);
            setMessage('User created successfully!');
            setMessageType('success');
        } catch (e: any) {
            setMessage(e.response?.data?.error || 'Failed to create user');
            setMessageType('error');
        } finally {
            setCreating(false);
        }
    };

    const deleteUser = async (userId: string) => {
        try {
            await api.delete(`/users/${userId}`);
            await fetchUsers();
            setDeleteConfirm(null);
            setMessage('User deleted successfully');
            setMessageType('success');
        } catch (e: any) {
            setMessage(e.response?.data?.error || 'Failed to delete user');
            setMessageType('error');
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'admin':
                return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                );
            case 'doctor':
                return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                );
            case 'receptionist':
                return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <line x1="3" y1="9" x2="21" y2="9" />
                        <line x1="9" y1="21" x2="9" y2="9" />
                    </svg>
                );
            case 'clinic_staff':
                return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/>
                        <line x1="12" y1="8" x2="12" y2="16"/>
                        <line x1="8" y1="12" x2="16" y2="12"/>
                    </svg>
                );
            default:
                return null;
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin': return { bg: 'var(--error-50)', color: 'var(--error-600)', border: 'var(--error-200)' };
            case 'doctor': return { bg: 'var(--primary-50)', color: 'var(--primary-600)', border: 'var(--primary-200)' };
            case 'receptionist': return { bg: 'var(--accent-50)', color: 'var(--accent-600)', border: 'var(--accent-200)' };
            case 'clinic_staff': return { bg: 'var(--success-50)', color: 'var(--success-600)', border: 'var(--success-200)' };
            default: return { bg: 'var(--gray-50)', color: 'var(--gray-600)', border: 'var(--gray-200)' };
        }
    };

    return (
        <div className="fade-in">
            {/* Header */}
            <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-8)' }}>
                <div>
                    <h1 style={{ marginBottom: 'var(--space-1)' }}>Admin Panel</h1>
                    <p className="text-muted" style={{ marginBottom: 0 }}>Manage users and system data</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Create User
                </button>
            </div>

            {/* Message Alert */}
            {message && (
                <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'} slide-up`} style={{ marginBottom: 'var(--space-6)' }}>
                    {messageType === 'success' ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                    )}
                    <span>{message}</span>
                    <button 
                        onClick={() => setMessage('')}
                        style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.7 }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Tabs */}
            <div className="tabs" style={{ marginBottom: 'var(--space-6)' }}>
                <button 
                    className={`tab ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    User Management
                </button>
                <button 
                    className={`tab ${activeTab === 'doctors' ? 'active' : ''}`}
                    onClick={() => setActiveTab('doctors')}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                    Doctors & Schedules
                </button>
                <button 
                    className={`tab ${activeTab === 'data' ? 'active' : ''}`}
                    onClick={() => setActiveTab('data')}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    Data Import
                </button>
            </div>

            {/* Users Tab Content */}
            {activeTab === 'users' && (
                <div className="card">
                    <div className="card-header flex items-center justify-between">
                        <h3 style={{ marginBottom: 0 }}>System Users</h3>
                        <span className="badge">{users.length} users</span>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {loading ? (
                            <div className="flex items-center justify-center" style={{ padding: 'var(--space-10)' }}>
                                <div className="spinner"></div>
                            </div>
                        ) : users.length === 0 ? (
                            <div className="empty-state" style={{ padding: 'var(--space-10)' }}>
                                <div className="empty-state-icon">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <line x1="19" y1="8" x2="19" y2="14" />
                                        <line x1="22" y1="11" x2="16" y2="11" />
                                    </svg>
                                </div>
                                <h4 className="empty-state-title">No Users Found</h4>
                                <p className="empty-state-description">
                                    Create your first user to get started.
                                </p>
                                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                                    Create User
                                </button>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th>Role</th>
                                            <th>Doctor ID</th>
                                            <th style={{ textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user, index) => {
                                            const roleColors = getRoleColor(user.role);
                                            return (
                                                <tr key={user.id} className="slide-up" style={{ animationDelay: `${index * 30}ms` }}>
                                                    <td>
                                                        <div className="flex items-center gap-3">
                                                            <div style={{
                                                                width: '36px',
                                                                height: '36px',
                                                                borderRadius: 'var(--radius-full)',
                                                                background: roleColors.bg,
                                                                color: roleColors.color,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontWeight: 600,
                                                                fontSize: '0.875rem'
                                                            }}>
                                                                {user.username[0].toUpperCase()}
                                                            </div>
                                                            <span className="font-medium">{user.username}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: 'var(--space-2)',
                                                            padding: 'var(--space-1) var(--space-3)',
                                                            borderRadius: 'var(--radius-full)',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            textTransform: 'capitalize',
                                                            background: roleColors.bg,
                                                            color: roleColors.color,
                                                            border: `1px solid ${roleColors.border}`
                                                        }}>
                                                            {getRoleIcon(user.role)}
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {user.doctor_id ? (
                                                            <code style={{ 
                                                                background: 'var(--gray-100)', 
                                                                padding: '2px 8px', 
                                                                borderRadius: 'var(--radius-sm)',
                                                                fontSize: '0.8125rem'
                                                            }}>
                                                                {user.doctor_id}
                                                            </code>
                                                        ) : (
                                                            <span className="text-muted">—</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div className="flex items-center justify-end gap-2">
                                                            {deleteConfirm === user.id ? (
                                                                <>
                                                                    <button 
                                                                        className="btn btn-sm btn-ghost"
                                                                        onClick={() => setDeleteConfirm(null)}
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                    <button 
                                                                        className="btn btn-sm"
                                                                        style={{ background: 'var(--error-500)', color: 'white' }}
                                                                        onClick={() => deleteUser(user.id)}
                                                                    >
                                                                        Confirm Delete
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <button 
                                                                    className="btn btn-sm btn-ghost"
                                                                    style={{ color: 'var(--error-500)' }}
                                                                    onClick={() => setDeleteConfirm(user.id)}
                                                                >
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                        <polyline points="3 6 5 6 21 6" />
                                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                                    </svg>
                                                                    Delete
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Doctors Tab Content */}
            {activeTab === 'doctors' && (
                <div>
                    <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-4)' }}>
                        <h3 style={{ marginBottom: 0 }}>Doctor Profiles & Schedules</h3>
                        <button className="btn btn-primary" onClick={() => setShowDoctorModal(true)}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Add Doctor
                        </button>
                    </div>
                    
                    {doctors.length === 0 ? (
                        <div className="card">
                            <div className="card-body">
                                <div className="empty-state" style={{ padding: 'var(--space-10)' }}>
                                    <div className="empty-state-icon">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                        </svg>
                                    </div>
                                    <h4 className="empty-state-title">No Doctors Found</h4>
                                    <p className="empty-state-description">
                                        Add doctors to manage their schedules and appointments.
                                    </p>
                                    <button className="btn btn-primary" onClick={() => setShowDoctorModal(true)}>
                                        Add Doctor
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
                            {doctors.map((doctor, index) => (
                                <div key={doctor.id} className="card slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                                    <div className="card-body">
                                        <div className="flex items-center gap-3" style={{ marginBottom: 'var(--space-4)' }}>
                                            <div style={{
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: 'var(--radius-full)',
                                                background: 'linear-gradient(135deg, var(--primary-400), var(--primary-600))',
                                                color: 'white',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 700,
                                                fontSize: '1.125rem'
                                            }}>
                                                {doctor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                            </div>
                                            <div>
                                                <h4 style={{ marginBottom: '2px' }}>{doctor.name}</h4>
                                                <p className="text-sm text-muted" style={{ marginBottom: 0 }}>
                                                    {doctor.specialty || 'General'}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div style={{ 
                                            background: 'var(--gray-50)', 
                                            padding: 'var(--space-3)', 
                                            borderRadius: 'var(--radius-md)',
                                            marginBottom: 'var(--space-4)'
                                        }}>
                                            <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-2)' }}>
                                                <span className="text-sm text-muted">Slot Duration</span>
                                                <span className="text-sm font-medium">{doctor.slot_duration_minutes || 30} min</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted">Max Patients/Day</span>
                                                <span className="text-sm font-medium">{doctor.max_patients_per_day || 20}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-2">
                                            <button 
                                                className="btn btn-outline btn-sm flex-1"
                                                onClick={() => {
                                                    setSelectedDoctor(doctor);
                                                    setScheduleForm({
                                                        ...scheduleForm,
                                                        slotDuration: doctor.slot_duration_minutes || 30,
                                                        maxPatientsPerDay: doctor.max_patients_per_day || 20
                                                    });
                                                    setShowScheduleModal(true);
                                                }}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                    <line x1="16" y1="2" x2="16" y2="6" />
                                                    <line x1="8" y1="2" x2="8" y2="6" />
                                                    <line x1="3" y1="10" x2="21" y2="10" />
                                                </svg>
                                                Edit Schedule
                                            </button>
                                            <button 
                                                className="btn btn-primary btn-sm flex-1"
                                                onClick={async () => {
                                                    try {
                                                        await generateDoctorSlots(doctor.id);
                                                        setMessage(`Slots regenerated for Dr. ${doctor.name}`);
                                                        setMessageType('success');
                                                    } catch (e) {
                                                        setMessage('Failed to generate slots');
                                                        setMessageType('error');
                                                    }
                                                }}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="23 4 23 10 17 10" />
                                                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                                                </svg>
                                                Gen. Slots
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Data Import Tab Content */}
            {activeTab === 'data' && (
                <div className="card">
                    <div className="card-header">
                        <h3 style={{ marginBottom: 0 }}>Import Training Data</h3>
                    </div>
                    <div className="card-body">
                        <p className="text-muted" style={{ marginBottom: 'var(--space-6)' }}>

                            Upload historical wait time data (CSV format) to retrain the prediction model and improve accuracy.
                        </p>
                        
                        <div 
                            className="upload-zone"
                            style={{
                                border: '2px dashed var(--gray-300)',
                                borderRadius: 'var(--radius-lg)',
                                padding: 'var(--space-10)',
                                textAlign: 'center',
                                background: file ? 'var(--primary-50)' : 'var(--gray-50)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <input 
                                type="file" 
                                accept=".csv" 
                                id="file-upload"
                                style={{ display: 'none' }}
                                onChange={e => setFile(e.target.files?.[0] || null)} 
                            />
                            
                            {file ? (
                                <>
                                    <div style={{
                                        width: '64px',
                                        height: '64px',
                                        borderRadius: 'var(--radius-full)',
                                        background: 'var(--primary-100)',
                                        color: 'var(--primary-600)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto var(--space-4)'
                                    }}>
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                            <polyline points="14 2 14 8 20 8" />
                                            <line x1="16" y1="13" x2="8" y2="13" />
                                            <line x1="16" y1="17" x2="8" y2="17" />
                                        </svg>
                                    </div>
                                    <p className="font-semibold" style={{ marginBottom: 'var(--space-1)' }}>{file.name}</p>
                                    <p className="text-sm text-muted" style={{ marginBottom: 'var(--space-4)' }}>
                                        {(file.size / 1024).toFixed(1)} KB
                                    </p>
                                    <div className="flex items-center justify-center gap-3">
                                        <label htmlFor="file-upload" className="btn btn-outline" style={{ cursor: 'pointer' }}>
                                            Change File
                                        </label>
                                        <button 
                                            className="btn btn-primary"
                                            onClick={handleUpload}
                                            disabled={uploading}
                                        >
                                            {uploading ? (
                                                <>
                                                    <span className="spinner spinner-sm" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></span>
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                        <polyline points="17 8 12 3 7 8" />
                                                        <line x1="12" y1="3" x2="12" y2="15" />
                                                    </svg>
                                                    Upload & Retrain
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div style={{
                                        width: '64px',
                                        height: '64px',
                                        borderRadius: 'var(--radius-full)',
                                        background: 'var(--gray-200)',
                                        color: 'var(--gray-500)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto var(--space-4)'
                                    }}>
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="17 8 12 3 7 8" />
                                            <line x1="12" y1="3" x2="12" y2="15" />
                                        </svg>
                                    </div>
                                    <p className="font-semibold" style={{ marginBottom: 'var(--space-1)' }}>
                                        Drop your CSV file here
                                    </p>
                                    <p className="text-sm text-muted" style={{ marginBottom: 'var(--space-4)' }}>
                                        or click to browse
                                    </p>
                                    <label htmlFor="file-upload" className="btn btn-primary" style={{ cursor: 'pointer' }}>
                                        Choose File
                                    </label>
                                </>
                            )}
                        </div>

                        <div style={{ marginTop: 'var(--space-6)' }}>
                            <h4 style={{ marginBottom: 'var(--space-3)' }}>Expected CSV Format</h4>
                            <div style={{ 
                                background: 'var(--gray-900)', 
                                color: 'var(--gray-100)', 
                                padding: 'var(--space-4)', 
                                borderRadius: 'var(--radius-md)',
                                fontFamily: 'monospace',
                                fontSize: '0.8125rem',
                                overflow: 'auto'
                            }}>
                                <code>
                                    doctor_id,slot_time,actual_wait_minutes,day_of_week,hour_of_day<br/>
                                    1,2024-01-15 09:00:00,12,1,9<br/>
                                    1,2024-01-15 09:30:00,18,1,9<br/>
                                    2,2024-01-15 10:00:00,8,1,10
                                </code>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal slide-up" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 style={{ marginBottom: 0 }}>Create New User</h3>
                            <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Username *</label>
                                <input 
                                    className="form-input"
                                    placeholder="Enter username" 
                                    value={newUser.username} 
                                    onChange={e => setNewUser({...newUser, username: e.target.value})} 
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Password *</label>
                                <input 
                                    type="password" 
                                    className="form-input"
                                    placeholder="Enter password" 
                                    value={newUser.password} 
                                    onChange={e => setNewUser({...newUser, password: e.target.value})} 
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Role</label>
                                <select 
                                    className="form-select"
                                    value={newUser.role} 
                                    onChange={e => setNewUser({...newUser, role: e.target.value})}
                                >
                                    <option value="admin">Admin</option>
                                    <option value="doctor">Doctor</option>
                                    <option value="receptionist">Receptionist</option>
                                    <option value="clinic_staff">Clinic Staff</option>
                                </select>
                            </div>
                            {newUser.role === 'doctor' && (
                                <div className="form-group">
                                    <label className="form-label">Doctor ID</label>
                                    <input 
                                        className="form-input"
                                        placeholder="Assign to doctor ID" 
                                        value={newUser.doctorId} 
                                        onChange={e => setNewUser({...newUser, doctorId: e.target.value})} 
                                    />
                                    <p className="form-hint">Links this user account to a doctor profile</p>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>
                                Cancel
                            </button>
                            <button 
                                className="btn btn-primary" 
                                onClick={createUser}
                                disabled={creating || !newUser.username || !newUser.password}
                            >
                                {creating ? (
                                    <>
                                        <span className="spinner spinner-sm" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></span>
                                        Creating...
                                    </>
                                ) : (
                                    'Create User'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Doctor Modal */}
            {showDoctorModal && (
                <div className="modal-overlay" onClick={() => setShowDoctorModal(false)}>
                    <div className="modal slide-up" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 style={{ marginBottom: 0 }}>Add New Doctor</h3>
                            <button className="modal-close" onClick={() => setShowDoctorModal(false)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Full Name *</label>
                                <input 
                                    className="form-input"
                                    placeholder="Dr. John Smith" 
                                    value={newDoctor.name} 
                                    onChange={e => setNewDoctor({...newDoctor, name: e.target.value})} 
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Specialty</label>
                                <input 
                                    className="form-input"
                                    placeholder="e.g., Cardiology, Pediatrics" 
                                    value={newDoctor.specialty} 
                                    onChange={e => setNewDoctor({...newDoctor, specialty: e.target.value})} 
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Experience (Years)</label>
                                <input 
                                    type="number"
                                    className="form-input"
                                    placeholder="Years of experience" 
                                    value={newDoctor.experienceYears || ''} 
                                    onChange={e => setNewDoctor({...newDoctor, experienceYears: parseInt(e.target.value) || 0})} 
                                />
                            </div>
                            <p className="form-hint">
                                Default schedule (Mon-Fri, 9am-5pm, 30min slots) will be assigned. You can edit it after creation.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowDoctorModal(false)}>
                                Cancel
                            </button>
                            <button 
                                className="btn btn-primary" 
                                onClick={async () => {
                                    if (!newDoctor.name) {
                                        setMessage('Doctor name is required');
                                        setMessageType('error');
                                        return;
                                    }
                                    try {
                                        await createDoctor(newDoctor.name, newDoctor.specialty, newDoctor.experienceYears);
                                        await loadDoctors();
                                        setShowDoctorModal(false);
                                        setNewDoctor({ name: '', specialty: '', experienceYears: 0 });
                                        setMessage('Doctor added successfully!');
                                        setMessageType('success');
                                    } catch (e: any) {
                                        setMessage(e.response?.data?.error || 'Failed to create doctor');
                                        setMessageType('error');
                                    }
                                }}
                                disabled={!newDoctor.name}
                            >
                                Add Doctor
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Schedule Modal */}
            {showScheduleModal && selectedDoctor && (
                <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
                    <div className="modal slide-up" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 style={{ marginBottom: 0 }}>Edit Schedule: {selectedDoctor.name}</h3>
                            <button className="modal-close" onClick={() => setShowScheduleModal(false)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                <div className="form-group">
                                    <label className="form-label">Slot Duration (minutes)</label>
                                    <select 
                                        className="form-select"
                                        value={scheduleForm.slotDuration}
                                        onChange={e => setScheduleForm({...scheduleForm, slotDuration: parseInt(e.target.value)})}
                                    >
                                        <option value={15}>15 min</option>
                                        <option value={20}>20 min</option>
                                        <option value={30}>30 min</option>
                                        <option value={45}>45 min</option>
                                        <option value={60}>60 min</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Max Patients/Day</label>
                                    <input 
                                        type="number"
                                        className="form-input"
                                        value={scheduleForm.maxPatientsPerDay}
                                        onChange={e => setScheduleForm({...scheduleForm, maxPatientsPerDay: parseInt(e.target.value) || 20})}
                                    />
                                </div>
                            </div>

                            <h4 style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-3)' }}>Working Hours</h4>
                            
                            {['mon', 'tue', 'wed', 'thu', 'fri'].map((day) => (
                                <div key={day} style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: '80px 1fr 20px 1fr', 
                                    gap: 'var(--space-2)',
                                    alignItems: 'center',
                                    marginBottom: 'var(--space-2)'
                                }}>
                                    <span className="font-medium text-sm" style={{ textTransform: 'capitalize' }}>
                                        {day === 'mon' ? 'Monday' : 
                                         day === 'tue' ? 'Tuesday' : 
                                         day === 'wed' ? 'Wednesday' : 
                                         day === 'thu' ? 'Thursday' : 'Friday'}
                                    </span>
                                    <input 
                                        type="time" 
                                        className="form-input"
                                        style={{ padding: 'var(--space-2)' }}
                                        value={(scheduleForm as any)[`${day}Start`]}
                                        onChange={e => setScheduleForm({...scheduleForm, [`${day}Start`]: e.target.value})}
                                    />
                                    <span className="text-center text-muted">–</span>
                                    <input 
                                        type="time" 
                                        className="form-input"
                                        style={{ padding: 'var(--space-2)' }}
                                        value={(scheduleForm as any)[`${day}End`]}
                                        onChange={e => setScheduleForm({...scheduleForm, [`${day}End`]: e.target.value})}
                                    />
                                </div>
                            ))}

                            <h4 style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-3)' }}>Break Time</h4>
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: '1fr 20px 1fr', 
                                gap: 'var(--space-2)',
                                alignItems: 'center'
                            }}>
                                <input 
                                    type="time" 
                                    className="form-input"
                                    value={scheduleForm.breakStart}
                                    onChange={e => setScheduleForm({...scheduleForm, breakStart: e.target.value})}
                                />
                                <span className="text-center text-muted">–</span>
                                <input 
                                    type="time" 
                                    className="form-input"
                                    value={scheduleForm.breakEnd}
                                    onChange={e => setScheduleForm({...scheduleForm, breakEnd: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowScheduleModal(false)}>
                                Cancel
                            </button>
                            <button 
                                className="btn btn-primary" 
                                onClick={async () => {
                                    try {
                                        const workingHours: Record<string, { start: string; end: string }> = {};
                                        ['mon', 'tue', 'wed', 'thu', 'fri'].forEach(day => {
                                            workingHours[day] = {
                                                start: (scheduleForm as any)[`${day}Start`],
                                                end: (scheduleForm as any)[`${day}End`]
                                            };
                                        });

                                        await updateDoctorSchedule(selectedDoctor.id, {
                                            working_hours: workingHours,
                                            break_time: { start: scheduleForm.breakStart, end: scheduleForm.breakEnd },
                                            slot_duration_minutes: scheduleForm.slotDuration,
                                            max_patients_per_day: scheduleForm.maxPatientsPerDay
                                        });
                                        
                                        await loadDoctors();
                                        setShowScheduleModal(false);
                                        setMessage(`Schedule updated for ${selectedDoctor.name}. Remember to regenerate slots!`);
                                        setMessageType('success');
                                    } catch (e: any) {
                                        setMessage(e.response?.data?.error || 'Failed to update schedule');
                                        setMessageType('error');
                                    }
                                }}
                            >
                                Save Schedule
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .tabs {
                    display: flex;
                    gap: var(--space-1);
                    background: var(--gray-100);
                    padding: var(--space-1);
                    border-radius: var(--radius-lg);
                    width: fit-content;
                }
                .tab {
                    display: flex;
                    align-items: center;
                    gap: var(--space-2);
                    padding: var(--space-2) var(--space-4);
                    border: none;
                    background: transparent;
                    color: var(--gray-600);
                    font-weight: 500;
                    font-size: 0.875rem;
                    border-radius: var(--radius-md);
                    cursor: pointer;
                    transition: all 0.15s ease;
                }
                .tab:hover {
                    color: var(--gray-900);
                }
                .tab.active {
                    background: white;
                    color: var(--gray-900);
                    box-shadow: var(--shadow-sm);
                }
                .badge {
                    background: var(--gray-100);
                    color: var(--gray-600);
                    padding: var(--space-1) var(--space-3);
                    border-radius: var(--radius-full);
                    font-size: 0.75rem;
                    font-weight: 600;
                }
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: var(--space-4);
                }
                .modal {
                    background: white;
                    border-radius: var(--radius-xl);
                    width: 100%;
                    max-width: 480px;
                    box-shadow: var(--shadow-xl);
                }
                .modal-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: var(--space-5) var(--space-6);
                    border-bottom: 1px solid var(--gray-100);
                }
                .modal-close {
                    background: none;
                    border: none;
                    padding: var(--space-2);
                    cursor: pointer;
                    color: var(--gray-400);
                    border-radius: var(--radius-md);
                    transition: all 0.15s ease;
                }
                .modal-close:hover {
                    background: var(--gray-100);
                    color: var(--gray-600);
                }
                .modal-body {
                    padding: var(--space-6);
                }
                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: var(--space-3);
                    padding: var(--space-4) var(--space-6);
                    border-top: 1px solid var(--gray-100);
                    background: var(--gray-50);
                    border-radius: 0 0 var(--radius-xl) var(--radius-xl);
                }
            `}</style>
        </div>
    );
};

export default AdminPanel;