import React, { useEffect, useState } from 'react';
import BookingForm from '../components/BookingForm';
import { fetchAvailableDoctors, lookupAppointment, checkInWithCode, cancelAppointment } from '../utils/api';
import { Link, useNavigate } from 'react-router-dom';

interface Doctor {
    id: string;
    name: string;
    specialty?: string;
    experience_years?: number;
    avg_consultation_time?: number;
}

interface Appointment {
    id: number;
    confirmation_code: string;
    patient_name: string;
    doctor_name: string;
    specialty: string;
    appointment_time: string;
    status: string;
    check_in_time?: string;
}

interface PatientPortalProps {
    isAuthenticated?: boolean;
    patientId?: string;
    patientName?: string;
    onLogout?: () => void;
}

const PatientPortal: React.FC<PatientPortalProps> = ({ 
    isAuthenticated = false, 
    patientId, 
    patientName,
    onLogout 
}) => {
    const navigate = useNavigate();
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [step, setStep] = useState(1);
    const [activeTab, setActiveTab] = useState<'book' | 'check'>('book');
    
    // Appointment lookup state
    const [lookupCode, setLookupCode] = useState('');
    const [lookupLoading, setLookupLoading] = useState(false);
    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [lookupError, setLookupError] = useState('');
    const [actionMessage, setActionMessage] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                const availableDoctors = await fetchAvailableDoctors();
                // Always normalize to an array to avoid map() crashing when API returns non-array
                setDoctors(Array.isArray(availableDoctors) ? availableDoctors : []);
            } catch (error) {
                console.error('Failed to load doctors');
                setDoctors([]);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleDoctorSelect = (doctor: Doctor) => {
        setSelectedDoctor(doctor);
        setStep(2);
    };

    const handleBack = () => {
        setStep(1);
        setSelectedDoctor(null);
    };

    const handleLookup = async () => {
        if (!lookupCode.trim()) return;
        setLookupLoading(true);
        setLookupError('');
        setAppointment(null);
        setActionMessage('');
        
        try {
            const result = await lookupAppointment(lookupCode.trim());
            setAppointment(result);
        } catch (err: any) {
            setLookupError(err.response?.data?.error || 'Appointment not found');
        } finally {
            setLookupLoading(false);
        }
    };

    const handleCheckIn = async () => {
        if (!appointment) return;
        try {
            await checkInWithCode(appointment.confirmation_code);
            setActionMessage('✅ Checked in successfully! Please take a seat.');
            setAppointment({ ...appointment, status: 'in_queue' });
        } catch (err: any) {
            setActionMessage('❌ ' + (err.response?.data?.error || 'Check-in failed'));
        }
    };

    const handleCancel = async () => {
        if (!appointment) return;
        if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
        try {
            await cancelAppointment(appointment.confirmation_code);
            setActionMessage('Appointment cancelled.');
            setAppointment({ ...appointment, status: 'cancelled' });
        } catch (err: any) {
            setActionMessage('❌ ' + (err.response?.data?.error || 'Cancellation failed'));
        }
    };

    const formatDateTime = (isoString: string) => {
        const date = new Date(isoString);
        return {
            date: date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
            time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
        };
    };

    return (
        <div className="patient-portal">
            {/* Header */}
            <header className="patient-header">
                <div className="container">
                    <div className="flex items-center justify-between" style={{ padding: 'var(--space-4) 0' }}>
                        <Link to="/" className="navbar-brand" style={{ color: 'white' }}>
                            <div className="navbar-brand-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                </svg>
                            </div>
                            MediQueue<span style={{background: 'linear-gradient(to right, #8b5cf6, #d946ef)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>AI</span>
                        </Link>
                        {isAuthenticated ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                                <Link to="/patient/dashboard" className="btn btn-white btn-sm">
                                    My Dashboard
                                </Link>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                    <div style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: 'var(--radius-full)',
                                        background: 'rgba(255,255,255,0.2)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontWeight: 600,
                                        fontSize: '0.875rem'
                                    }}>
                                        {patientName?.charAt(0).toUpperCase()}
                                    </div>
                                    <span style={{ color: 'white', fontWeight: 500, fontSize: '0.875rem' }}>{patientName}</span>
                                </div>
                                <button onClick={onLogout} className="btn btn-ghost btn-sm" style={{ color: 'white' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                        <polyline points="16 17 21 12 16 7" />
                                        <line x1="21" y1="12" x2="9" y2="12" />
                                    </svg>
                                </button>
                            </div>
                        ) : (
                            <Link to="/login" className="btn btn-white btn-sm">
                                Staff Login
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="patient-hero">
                <div className="container">
                    <h1>{activeTab === 'book' ? 'Book Your Appointment' : 'Check Your Appointment'}</h1>
                    <p>{activeTab === 'book' 
                        ? 'Skip the wait. Book online and get real-time predictions for your wait time.'
                        : 'Look up your appointment using your confirmation code.'
                    }</p>
                </div>
            </section>

            {/* Tab Switcher */}
            <div className="container" style={{ marginTop: 'calc(-1 * var(--space-10))' }}>
                <div className="portal-tabs" style={{ 
                    display: 'flex', 
                    gap: 'var(--space-2)', 
                    marginBottom: 'var(--space-6)',
                    background: 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(10px)',
                    padding: 'var(--space-2)',
                    borderRadius: 'var(--radius-lg)',
                    width: 'fit-content',
                    boxShadow: 'var(--shadow-md)'
                }}>
                    <button 
                        className={`portal-tab ${activeTab === 'book' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('book'); setAppointment(null); setLookupError(''); }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-2)',
                            padding: 'var(--space-3) var(--space-5)',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: 600,
                            fontSize: '0.9375rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            background: activeTab === 'book' ? 'var(--primary-600)' : 'transparent',
                            color: activeTab === 'book' ? 'white' : 'var(--gray-600)'
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        Book Appointment
                    </button>
                    <button 
                        className={`portal-tab ${activeTab === 'check' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('check'); setStep(1); setSelectedDoctor(null); }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-2)',
                            padding: 'var(--space-3) var(--space-5)',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: 600,
                            fontSize: '0.9375rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            background: activeTab === 'check' ? 'var(--primary-600)' : 'transparent',
                            color: activeTab === 'check' ? 'white' : 'var(--gray-600)'
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        Check Appointment
                    </button>
                </div>
            </div>

            {/* Check Appointment Tab */}
            {activeTab === 'check' && (
                <div className="container" style={{ maxWidth: '500px', paddingBottom: 'var(--space-16)' }}>
                    <div className="card">
                        <div className="card-body" style={{ padding: 'var(--space-8)' }}>
                            <h3 style={{ marginBottom: 'var(--space-2)' }}>Enter Your Confirmation Code</h3>
                            <p className="text-muted" style={{ marginBottom: 'var(--space-6)' }}>
                                You received this code when you booked your appointment.
                            </p>
                            
                            <div className="form-group">
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g., MQ-ABC123"
                                    value={lookupCode}
                                    onChange={(e) => setLookupCode(e.target.value.toUpperCase())}
                                    style={{ 
                                        fontSize: '1.25rem', 
                                        textAlign: 'center',
                                        letterSpacing: '0.1em',
                                        fontFamily: 'monospace'
                                    }}
                                    onKeyPress={(e) => e.key === 'Enter' && handleLookup()}
                                />
                            </div>
                            
                            <button 
                                className="btn btn-primary btn-lg btn-block"
                                onClick={handleLookup}
                                disabled={lookupLoading || !lookupCode.trim()}
                            >
                                {lookupLoading ? (
                                    <>
                                        <span className="spinner spinner-sm" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></span>
                                        Looking up...
                                    </>
                                ) : (
                                    'Find My Appointment'
                                )}
                            </button>
                            
                            {lookupError && (
                                <div className="alert alert-error" style={{ marginTop: 'var(--space-4)' }}>
                                    {lookupError}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Appointment Details */}
                    {appointment && (
                        <div className="card slide-up" style={{ marginTop: 'var(--space-6)' }}>
                            <div className="card-body" style={{ padding: 'var(--space-8)' }}>
                                {actionMessage && (
                                    <div className={`alert ${actionMessage.startsWith('✅') ? 'alert-success' : actionMessage.startsWith('❌') ? 'alert-error' : 'alert-info'}`} style={{ marginBottom: 'var(--space-6)' }}>
                                        {actionMessage}
                                    </div>
                                )}
                                
                                <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
                                    <div style={{
                                        display: 'inline-block',
                                        padding: 'var(--space-2) var(--space-4)',
                                        borderRadius: 'var(--radius-full)',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        textTransform: 'uppercase',
                                        background: appointment.status === 'booked' ? 'var(--primary-100)' : 
                                                   appointment.status === 'in_queue' ? 'var(--success-50)' :
                                                   appointment.status === 'cancelled' ? 'var(--error-50)' : 'var(--gray-100)',
                                        color: appointment.status === 'booked' ? 'var(--primary-700)' : 
                                               appointment.status === 'in_queue' ? 'var(--success-700)' :
                                               appointment.status === 'cancelled' ? 'var(--error-700)' : 'var(--gray-700)'
                                    }}>
                                        {appointment.status === 'in_queue' ? 'Checked In' : appointment.status}
                                    </div>
                                </div>
                                
                                <div style={{ marginBottom: 'var(--space-6)' }}>
                                    <div className="text-sm text-muted" style={{ marginBottom: 'var(--space-1)' }}>Patient</div>
                                    <div className="font-semibold" style={{ fontSize: '1.125rem' }}>{appointment.patient_name}</div>
                                </div>
                                
                                <div style={{ marginBottom: 'var(--space-6)' }}>
                                    <div className="text-sm text-muted" style={{ marginBottom: 'var(--space-1)' }}>Doctor</div>
                                    <div className="font-semibold">{appointment.doctor_name}</div>
                                    <div className="text-sm text-muted">{appointment.specialty}</div>
                                </div>
                                
                                <div style={{ marginBottom: 'var(--space-6)' }}>
                                    <div className="text-sm text-muted" style={{ marginBottom: 'var(--space-1)' }}>Appointment Time</div>
                                    <div className="font-semibold">{formatDateTime(appointment.appointment_time).date}</div>
                                    <div className="text-muted">{formatDateTime(appointment.appointment_time).time}</div>
                                </div>
                                
                                {appointment.status === 'booked' && (
                                    <div className="flex gap-3">
                                        <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={handleCheckIn}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                            Check In Now
                                        </button>
                                        <button className="btn btn-outline btn-lg" style={{ color: 'var(--error-600)', borderColor: 'var(--error-200)' }} onClick={handleCancel}>
                                            Cancel
                                        </button>
                                    </div>
                                )}
                                
                                {appointment.status === 'in_queue' && (
                                    <div className="alert alert-success">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                            <polyline points="22 4 12 14.01 9 11.01" />
                                        </svg>
                                        <span>You are checked in. Please wait to be called.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Book Appointment Tab - Step Indicator */}
            {activeTab === 'book' && (
            <>
            <div className="container" style={{ marginTop: 'calc(-1 * var(--space-8))' }}>
                <div className="card" style={{ padding: 'var(--space-6)' }}>
                    <div className="steps">
                        <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                            <div className="step-number">
                                {step > 1 ? (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                ) : '1'}
                            </div>
                            <span className="step-label hide-mobile">Select Doctor</span>
                        </div>
                        <div className={`step-connector ${step > 1 ? 'completed' : ''}`}></div>
                        <div className={`step ${step >= 2 ? 'active' : ''}`}>
                            <div className="step-number">2</div>
                            <span className="step-label hide-mobile">Choose Time</span>
                        </div>
                        <div className={`step-connector ${step > 2 ? 'completed' : ''}`}></div>
                        <div className={`step ${step >= 3 ? 'active' : ''}`}>
                            <div className="step-number">3</div>
                            <span className="step-label hide-mobile">Confirm</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)' }}>
                {loading ? (
                    <div className="flex items-center justify-center" style={{ padding: 'var(--space-16)' }}>
                        <div className="spinner"></div>
                    </div>
                ) : step === 1 ? (
                    <div className="fade-in">
                        <div className="section-header text-center" style={{ marginBottom: 'var(--space-8)' }}>
                            <h2 className="section-title">Choose Your Doctor</h2>
                            <p className="section-subtitle">Select from our available healthcare professionals</p>
                        </div>

                        {!Array.isArray(doctors) || doctors.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                </div>
                                <h3 className="empty-state-title">No Doctors Available</h3>
                                <p className="empty-state-description">
                                    There are currently no doctors available for booking. Please check back later.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2" style={{ gap: 'var(--space-6)' }}>
                                {Array.isArray(doctors) && doctors.map((doctor) => (
                                    <div
                                        key={doctor.id}
                                        className={`doctor-card ${selectedDoctor?.id === doctor.id ? 'selected' : ''}`}
                                        onClick={() => handleDoctorSelect(doctor)}
                                    >
                                        <div className="doctor-avatar">
                                            {doctor.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                        </div>
                                        <h3 className="doctor-name">{doctor.name}</h3>
                                        <p className="doctor-specialty">{doctor.specialty || 'General Practice'}</p>
                                        <div className="doctor-stats">
                                            {doctor.experience_years && (
                                                <span>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px', verticalAlign: 'middle' }}>
                                                        <circle cx="12" cy="12" r="10" />
                                                        <polyline points="12 6 12 12 16 14" />
                                                    </svg>
                                                    {doctor.experience_years} years exp.
                                                </span>
                                            )}
                                            {doctor.avg_consultation_time && (
                                                <span>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px', verticalAlign: 'middle' }}>
                                                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                                                    </svg>
                                                    ~{doctor.avg_consultation_time} min
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="fade-in">
                        <button onClick={handleBack} className="btn btn-ghost" style={{ marginBottom: 'var(--space-6)' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="19" y1="12" x2="5" y2="12" />
                                <polyline points="12 19 5 12 12 5" />
                            </svg>
                            Back to Doctors
                        </button>
                        
                        {selectedDoctor && (
                            <BookingForm 
                                doctor={selectedDoctor}
                                onComplete={() => setStep(3)}
                                isAuthenticated={isAuthenticated}
                                patientId={patientId}
                                patientName={patientName}
                                onBookingComplete={() => navigate('/patient/dashboard')}
                            />
                        )}
                    </div>
                )}
            </main>
            </>
            )}

            {/* Footer */}
            <footer style={{
                background: 'var(--gray-900)',
                color: 'var(--gray-400)',
                padding: 'var(--space-8) 0',
                marginTop: 'auto'
            }}>
                <div className="container text-center">
                    <p style={{ marginBottom: 0 }}>
                        © 2026 MediQueueAI. Intelligent Healthcare Queue Management.
                    </p>
                </div>
            </footer>

            <style>{`
                .patient-portal {
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                }
                .patient-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }
                .patient-hero {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: var(--space-16) var(--space-6) calc(var(--space-16) + var(--space-8));
                    text-align: center;
                    color: white;
                }
                .patient-hero h1 {
                    color: white;
                    font-size: 2.5rem;
                    margin-bottom: var(--space-4);
                }
                .patient-hero p {
                    font-size: 1.125rem;
                    opacity: 0.9;
                    max-width: 500px;
                    margin: 0 auto;
                }
                @media (max-width: 768px) {
                    .patient-hero h1 {
                        font-size: 1.75rem;
                    }
                    .patient-hero p {
                        font-size: 1rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default PatientPortal;