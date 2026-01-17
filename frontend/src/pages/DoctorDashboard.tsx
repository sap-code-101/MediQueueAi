import React, { useEffect, useState } from 'react';
import { getQueueStatus, updateSlotTime } from '../utils/api';
import { Socket } from 'socket.io-client';

interface DoctorDashboardProps {
    socket: Socket;
}

interface QueueItem {
    id: string;
    patient_id: string;
    name: string;
    stage: string;
    slot_time: string;
    check_in_time?: string;
    estimated_wait?: number;
}

interface MultiStageData {
    queue?: {
        registration: number;
        triage: number;
        consultation: number;
    };
}

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ socket }) => {
    const [queueStatus, setQueueStatus] = useState<QueueItem[]>([]);
    const [multiStage, setMultiStage] = useState<MultiStageData>({});
    const [selectedPatient, setSelectedPatient] = useState('');
    const [actualDuration, setActualDuration] = useState('');
    const [selectedQueueId, setSelectedQueueId] = useState('');
    const [newStage, setNewStage] = useState('triage');
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [loading, setLoading] = useState(true);

    const doctorId = localStorage.getItem('doctorId') || '1';
    const userName = localStorage.getItem('userName') || 'Doctor';

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [status, multiRes] = await Promise.all([
                    getQueueStatus(doctorId),
                    fetch(`/api/multi-stage-status/${doctorId}`).then(r => r.json())
                ]);
                setQueueStatus(status);
                setMultiStage(multiRes);
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        socket.on('queue-update', (data) => {
            if (data.type === 'stage-advanced' || data.type === 'new-booking') {
                fetchData();
            }
        });

        return () => {
            socket.off('queue-update');
        };
    }, [socket, doctorId]);

    const handleUpdateSlotTime = async () => {
        if (selectedPatient && actualDuration) {
            await updateSlotTime(doctorId, selectedPatient, parseInt(actualDuration));
            const status = await getQueueStatus(doctorId);
            setQueueStatus(status);
            setSelectedPatient('');
            setActualDuration('');
            setShowUpdateModal(false);
        }
    };

    const handleAdvanceStage = async (queueId: string, stage: string) => {
        await fetch('/api/advance-stage', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                Authorization: `Bearer ${localStorage.getItem('token')}` 
            },
            body: JSON.stringify({ queueId, newStage: stage, doctorId })
        });
    };

    const handleCompletePatient = async (queueId: string) => {
        await fetch('/api/complete-appointment', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                Authorization: `Bearer ${localStorage.getItem('token')}` 
            },
            body: JSON.stringify({ queueId, doctorId })
        });
        const status = await getQueueStatus(doctorId);
        setQueueStatus(status);
    };

    const getStageColor = (stage: string) => {
        switch (stage) {
            case 'registration': return 'var(--gray-500)';
            case 'triage': return 'var(--warning-500)';
            case 'consultation': return 'var(--primary-500)';
            case 'completed': return 'var(--success-500)';
            default: return 'var(--gray-400)';
        }
    };

    const getNextStage = (currentStage: string) => {
        switch (currentStage) {
            case 'registration': return 'triage';
            case 'triage': return 'consultation';
            case 'consultation': return 'completed';
            default: return null;
        }
    };

    const totalInQueue = (multiStage.queue?.registration || 0) + 
                         (multiStage.queue?.triage || 0) + 
                         (multiStage.queue?.consultation || 0);

    const formatTime = (timeString: string) => {
        return new Date(timeString).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <div className="fade-in">
            {/* Header */}
            <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-8)' }}>
                <div>
                    <h1 style={{ marginBottom: 'var(--space-1)' }}>Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, Dr. {userName.split(' ').pop()}</h1>
                    <p className="text-muted" style={{ marginBottom: 0 }}>Here's your queue overview for today</p>
                </div>
                <button 
                    className="btn btn-primary"
                    onClick={() => setShowUpdateModal(true)}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                    </svg>
                    Update Timing
                </button>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid" style={{ marginBottom: 'var(--space-8)' }}>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--primary-50)', color: 'var(--primary-600)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{totalInQueue}</div>
                        <div className="stat-label">Total in Queue</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--gray-100)', color: 'var(--gray-600)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{multiStage.queue?.registration || 0}</div>
                        <div className="stat-label">Registration</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--warning-50)', color: 'var(--warning-600)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{multiStage.queue?.triage || 0}</div>
                        <div className="stat-label">Triage</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--accent-50)', color: 'var(--accent-600)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{multiStage.queue?.consultation || 0}</div>
                        <div className="stat-label">Consultation</div>
                    </div>
                </div>
            </div>

            {/* Queue Pipeline */}
            <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                <div className="card-header">
                    <h3 style={{ marginBottom: 0 }}>Patient Queue Pipeline</h3>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div className="flex items-center justify-center" style={{ padding: 'var(--space-10)' }}>
                            <div className="spinner"></div>
                        </div>
                    ) : queueStatus.length === 0 ? (
                        <div className="empty-state" style={{ padding: 'var(--space-10)' }}>
                            <div className="empty-state-icon">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <line x1="19" y1="8" x2="19" y2="14" />
                                    <line x1="22" y1="11" x2="16" y2="11" />
                                </svg>
                            </div>
                            <h4 className="empty-state-title">No Patients in Queue</h4>
                            <p className="empty-state-description">
                                When patients book appointments, they'll appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Patient</th>
                                        <th>Slot Time</th>
                                        <th>Check-in</th>
                                        <th>Stage</th>
                                        <th>Est. Wait</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {queueStatus.map((patient, index) => (
                                        <tr key={patient.id} className="slide-up" style={{ animationDelay: `${index * 50}ms` }}>
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
                                                        {patient.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?'}
                                                    </div>
                                                    <span className="font-medium">{patient.name}</span>
                                                </div>
                                            </td>
                                            <td>{patient.slot_time ? formatTime(patient.slot_time) : '—'}</td>
                                            <td>{patient.check_in_time ? formatTime(patient.check_in_time) : <span className="text-muted">Not checked in</span>}</td>
                                            <td>
                                                <span className="stage-pill" style={{ 
                                                    background: `${getStageColor(patient.stage)}15`,
                                                    color: getStageColor(patient.stage),
                                                    border: `1px solid ${getStageColor(patient.stage)}30`
                                                }}>
                                                    {patient.stage}
                                                </span>
                                            </td>
                                            <td>
                                                {patient.estimated_wait ? (
                                                    <span className="font-medium">{patient.estimated_wait} min</span>
                                                ) : (
                                                    <span className="text-muted">—</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="flex items-center justify-end gap-2">
                                                    {getNextStage(patient.stage) && getNextStage(patient.stage) !== 'completed' && (
                                                        <button 
                                                            className="btn btn-sm btn-outline"
                                                            onClick={() => handleAdvanceStage(patient.id, getNextStage(patient.stage)!)}
                                                        >
                                                            → {getNextStage(patient.stage)}
                                                        </button>
                                                    )}
                                                    {patient.stage === 'consultation' && (
                                                        <button 
                                                            className="btn btn-sm btn-primary"
                                                            onClick={() => handleCompletePatient(patient.id)}
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <polyline points="20 6 9 17 4 12" />
                                                            </svg>
                                                            Complete
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Update Duration Modal */}
            {showUpdateModal && (
                <div className="modal-overlay" onClick={() => setShowUpdateModal(false)}>
                    <div className="modal slide-up" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 style={{ marginBottom: 0 }}>Update Appointment Duration</h3>
                            <button className="modal-close" onClick={() => setShowUpdateModal(false)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            <p className="text-muted" style={{ marginBottom: 'var(--space-4)' }}>
                                Update the actual duration of an appointment to improve future predictions.
                            </p>
                            <div className="form-group">
                                <label className="form-label">Select Patient</label>
                                <select 
                                    className="form-select"
                                    value={selectedPatient} 
                                    onChange={(e) => setSelectedPatient(e.target.value)}
                                >
                                    <option value="">Select a patient...</option>
                                    {queueStatus.map((patient) => (
                                        <option key={patient.id} value={patient.patient_id}>
                                            {patient.name} - {patient.stage}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Actual Duration (minutes)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="e.g., 15"
                                    value={actualDuration}
                                    onChange={(e) => setActualDuration(e.target.value)}
                                    min="1"
                                />
                                <p className="form-hint">How long did this appointment actually take?</p>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowUpdateModal(false)}>
                                Cancel
                            </button>
                            <button 
                                className="btn btn-primary" 
                                onClick={handleUpdateSlotTime}
                                disabled={!selectedPatient || !actualDuration}
                            >
                                Update Duration
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: var(--space-4);
                }
                @media (max-width: 1024px) {
                    .stats-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
                @media (max-width: 600px) {
                    .stats-grid {
                        grid-template-columns: 1fr;
                    }
                }
                .stage-pill {
                    padding: var(--space-1) var(--space-3);
                    border-radius: var(--radius-full);
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: capitalize;
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

export default DoctorDashboard;