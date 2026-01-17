import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPatientProfile, getPatientAppointments, updatePatientProfile, getPatientReports, getPatientReportById } from '../utils/api';

interface PatientDashboardProps {
    patientId: string;
    patientName: string;
    onLogout: () => void;
}

interface Appointment {
    id: number;
    confirmation_code: string;
    doctor_name: string;
    specialty: string;
    appointment_time: string;
    status: string;
    check_in_time?: string;
}

interface Profile {
    name: string;
    email: string;
    phone: string;
    age?: number;
    gender?: string;
    address?: string;
    blood_group?: string;
    emergency_contact?: string;
    bloodGroup?: string;
    emergencyContact?: string;
}

interface MedicalReport {
    id: number;
    doctor_name: string;
    specialty: string;
    diagnosis?: string;
    symptoms?: string;
    notes?: string;
    vital_signs?: {
        bloodPressure?: string;
        heartRate?: number;
        temperature?: number;
        weight?: number;
        height?: number;
    };
    lab_tests_ordered?: string[];
    prescriptions: {
        id: number;
        medicine_name: string;
        dosage?: string;
        frequency?: string;
        duration?: string;
        instructions?: string;
        dispensed: number;
    }[];
    created_at: string;
}

const PatientDashboard: React.FC<PatientDashboardProps> = ({ patientId, patientName, onLogout }) => {
    const [activeTab, setActiveTab] = useState<'appointments' | 'reports' | 'profile'>('appointments');
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [reports, setReports] = useState<MedicalReport[]>([]);
    const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [editedProfile, setEditedProfile] = useState<Partial<Profile>>({});
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [profileData, appointmentsData, reportsData] = await Promise.all([
                getPatientProfile(),
                getPatientAppointments(),
                getPatientReports()
            ]);
            setProfile(profileData);
            setAppointments(appointmentsData);
            setReports(reportsData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const viewReport = async (reportId: number) => {
        try {
            const report = await getPatientReportById(reportId);
            setSelectedReport(report);
        } catch (error) {
            console.error('Failed to load report:', error);
        }
    };

    const handleSaveProfile = async () => {
        try {
            await updatePatientProfile(editedProfile);
            setMessage({ text: 'Profile updated successfully!', type: 'success' });
            setEditMode(false);
            loadData();
        } catch (error: any) {
            setMessage({ text: error.response?.data?.error || 'Failed to update profile', type: 'error' });
        }
    };

    const formatDateTime = (isoString: string) => {
        const date = new Date(isoString);
        return {
            date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
            time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
        };
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, { bg: string; color: string; text: string }> = {
            booked: { bg: 'var(--primary-50)', color: 'var(--primary-600)', text: 'Scheduled' },
            in_queue: { bg: 'var(--warning-50)', color: 'var(--warning-600)', text: 'In Queue' },
            completed: { bg: 'var(--success-50)', color: 'var(--success-600)', text: 'Completed' },
            cancelled: { bg: 'var(--error-50)', color: 'var(--error-600)', text: 'Cancelled' }
        };
        const style = styles[status] || styles.booked;
        return (
            <span style={{
                padding: '0.25rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                background: style.bg,
                color: style.color,
                fontSize: '0.75rem',
                fontWeight: 600
            }}>
                {style.text}
            </span>
        );
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--surface-secondary)',
            fontFamily: 'var(--font-sans)'
        }}>
            {/* Header */}
            <header style={{
                background: 'white',
                borderBottom: '1px solid var(--gray-200)',
                padding: 'var(--space-4) 0',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 var(--space-6)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Link to="/" className="navbar-brand">
                            <div className="navbar-brand-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                </svg>
                            </div>
                            MediQueue<span style={{background: 'linear-gradient(to right, #8b5cf6, #d946ef)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>AI</span>
                        </Link>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                            <Link to="/patient/book" className="btn btn-outline btn-sm">
                                Book Appointment
                            </Link>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: 'var(--radius-full)',
                                    background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontWeight: 600
                                }}>
                                    {patientName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--gray-900)' }}>
                                        {patientName}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                                        Patient
                                    </div>
                                </div>
                                <button onClick={onLogout} className="btn btn-ghost btn-sm">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                        <polyline points="16 17 21 12 16 7" />
                                        <line x1="21" y1="12" x2="9" y2="12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: 'var(--space-8) var(--space-6)' }}>
                {/* Welcome Section */}
                <div style={{ marginBottom: 'var(--space-8)' }}>
                    <h1 style={{ marginBottom: 'var(--space-2)' }}>Welcome back, {patientName}!</h1>
                    <p style={{ color: 'var(--gray-500)' }}>Manage your appointments and health profile</p>
                </div>

                {/* Tabs */}
                <div className="tabs" style={{ marginBottom: 'var(--space-6)' }}>
                    <button 
                        className={`tab ${activeTab === 'appointments' ? 'active' : ''}`}
                        onClick={() => setActiveTab('appointments')}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        My Appointments
                    </button>
                    <button 
                        className={`tab ${activeTab === 'reports' ? 'active' : ''}`}
                        onClick={() => setActiveTab('reports')}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                        Medical Reports
                        {reports.length > 0 && (
                            <span style={{
                                marginLeft: 'var(--space-2)',
                                background: 'var(--primary-100)',
                                color: 'var(--primary-600)',
                                padding: '0.125rem 0.5rem',
                                borderRadius: 'var(--radius-full)',
                                fontSize: '0.75rem',
                                fontWeight: 600
                            }}>
                                {reports.length}
                            </span>
                        )}
                    </button>
                    <button 
                        className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                        My Profile
                    </button>
                </div>

                {/* Message */}
                {message.text && (
                    <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 'var(--space-4)' }}>
                        {message.text}
                        <button onClick={() => setMessage({ text: '', type: '' })} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                    </div>
                )}

                {/* Appointments Tab */}
                {activeTab === 'appointments' && (
                    <div className="card">
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Your Appointments</h3>
                            <Link to="/patient" className="btn btn-primary btn-sm">
                                + New Appointment
                            </Link>
                        </div>
                        
                        {loading ? (
                            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--gray-500)' }}>
                                Loading...
                            </div>
                        ) : appointments.length === 0 ? (
                            <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--gray-300)" strokeWidth="1.5" style={{ margin: '0 auto var(--space-4)' }}>
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                <p style={{ color: 'var(--gray-500)', marginBottom: 'var(--space-4)' }}>
                                    No appointments yet
                                </p>
                                <Link to="/patient" className="btn btn-primary">
                                    Book Your First Appointment
                                </Link>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Code</th>
                                            <th>Doctor</th>
                                            <th>Specialty</th>
                                            <th>Date & Time</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {appointments.map((apt) => {
                                            const { date, time } = formatDateTime(apt.appointment_time);
                                            return (
                                                <tr key={apt.id}>
                                                    <td>
                                                        <code style={{ 
                                                            background: 'var(--gray-100)', 
                                                            padding: '0.25rem 0.5rem', 
                                                            borderRadius: 'var(--radius-sm)',
                                                            fontSize: '0.8125rem'
                                                        }}>
                                                            {apt.confirmation_code}
                                                        </code>
                                                    </td>
                                                    <td style={{ fontWeight: 500 }}>{apt.doctor_name}</td>
                                                    <td style={{ color: 'var(--gray-500)' }}>{apt.specialty}</td>
                                                    <td>
                                                        <div>{date}</div>
                                                        <div style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>{time}</div>
                                                    </td>
                                                    <td>{getStatusBadge(apt.status)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Medical Reports Tab */}
                {activeTab === 'reports' && (
                    <div className="card">
                        <div className="card-header">
                            <h3 style={{ margin: 0 }}>Your Medical Reports</h3>
                        </div>
                        
                        {loading ? (
                            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--gray-500)' }}>
                                Loading...
                            </div>
                        ) : reports.length === 0 ? (
                            <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--gray-300)" strokeWidth="1.5" style={{ margin: '0 auto var(--space-4)' }}>
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                    <polyline points="14 2 14 8 20 8"/>
                                </svg>
                                <p style={{ color: 'var(--gray-500)', marginBottom: 'var(--space-4)' }}>
                                    No medical reports yet
                                </p>
                                <p style={{ color: 'var(--gray-400)', fontSize: '0.875rem' }}>
                                    Reports will appear here after your consultations
                                </p>
                            </div>
                        ) : (
                            <div style={{ padding: 'var(--space-4)' }}>
                                {reports.map((report) => {
                                    const { date, time } = formatDateTime(report.created_at);
                                    return (
                                        <div key={report.id} style={{
                                            border: '1px solid var(--gray-200)',
                                            borderRadius: 'var(--radius-lg)',
                                            padding: 'var(--space-4)',
                                            marginBottom: 'var(--space-3)',
                                            background: 'white'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--space-3)' }}>
                                                <div>
                                                    <div style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                                                        Dr. {report.doctor_name}
                                                    </div>
                                                    <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                                                        {report.specialty}
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right', fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                                                    <div>{date}</div>
                                                    <div>{time}</div>
                                                </div>
                                            </div>
                                            
                                            {report.diagnosis && (
                                                <div style={{ marginBottom: 'var(--space-2)' }}>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase' }}>Diagnosis: </span>
                                                    <span style={{ fontWeight: 500 }}>{report.diagnosis}</span>
                                                </div>
                                            )}
                                            
                                            {report.prescriptions && report.prescriptions.length > 0 && (
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 'var(--space-2)',
                                                    marginBottom: 'var(--space-3)'
                                                }}>
                                                    <span style={{
                                                        background: 'var(--primary-50)',
                                                        color: 'var(--primary-600)',
                                                        padding: '0.25rem 0.5rem',
                                                        borderRadius: 'var(--radius-md)',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 500
                                                    }}>
                                                        {report.prescriptions.length} medication{report.prescriptions.length > 1 ? 's' : ''}
                                                    </span>
                                                    {report.prescriptions.every(p => p.dispensed) ? (
                                                        <span style={{
                                                            background: 'var(--success-50)',
                                                            color: 'var(--success-600)',
                                                            padding: '0.25rem 0.5rem',
                                                            borderRadius: 'var(--radius-md)',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 500
                                                        }}>
                                                            All dispensed
                                                        </span>
                                                    ) : (
                                                        <span style={{
                                                            background: 'var(--warning-50)',
                                                            color: 'var(--warning-600)',
                                                            padding: '0.25rem 0.5rem',
                                                            borderRadius: 'var(--radius-md)',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 500
                                                        }}>
                                                            Pending pickup
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            
                                            <button
                                                className="btn btn-outline btn-sm"
                                                onClick={() => viewReport(report.id)}
                                            >
                                                View Full Report
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Report Detail Modal */}
                {selectedReport && (
                    <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
                        <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <div>
                                    <h3 style={{ marginBottom: 'var(--space-1)' }}>Medical Report</h3>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', margin: 0 }}>
                                        {formatDateTime(selectedReport.created_at).date} at {formatDateTime(selectedReport.created_at).time}
                                    </p>
                                </div>
                                <button className="modal-close" onClick={() => setSelectedReport(null)}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18"/>
                                        <line x1="6" y1="6" x2="18" y2="18"/>
                                    </svg>
                                </button>
                            </div>
                            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                                <div style={{ marginBottom: 'var(--space-4)' }}>
                                    <div style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                                        Dr. {selectedReport.doctor_name}
                                    </div>
                                    <div style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>
                                        {selectedReport.specialty}
                                    </div>
                                </div>

                                {selectedReport.diagnosis && (
                                    <div style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--gray-50)', borderRadius: 'var(--radius-lg)' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>Diagnosis</div>
                                        <div style={{ fontWeight: 500 }}>{selectedReport.diagnosis}</div>
                                    </div>
                                )}

                                {selectedReport.symptoms && (
                                    <div style={{ marginBottom: 'var(--space-4)' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>Symptoms</div>
                                        <div>{selectedReport.symptoms}</div>
                                    </div>
                                )}

                                {selectedReport.vital_signs && (
                                    <div style={{ marginBottom: 'var(--space-4)' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>Vital Signs</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 'var(--space-2)' }}>
                                            {selectedReport.vital_signs.bloodPressure && (
                                                <div style={{ padding: 'var(--space-2)', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                                                    <div style={{ fontSize: '0.625rem', color: 'var(--gray-500)', textTransform: 'uppercase' }}>Blood Pressure</div>
                                                    <div style={{ fontWeight: 600 }}>{selectedReport.vital_signs.bloodPressure}</div>
                                                </div>
                                            )}
                                            {selectedReport.vital_signs.heartRate && (
                                                <div style={{ padding: 'var(--space-2)', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                                                    <div style={{ fontSize: '0.625rem', color: 'var(--gray-500)', textTransform: 'uppercase' }}>Heart Rate</div>
                                                    <div style={{ fontWeight: 600 }}>{selectedReport.vital_signs.heartRate} bpm</div>
                                                </div>
                                            )}
                                            {selectedReport.vital_signs.temperature && (
                                                <div style={{ padding: 'var(--space-2)', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                                                    <div style={{ fontSize: '0.625rem', color: 'var(--gray-500)', textTransform: 'uppercase' }}>Temperature</div>
                                                    <div style={{ fontWeight: 600 }}>{selectedReport.vital_signs.temperature}°F</div>
                                                </div>
                                            )}
                                            {selectedReport.vital_signs.weight && (
                                                <div style={{ padding: 'var(--space-2)', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                                                    <div style={{ fontSize: '0.625rem', color: 'var(--gray-500)', textTransform: 'uppercase' }}>Weight</div>
                                                    <div style={{ fontWeight: 600 }}>{selectedReport.vital_signs.weight} kg</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {selectedReport.lab_tests_ordered && selectedReport.lab_tests_ordered.length > 0 && (
                                    <div style={{ marginBottom: 'var(--space-4)' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>Lab Tests Ordered</div>
                                        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                                            {selectedReport.lab_tests_ordered.map((test, i) => (
                                                <span key={i} style={{
                                                    background: 'var(--primary-50)',
                                                    color: 'var(--primary-700)',
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: 'var(--radius-md)',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 500
                                                }}>
                                                    {test}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedReport.prescriptions && selectedReport.prescriptions.length > 0 && (
                                    <div style={{ marginBottom: 'var(--space-4)' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>Prescriptions</div>
                                        {selectedReport.prescriptions.map((rx, i) => (
                                            <div key={i} style={{
                                                padding: 'var(--space-3)',
                                                background: rx.dispensed ? 'var(--success-50)' : 'var(--gray-50)',
                                                borderRadius: 'var(--radius-lg)',
                                                marginBottom: 'var(--space-2)',
                                                border: `1px solid ${rx.dispensed ? 'var(--success-200)' : 'var(--gray-200)'}`
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                    <div>
                                                        <div style={{ fontWeight: 600 }}>{rx.medicine_name}</div>
                                                        <div style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>
                                                            {[rx.dosage, rx.frequency, rx.duration].filter(Boolean).join(' • ')}
                                                        </div>
                                                        {rx.instructions && (
                                                            <div style={{ color: 'var(--gray-500)', fontSize: '0.75rem', marginTop: 'var(--space-1)' }}>
                                                                {rx.instructions}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {rx.dispensed ? (
                                                        <span style={{
                                                            background: 'var(--success-100)',
                                                            color: 'var(--success-700)',
                                                            padding: '0.125rem 0.5rem',
                                                            borderRadius: 'var(--radius-md)',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 500
                                                        }}>
                                                            ✓ Dispensed
                                                        </span>
                                                    ) : (
                                                        <span style={{
                                                            background: 'var(--warning-100)',
                                                            color: 'var(--warning-700)',
                                                            padding: '0.125rem 0.5rem',
                                                            borderRadius: 'var(--radius-md)',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 500
                                                        }}>
                                                            Pending
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {selectedReport.notes && (
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>Doctor's Notes</div>
                                        <div style={{ color: 'var(--gray-600)' }}>{selectedReport.notes}</div>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-primary" onClick={() => setSelectedReport(null)}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Profile Tab */}
                {activeTab === 'profile' && profile && (
                    <div className="card">
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Personal Information</h3>
                            {!editMode ? (
                                <button 
                                    className="btn btn-outline btn-sm"
                                    onClick={() => { setEditMode(true); setEditedProfile(profile); }}
                                >
                                    Edit Profile
                                </button>
                            ) : (
                                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                    <button className="btn btn-ghost btn-sm" onClick={() => setEditMode(false)}>Cancel</button>
                                    <button className="btn btn-primary btn-sm" onClick={handleSaveProfile}>Save Changes</button>
                                </div>
                            )}
                        </div>
                        
                        <div style={{ padding: 'var(--space-6)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-6)' }}>
                                <div>
                                    <label style={{ display: 'block', color: 'var(--gray-500)', fontSize: '0.875rem', marginBottom: 'var(--space-1)' }}>Full Name</label>
                                    {editMode ? (
                                        <input
                                            type="text"
                                            value={editedProfile.name || ''}
                                            onChange={(e) => setEditedProfile({...editedProfile, name: e.target.value})}
                                            className="input"
                                        />
                                    ) : (
                                        <p style={{ fontWeight: 500 }}>{profile.name}</p>
                                    )}
                                </div>
                                
                                <div>
                                    <label style={{ display: 'block', color: 'var(--gray-500)', fontSize: '0.875rem', marginBottom: 'var(--space-1)' }}>Email</label>
                                    <p style={{ fontWeight: 500 }}>{profile.email}</p>
                                </div>
                                
                                <div>
                                    <label style={{ display: 'block', color: 'var(--gray-500)', fontSize: '0.875rem', marginBottom: 'var(--space-1)' }}>Phone</label>
                                    {editMode ? (
                                        <input
                                            type="tel"
                                            value={editedProfile.phone || ''}
                                            onChange={(e) => setEditedProfile({...editedProfile, phone: e.target.value})}
                                            className="input"
                                        />
                                    ) : (
                                        <p style={{ fontWeight: 500 }}>{profile.phone || '-'}</p>
                                    )}
                                </div>
                                
                                <div>
                                    <label style={{ display: 'block', color: 'var(--gray-500)', fontSize: '0.875rem', marginBottom: 'var(--space-1)' }}>Age</label>
                                    {editMode ? (
                                        <input
                                            type="number"
                                            value={editedProfile.age || ''}
                                            onChange={(e) => setEditedProfile({...editedProfile, age: parseInt(e.target.value)})}
                                            className="input"
                                        />
                                    ) : (
                                        <p style={{ fontWeight: 500 }}>{profile.age || '-'}</p>
                                    )}
                                </div>
                                
                                <div>
                                    <label style={{ display: 'block', color: 'var(--gray-500)', fontSize: '0.875rem', marginBottom: 'var(--space-1)' }}>Gender</label>
                                    {editMode ? (
                                        <select
                                            value={editedProfile.gender || ''}
                                            onChange={(e) => setEditedProfile({...editedProfile, gender: e.target.value})}
                                            className="input"
                                        >
                                            <option value="">Select</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    ) : (
                                        <p style={{ fontWeight: 500, textTransform: 'capitalize' }}>{profile.gender || '-'}</p>
                                    )}
                                </div>
                                
                                <div>
                                    <label style={{ display: 'block', color: 'var(--gray-500)', fontSize: '0.875rem', marginBottom: 'var(--space-1)' }}>Blood Group</label>
                                    {editMode ? (
                                        <select
                                            value={editedProfile.blood_group || ''}
                                            onChange={(e) => setEditedProfile({...editedProfile, bloodGroup: e.target.value})}
                                            className="input"
                                        >
                                            <option value="">Select</option>
                                            <option value="A+">A+</option>
                                            <option value="A-">A-</option>
                                            <option value="B+">B+</option>
                                            <option value="B-">B-</option>
                                            <option value="AB+">AB+</option>
                                            <option value="AB-">AB-</option>
                                            <option value="O+">O+</option>
                                            <option value="O-">O-</option>
                                        </select>
                                    ) : (
                                        <p style={{ fontWeight: 500 }}>{profile.blood_group || '-'}</p>
                                    )}
                                </div>
                                
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', color: 'var(--gray-500)', fontSize: '0.875rem', marginBottom: 'var(--space-1)' }}>Address</label>
                                    {editMode ? (
                                        <input
                                            type="text"
                                            value={editedProfile.address || ''}
                                            onChange={(e) => setEditedProfile({...editedProfile, address: e.target.value})}
                                            className="input"
                                        />
                                    ) : (
                                        <p style={{ fontWeight: 500 }}>{profile.address || '-'}</p>
                                    )}
                                </div>
                                
                                <div>
                                    <label style={{ display: 'block', color: 'var(--gray-500)', fontSize: '0.875rem', marginBottom: 'var(--space-1)' }}>Emergency Contact</label>
                                    {editMode ? (
                                        <input
                                            type="tel"
                                            value={editedProfile.emergency_contact || ''}
                                            onChange={(e) => setEditedProfile({...editedProfile, emergencyContact: e.target.value})}
                                            className="input"
                                        />
                                    ) : (
                                        <p style={{ fontWeight: 500 }}>{profile.emergency_contact || '-'}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Modal Styles */}
            <style>{`
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
                .modal-lg {
                    max-width: 600px;
                }
                .modal-header {
                    display: flex;
                    align-items: flex-start;
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

export default PatientDashboard;
