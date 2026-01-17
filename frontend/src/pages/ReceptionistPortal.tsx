import React, { useState, useEffect } from 'react';
import api from '../utils/api';

interface Patient {
    id: number;
    name: string;
    age?: number;
    priority?: string;
    phone?: string;
    email?: string;
    created_at?: string;
}

interface QueueItem {
    id: string;
    name: string;
    stage: string;
    slot_time?: string;
    check_in_time?: string;
    patient_id?: number;
}

interface Doctor {
    id: string;
    name: string;
    specialty?: string;
}

const ReceptionistPortal: React.FC = () => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [newPatient, setNewPatient] = useState({ name: '', age: '', priority: 'normal', phone: '', email: '' });
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [selectedDoctor, setSelectedDoctor] = useState('1');
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [adding, setAdding] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'queue' | 'patients'>('queue');
    const [actionInProgress, setActionInProgress] = useState<number | null>(null);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        fetchDoctors();
    }, []);

    useEffect(() => {
        fetchPatients();
        fetchQueue();
    }, [selectedDoctor]);

    const fetchDoctors = async () => {
        try {
            const res = await api.get('/doctors');
            setDoctors(res.data);
            if (res.data.length > 0) {
                setSelectedDoctor(res.data[0].id);
            }
        } catch (e) {
            console.error('Failed to fetch doctors:', e);
        }
    };

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const res = await api.get('/patients');
            setPatients(res.data);
        } catch (e) {
            console.error('Failed to fetch patients:', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchQueue = async () => {
        try {
            const res = await api.get(`/queue-status/${selectedDoctor}`);
            setQueue(res.data);
        } catch (e) {
            console.error('Failed to fetch queue:', e);
        }
    };

    const addPatient = async () => {
        if (!newPatient.name.trim()) return;
        setAdding(true);
        try {
            await api.post('/patients', newPatient);
            await fetchPatients();
            setNewPatient({ name: '', age: '', priority: 'normal', phone: '', email: '' });
            setShowAddModal(false);
        } catch (e) {
            console.error('Failed to add patient:', e);
        } finally {
            setAdding(false);
        }
    };

    const addToQueue = async (patientId: number) => {
        setActionInProgress(patientId);
        try {
            await api.post('/add-to-queue', { patientId, doctorId: selectedDoctor });
            await fetchQueue();
            setNotification({ type: 'success', message: 'Patient added to queue successfully!' });
            setTimeout(() => setNotification(null), 3000);
        } catch (e: any) {
            console.error('Failed to add to queue:', e);
            setNotification({ type: 'error', message: e.response?.data?.error || 'Failed to add patient to queue' });
            setTimeout(() => setNotification(null), 5000);
        } finally {
            setActionInProgress(null);
        }
    };

    const checkInPatient = async (queueId: string) => {
        setActionInProgress(parseInt(queueId));
        try {
            await api.post('/check-in', { queueId });
            await fetchQueue();
            setNotification({ type: 'success', message: 'Patient checked in successfully!' });
            setTimeout(() => setNotification(null), 3000);
        } catch (e: any) {
            console.error('Failed to check in:', e);
            setNotification({ type: 'error', message: e.response?.data?.error || 'Failed to check in patient' });
            setTimeout(() => setNotification(null), 5000);
        } finally {
            setActionInProgress(null);
        }
    };

    const filteredPatients = patients.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case 'emergency': return { bg: 'var(--error-50)', color: 'var(--error-600)', border: 'var(--error-200)' };
            case 'urgent': return { bg: 'var(--warning-50)', color: 'var(--warning-600)', border: 'var(--warning-200)' };
            default: return { bg: 'var(--gray-100)', color: 'var(--gray-600)', border: 'var(--gray-200)' };
        }
    };

    const getStageColor = (stage: string) => {
        switch (stage) {
            case 'registration': return { bg: 'var(--gray-100)', color: 'var(--gray-600)' };
            case 'triage': return { bg: 'var(--warning-50)', color: 'var(--warning-600)' };
            case 'consultation': return { bg: 'var(--primary-50)', color: 'var(--primary-600)' };
            case 'completed': return { bg: 'var(--success-50)', color: 'var(--success-600)' };
            default: return { bg: 'var(--gray-100)', color: 'var(--gray-600)' };
        }
    };

    const formatTime = (timeString?: string) => {
        if (!timeString) return '—';
        return new Date(timeString).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <div className="fade-in">
            {/* Notification Toast */}
            {notification && (
                <div className={`notification-toast ${notification.type}`} style={{
                    position: 'fixed',
                    top: 'var(--space-4)',
                    right: 'var(--space-4)',
                    padding: 'var(--space-3) var(--space-5)',
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    background: notification.type === 'success' ? 'var(--success-50)' : 'var(--error-50)',
                    color: notification.type === 'success' ? 'var(--success-700)' : 'var(--error-700)',
                    border: `1px solid ${notification.type === 'success' ? 'var(--success-200)' : 'var(--error-200)'}`,
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 1001,
                    animation: 'slideIn 0.3s ease'
                }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        {notification.type === 'success' ? (
                            <polyline points="20 6 9 17 4 12" />
                        ) : (
                            <>
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </>
                        )}
                    </svg>
                    <span style={{ fontWeight: 500 }}>{notification.message}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-6)' }}>
                <div>
                    <h1 style={{ marginBottom: 'var(--space-1)' }}>Reception Desk</h1>
                    <p className="text-muted" style={{ marginBottom: 0 }}>Manage patients and queue</p>
                </div>
                <div className="flex items-center gap-3">
                    <select 
                        className="form-select"
                        value={selectedDoctor}
                        onChange={e => setSelectedDoctor(e.target.value)}
                        style={{ minWidth: '200px' }}
                    >
                        {doctors.map(doc => (
                            <option key={doc.id} value={doc.id}>
                                Dr. {doc.name} {doc.specialty ? `(${doc.specialty})` : ''}
                            </option>
                        ))}
                    </select>
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        New Patient
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--primary-50)', color: 'var(--primary-600)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{queue.length}</div>
                        <div className="stat-label">In Queue</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--warning-50)', color: 'var(--warning-600)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{queue.filter(q => q.stage === 'triage').length}</div>
                        <div className="stat-label">In Triage</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--accent-50)', color: 'var(--accent-600)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{queue.filter(q => q.stage === 'consultation').length}</div>
                        <div className="stat-label">With Doctor</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--success-50)', color: 'var(--success-600)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{patients.length}</div>
                        <div className="stat-label">Total Patients</div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs" style={{ marginBottom: 'var(--space-6)' }}>
                <button 
                    className={`tab ${activeTab === 'queue' ? 'active' : ''}`}
                    onClick={() => setActiveTab('queue')}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="8" y1="6" x2="21" y2="6" />
                        <line x1="8" y1="12" x2="21" y2="12" />
                        <line x1="8" y1="18" x2="21" y2="18" />
                        <line x1="3" y1="6" x2="3.01" y2="6" />
                        <line x1="3" y1="12" x2="3.01" y2="12" />
                        <line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                    Today's Queue
                </button>
                <button 
                    className={`tab ${activeTab === 'patients' ? 'active' : ''}`}
                    onClick={() => setActiveTab('patients')}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    All Patients
                </button>
            </div>

            {/* Queue Tab */}
            {activeTab === 'queue' && (
                <div className="card">
                    <div className="card-header">
                        <h3 style={{ marginBottom: 0 }}>Current Queue</h3>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {queue.length === 0 ? (
                            <div className="empty-state" style={{ padding: 'var(--space-10)' }}>
                                <div className="empty-state-icon">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <line x1="8" y1="6" x2="21" y2="6" />
                                        <line x1="8" y1="12" x2="21" y2="12" />
                                        <line x1="8" y1="18" x2="21" y2="18" />
                                        <line x1="3" y1="6" x2="3.01" y2="6" />
                                        <line x1="3" y1="12" x2="3.01" y2="12" />
                                        <line x1="3" y1="18" x2="3.01" y2="18" />
                                    </svg>
                                </div>
                                <h4 className="empty-state-title">Queue is Empty</h4>
                                <p className="empty-state-description">
                                    Add patients to the queue from the Patients tab.
                                </p>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Patient</th>
                                            <th>Slot Time</th>
                                            <th>Check-in</th>
                                            <th>Stage</th>
                                            <th style={{ textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {queue.map((item, index) => {
                                            const stageColors = getStageColor(item.stage);
                                            return (
                                                <tr key={item.id} className="slide-up" style={{ animationDelay: `${index * 30}ms` }}>
                                                    <td>
                                                        <span style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            width: '28px',
                                                            height: '28px',
                                                            borderRadius: 'var(--radius-full)',
                                                            background: 'var(--gray-100)',
                                                            fontSize: '0.8125rem',
                                                            fontWeight: 600,
                                                            color: 'var(--gray-600)'
                                                        }}>
                                                            {index + 1}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="flex items-center gap-3">
                                                            <div style={{
                                                                width: '36px',
                                                                height: '36px',
                                                                borderRadius: 'var(--radius-full)',
                                                                background: 'var(--primary-100)',
                                                                color: 'var(--primary-600)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontWeight: 600,
                                                                fontSize: '0.875rem'
                                                            }}>
                                                                {item.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?'}
                                                            </div>
                                                            <span className="font-medium">{item.name}</span>
                                                        </div>
                                                    </td>
                                                    <td>{formatTime(item.slot_time)}</td>
                                                    <td>
                                                        {item.check_in_time ? (
                                                            <span className="text-success font-medium">{formatTime(item.check_in_time)}</span>
                                                        ) : (
                                                            <span className="text-muted">Not checked in</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span style={{
                                                            display: 'inline-block',
                                                            padding: 'var(--space-1) var(--space-3)',
                                                            borderRadius: 'var(--radius-full)',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            textTransform: 'capitalize',
                                                            background: stageColors.bg,
                                                            color: stageColors.color
                                                        }}>
                                                            {item.stage}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="flex items-center justify-end">
                                                            {!item.check_in_time && (
                                                                <button 
                                                                    className="btn btn-sm btn-primary"
                                                                    onClick={() => checkInPatient(item.id)}
                                                                    disabled={actionInProgress === parseInt(item.id)}
                                                                    style={{ minWidth: '95px' }}
                                                                >
                                                                    {actionInProgress === parseInt(item.id) ? (
                                                                        <>
                                                                            <span className="spinner spinner-sm" style={{ width: '14px', height: '14px', borderWidth: '2px', borderColor: 'white', borderTopColor: 'transparent' }}></span>
                                                                            ...
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                                <polyline points="20 6 9 17 4 12" />
                                                                            </svg>
                                                                            Check In
                                                                        </>
                                                                    )}
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

            {/* Patients Tab */}
            {activeTab === 'patients' && (
                <div className="card">
                    <div className="card-header flex items-center justify-between">
                        <h3 style={{ marginBottom: 0 }}>Patient Directory</h3>
                        <div className="search-input" style={{ minWidth: '280px' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input 
                                type="text" 
                                placeholder="Search patients..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {loading ? (
                            <div className="flex items-center justify-center" style={{ padding: 'var(--space-10)' }}>
                                <div className="spinner"></div>
                            </div>
                        ) : filteredPatients.length === 0 ? (
                            <div className="empty-state" style={{ padding: 'var(--space-10)' }}>
                                <div className="empty-state-icon">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                    </svg>
                                </div>
                                <h4 className="empty-state-title">
                                    {searchTerm ? 'No Patients Found' : 'No Patients Yet'}
                                </h4>
                                <p className="empty-state-description">
                                    {searchTerm ? 'Try a different search term.' : 'Add your first patient to get started.'}
                                </p>
                                {!searchTerm && (
                                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                                        Add Patient
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Patient</th>
                                            <th>Age</th>
                                            <th>Priority</th>
                                            <th>Contact</th>
                                            <th style={{ textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPatients.map((patient, index) => {
                                            const priorityColors = getPriorityColor(patient.priority);
                                            const isInQueue = queue.some(q => q.patient_id === patient.id);
                                            return (
                                                <tr key={patient.id} className="slide-up" style={{ animationDelay: `${index * 30}ms` }}>
                                                    <td>
                                                        <div className="flex items-center gap-3">
                                                            <div style={{
                                                                width: '36px',
                                                                height: '36px',
                                                                borderRadius: 'var(--radius-full)',
                                                                background: 'var(--primary-100)',
                                                                color: 'var(--primary-600)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontWeight: 600,
                                                                fontSize: '0.875rem'
                                                            }}>
                                                                {patient.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <span className="font-medium">{patient.name}</span>
                                                        </div>
                                                    </td>
                                                    <td>{patient.age || '—'}</td>
                                                    <td>
                                                        {patient.priority && patient.priority !== 'normal' ? (
                                                            <span style={{
                                                                display: 'inline-block',
                                                                padding: 'var(--space-1) var(--space-3)',
                                                                borderRadius: 'var(--radius-full)',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 600,
                                                                textTransform: 'capitalize',
                                                                background: priorityColors.bg,
                                                                color: priorityColors.color,
                                                                border: `1px solid ${priorityColors.border}`
                                                            }}>
                                                                {patient.priority}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted">Normal</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div>
                                                            {patient.phone && <div className="text-sm">{patient.phone}</div>}
                                                            {patient.email && <div className="text-sm text-muted">{patient.email}</div>}
                                                            {!patient.phone && !patient.email && <span className="text-muted">—</span>}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="flex items-center justify-end">
                                                            {isInQueue ? (
                                                                <span className="text-sm text-muted" style={{ 
                                                                    display: 'inline-flex', 
                                                                    alignItems: 'center', 
                                                                    gap: 'var(--space-2)',
                                                                    background: 'var(--success-50)',
                                                                    color: 'var(--success-600)',
                                                                    padding: 'var(--space-1) var(--space-3)',
                                                                    borderRadius: 'var(--radius-full)',
                                                                    fontWeight: 500
                                                                }}>
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                        <polyline points="20 6 9 17 4 12" />
                                                                    </svg>
                                                                    In Queue
                                                                </span>
                                                            ) : (
                                                                <button 
                                                                    className="btn btn-sm btn-outline"
                                                                    onClick={() => addToQueue(patient.id)}
                                                                    disabled={actionInProgress === patient.id}
                                                                    style={{ minWidth: '110px' }}
                                                                >
                                                                    {actionInProgress === patient.id ? (
                                                                        <>
                                                                            <span className="spinner spinner-sm" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></span>
                                                                            Adding...
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                                <line x1="12" y1="5" x2="12" y2="19" />
                                                                                <line x1="5" y1="12" x2="19" y2="12" />
                                                                            </svg>
                                                                            Add to Queue
                                                                        </>
                                                                    )}
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

            {/* Add Patient Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal slide-up" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 style={{ marginBottom: 0 }}>Add New Patient</h3>
                            <button className="modal-close" onClick={() => setShowAddModal(false)}>
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
                                    placeholder="Patient's full name" 
                                    value={newPatient.name} 
                                    onChange={e => setNewPatient({...newPatient, name: e.target.value})} 
                                />
                            </div>
                            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                <div className="form-group">
                                    <label className="form-label">Age</label>
                                    <input 
                                        className="form-input"
                                        type="number"
                                        placeholder="Age" 
                                        value={newPatient.age} 
                                        onChange={e => setNewPatient({...newPatient, age: e.target.value})} 
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Priority</label>
                                    <select 
                                        className="form-select"
                                        value={newPatient.priority} 
                                        onChange={e => setNewPatient({...newPatient, priority: e.target.value})}
                                    >
                                        <option value="normal">Normal</option>
                                        <option value="urgent">Urgent</option>
                                        <option value="emergency">Emergency</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone</label>
                                <input 
                                    className="form-input"
                                    type="tel"
                                    placeholder="Phone number" 
                                    value={newPatient.phone} 
                                    onChange={e => setNewPatient({...newPatient, phone: e.target.value})} 
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input 
                                    className="form-input"
                                    type="email"
                                    placeholder="Email address" 
                                    value={newPatient.email} 
                                    onChange={e => setNewPatient({...newPatient, email: e.target.value})} 
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowAddModal(false)}>
                                Cancel
                            </button>
                            <button 
                                className="btn btn-primary" 
                                onClick={addPatient}
                                disabled={adding || !newPatient.name.trim()}
                            >
                                {adding ? (
                                    <>
                                        <span className="spinner spinner-sm" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></span>
                                        Adding...
                                    </>
                                ) : (
                                    'Add Patient'
                                )}
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
                .search-input {
                    display: flex;
                    align-items: center;
                    gap: var(--space-2);
                    background: var(--gray-50);
                    border: 1px solid var(--gray-200);
                    border-radius: var(--radius-md);
                    padding: 0 var(--space-3);
                    color: var(--gray-400);
                }
                .search-input input {
                    border: none;
                    background: transparent;
                    padding: var(--space-2) 0;
                    font-size: 0.875rem;
                    width: 100%;
                    outline: none;
                }
                .search-input:focus-within {
                    border-color: var(--primary-500);
                    box-shadow: 0 0 0 3px var(--primary-100);
                }
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(15, 23, 42, 0.6);
                    backdrop-filter: blur(4px);
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
                    box-shadow: var(--shadow-2xl);
                    border: 1px solid var(--gray-200);
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
                @media (max-width: 900px) {
                    .grid[style*="repeat(4"] {
                        grid-template-columns: repeat(2, 1fr) !important;
                    }
                }
                @media (max-width: 600px) {
                    .grid[style*="repeat(4"], .grid[style*="repeat(2"] {
                        grid-template-columns: 1fr !important;
                    }
                }
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                .btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
};

export default ReceptionistPortal;