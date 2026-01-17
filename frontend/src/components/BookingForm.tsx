import React, { useEffect, useState } from 'react';
import { getAvailableSlots, checkSlotAndPredict, bookSlot, bookAppointmentForPatient } from '../utils/api';

interface Doctor {
    id: string;
    name: string;
    specialty?: string;
}

interface BookingFormProps {
    doctor: Doctor;
    onComplete?: () => void;
    isAuthenticated?: boolean;
    patientId?: string;
    patientName?: string;
    onBookingComplete?: () => void;
}

interface Prediction {
    available: boolean;
    prediction: number;
    recommended_arrival_minutes: number;
    recommended_arrival: string;
    on_time_wait: number;
    expected_range: string;
    risk: number;
    tail_risk: number;
}

const BookingForm: React.FC<BookingFormProps> = ({ 
    doctor, 
    onComplete, 
    isAuthenticated = false,
    patientId,
    patientName: authPatientName,
    onBookingComplete
}) => {
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [selectedSlot, setSelectedSlot] = useState('');
    const [prediction, setPrediction] = useState<Prediction | null>(null);
    const [patientName, setPatientName] = useState(authPatientName || '');
    const [patientEmail, setPatientEmail] = useState('');
    const [patientPhone, setPatientPhone] = useState('');
    const [loading, setLoading] = useState(true);
    const [predicting, setPredicting] = useState(false);
    const [booking, setBooking] = useState(false);
    const [booked, setBooked] = useState(false);
    const [confirmationCode, setConfirmationCode] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const loadSlots = async () => {
            try {
                const slots = await getAvailableSlots(doctor.id);
                setAvailableSlots(slots);
            } catch (err) {
                setError('Failed to load available slots');
            } finally {
                setLoading(false);
            }
        };
        loadSlots();
    }, [doctor.id]);

    const handleSlotSelect = async (slot: string) => {
        setSelectedSlot(slot);
        setPrediction(null);
        setPredicting(true);
        setError('');

        try {
            const result = await checkSlotAndPredict(doctor.id, slot);
            setPrediction(result);
        } catch (err) {
            setError('Failed to get wait time prediction');
        } finally {
            setPredicting(false);
        }
    };

    const handleBooking = async () => {
        if (!patientName.trim()) {
            setError('Please enter your name');
            return;
        }

        setBooking(true);
        setError('');

        try {
            let result;
            
            // If authenticated, use the authenticated booking endpoint
            if (isAuthenticated && patientId) {
                result = await bookAppointmentForPatient(doctor.id, {
                    slotTime: selectedSlot
                });
            } else {
                // Guest booking (non-authenticated)
                result = await bookSlot(doctor.id, { 
                    patientName, 
                    patientEmail,
                    patientPhone,
                    slotTime: selectedSlot 
                });
            }
            
            setConfirmationCode(result.confirmationCode);
            setBooked(true);
            if (onComplete) onComplete();
            if (onBookingComplete) onBookingComplete();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Booking failed. Please try again.');
        } finally {
            setBooking(false);
        }
    };

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    };

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('en-US', { 
            weekday: 'long',
            month: 'short', 
            day: 'numeric' 
        });
    };

    // Group slots by date
    const groupedSlots: { [date: string]: string[] } = {};
    availableSlots.forEach(slot => {
        const date = formatDate(slot);
        if (!groupedSlots[date]) groupedSlots[date] = [];
        groupedSlots[date].push(slot);
    });

    if (booked) {
        return (
            <div className="card slide-up">
                <div className="card-body text-center" style={{ padding: 'var(--space-12)' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: 'var(--success-50)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto var(--space-6)',
                        color: 'var(--success-500)'
                    }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    </div>
                    <h2 style={{ marginBottom: 'var(--space-2)' }}>Booking Confirmed!</h2>
                    <p className="text-muted" style={{ marginBottom: 'var(--space-6)' }}>
                        Your appointment has been successfully booked.
                    </p>
                    
                    {/* Confirmation Code - IMPORTANT */}
                    <div style={{
                        background: 'linear-gradient(135deg, var(--primary-600), var(--primary-700))',
                        color: 'white',
                        padding: 'var(--space-6)',
                        borderRadius: 'var(--radius-xl)',
                        marginBottom: 'var(--space-6)',
                        maxWidth: '400px',
                        margin: '0 auto var(--space-6)'
                    }}>
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.9, marginBottom: 'var(--space-2)' }}>
                            Your Confirmation Code
                        </div>
                        <div style={{ 
                            fontSize: '2rem', 
                            fontWeight: 700, 
                            letterSpacing: '0.15em',
                            fontFamily: 'monospace',
                            background: 'rgba(255,255,255,0.15)',
                            padding: 'var(--space-3) var(--space-4)',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: 'var(--space-3)'
                        }}>
                            {confirmationCode}
                        </div>
                        <p style={{ fontSize: '0.8125rem', opacity: 0.9, marginBottom: 0 }}>
                            📝 Save this code! You'll need it to check-in on arrival.
                        </p>
                    </div>
                    
                    <div className="card" style={{ 
                        background: 'var(--gray-50)', 
                        padding: 'var(--space-6)',
                        textAlign: 'left',
                        maxWidth: '400px',
                        margin: '0 auto var(--space-6)'
                    }}>
                        <div style={{ marginBottom: 'var(--space-4)' }}>
                            <div className="text-sm text-muted">Doctor</div>
                            <div className="font-semibold">{doctor.name}</div>
                        </div>
                        <div style={{ marginBottom: 'var(--space-4)' }}>
                            <div className="text-sm text-muted">Date & Time</div>
                            <div className="font-semibold">{formatDate(selectedSlot)} at {formatTime(selectedSlot)}</div>
                        </div>
                        {prediction && (
                            <div>
                                <div className="text-sm text-muted">Recommended Arrival</div>
                                <div className="font-semibold">{new Date(prediction.recommended_arrival).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</div>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center justify-center gap-3">
                        <button onClick={() => window.location.reload()} className="btn btn-outline">
                            Book Another
                        </button>
                        <button 
                            onClick={() => navigator.clipboard.writeText(confirmationCode)} 
                            className="btn btn-primary"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                            Copy Code
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="grid" style={{ gridTemplateColumns: selectedSlot && prediction ? '1fr 400px' : '1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
            {/* Main booking section */}
            <div>
                {/* Doctor info card */}
                <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                    <div className="card-body">
                        <div className="flex items-center gap-4">
                            <div className="doctor-avatar" style={{ width: '56px', height: '56px', fontSize: '1.25rem' }}>
                                {doctor.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </div>
                            <div>
                                <h3 style={{ marginBottom: '2px' }}>{doctor.name}</h3>
                                <p className="text-muted" style={{ marginBottom: 0 }}>{doctor.specialty || 'General Practice'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Time slots */}
                <div className="card">
                    <div className="card-header">
                        <h4 style={{ marginBottom: 0 }}>Select a Time Slot</h4>
                    </div>
                    <div className="card-body">
                        {loading ? (
                            <div className="flex items-center justify-center" style={{ padding: 'var(--space-8)' }}>
                                <div className="spinner"></div>
                            </div>
                        ) : Object.keys(groupedSlots).length === 0 ? (
                            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                                <div className="empty-state-icon" style={{ width: '60px', height: '60px' }}>
                                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                        <line x1="16" y1="2" x2="16" y2="6" />
                                        <line x1="8" y1="2" x2="8" y2="6" />
                                        <line x1="3" y1="10" x2="21" y2="10" />
                                    </svg>
                                </div>
                                <h4 className="empty-state-title">No Available Slots</h4>
                                <p className="empty-state-description">
                                    This doctor has no available slots at the moment. Please check back later.
                                </p>
                            </div>
                        ) : (
                            Object.entries(groupedSlots).map(([date, slots]) => (
                                <div key={date} style={{ marginBottom: 'var(--space-6)' }}>
                                    <h5 style={{ 
                                        marginBottom: 'var(--space-3)',
                                        color: 'var(--gray-600)',
                                        fontWeight: 600,
                                        fontSize: '0.875rem'
                                    }}>
                                        {date}
                                    </h5>
                                    <div className="time-slot-grid">
                                        {slots.map((slot) => (
                                            <button
                                                key={slot}
                                                className={`time-slot ${selectedSlot === slot ? 'selected' : ''}`}
                                                onClick={() => handleSlotSelect(slot)}
                                            >
                                                {formatTime(slot)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Prediction & Booking sidebar */}
            {selectedSlot && (
                <div className="slide-up" style={{ position: 'sticky', top: 'calc(var(--space-20) + var(--space-4))' }}>
                    {predicting ? (
                        <div className="card">
                            <div className="card-body flex items-center justify-center" style={{ padding: 'var(--space-10)' }}>
                                <div className="spinner"></div>
                            </div>
                        </div>
                    ) : prediction ? (
                        <>
                            {/* Prediction card */}
                            <div className="prediction-card" style={{ marginBottom: 'var(--space-4)' }}>
                                <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-3)' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-600)" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <polyline points="12 6 12 12 16 14" />
                                    </svg>
                                    <span className="font-semibold" style={{ color: 'var(--primary-700)' }}>AI Wait Time Prediction</span>
                                </div>
                                
                                <div className="prediction-value">
                                    <span className="prediction-number">{Math.round(prediction.prediction)}</span>
                                    <span className="prediction-unit">min</span>
                                </div>
                                <p className="prediction-label">Estimated wait after arrival</p>
                                
                                <div className="prediction-detail">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                    <span>Likely range: {prediction.expected_range}</span>
                                </div>
                            </div>

                            {/* Arrival recommendation */}
                            <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
                                <div className="card-body">
                                    <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-3)' }}>
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: 'var(--radius-md)',
                                            background: 'var(--accent-100)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'var(--accent-600)'
                                        }}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                <polyline points="22 4 12 14.01 9 11.01" />
                                            </svg>
                                        </div>
                                        <span className="font-semibold">Recommended Arrival</span>
                                    </div>
                                    <p style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 'var(--space-1)', color: 'var(--gray-900)' }}>
                                        {new Date(prediction.recommended_arrival).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                    </p>
                                    <p className="text-sm text-muted" style={{ marginBottom: 0 }}>
                                        {Math.round(prediction.recommended_arrival_minutes)} minutes before your slot
                                    </p>
                                </div>
                            </div>

                            {/* Risk indicator */}
                            {prediction.tail_risk > 0.3 && (
                                <div className="alert alert-warning" style={{ marginBottom: 'var(--space-4)' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                        <line x1="12" y1="9" x2="12" y2="13" />
                                        <line x1="12" y1="17" x2="12.01" y2="17" />
                                    </svg>
                                    <div>
                                        <strong>Higher Wait Risk</strong>
                                        <p style={{ fontSize: '0.8125rem', marginBottom: 0, marginTop: '2px' }}>
                                            {Math.round(prediction.tail_risk * 100)}% chance of waiting {'>'} 30 min. Consider arriving earlier.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Booking form */}
                            <div className="card">
                                <div className="card-body">
                                    <h4 style={{ marginBottom: 'var(--space-4)' }}>Your Details</h4>
                                    
                                    {error && (
                                        <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>
                                            {error}
                                        </div>
                                    )}
                                    
                                    {/* Show simplified form for authenticated patients */}
                                    {isAuthenticated && patientId ? (
                                        <div style={{
                                            background: 'var(--primary-50)',
                                            border: '1px solid var(--primary-100)',
                                            borderRadius: 'var(--radius-lg)',
                                            padding: 'var(--space-4)',
                                            marginBottom: 'var(--space-4)'
                                        }}>
                                            <div className="flex items-center gap-3">
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
                                                    <div style={{ fontWeight: 600, color: 'var(--gray-900)' }}>
                                                        {patientName}
                                                    </div>
                                                    <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>
                                                        Booking as logged in patient
                                                    </div>
                                                </div>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success-500)" strokeWidth="2" style={{ marginLeft: 'auto' }}>
                                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                    <polyline points="22 4 12 14.01 9 11.01" />
                                                </svg>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="form-group">
                                                <label className="form-label">Full Name *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Enter your full name"
                                            value={patientName}
                                            onChange={(e) => setPatientName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label className="form-label">Email</label>
                                        <input
                                            type="email"
                                            className="form-input"
                                            placeholder="your@email.com"
                                            value={patientEmail}
                                            onChange={(e) => setPatientEmail(e.target.value)}
                                        />
                                        <p className="form-hint">For appointment confirmation</p>
                                    </div>
                                    
                                    <div className="form-group">
                                        <label className="form-label">Phone</label>
                                        <input
                                            type="tel"
                                            className="form-input"
                                            placeholder="Your phone number"
                                            value={patientPhone}
                                            onChange={(e) => setPatientPhone(e.target.value)}
                                        />
                                    </div>
                                        </>
                                    )}
                                    
                                    <button 
                                        onClick={handleBooking} 
                                        className="btn btn-accent btn-lg btn-block"
                                        disabled={booking || !patientName.trim()}
                                    >
                                        {booking ? (
                                            <>
                                                <span className="spinner spinner-sm" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></span>
                                                Booking...
                                            </>
                                        ) : (
                                            <>
                                                Confirm Booking
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                    <polyline points="22 4 12 14.01 9 11.01" />
                                                </svg>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : null}
                </div>
            )}

            <style>{`
                @media (max-width: 900px) {
                    .grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default BookingForm;