import React, { useEffect, useState } from 'react';
import { getQueueStatus, updateSlotTime, getQueueTypes, transferToQueue, createMedicalReport, getReportsByDoctor } from '../utils/api';
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

interface QueueType {
    id: number;
    name: string;
    description: string;
    color: string;
    icon: string;
}

interface MultiStageData {
    queue?: {
        registration: number;
        triage: number;
        consultation: number;
    };
}

interface PrescriptionInput {
    medicine_name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
}

interface ReportFormData {
    diagnosis: string;
    symptoms: string;
    notes: string;
    vital_signs: {
        bloodPressure: string;
        heartRate: string;
        temperature: string;
        weight: string;
        height: string;
    };
    lab_tests_ordered: string[];
    prescriptions: PrescriptionInput[];
}

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ socket }) => {
    const [queueStatus, setQueueStatus] = useState<QueueItem[]>([]);
    const [queueTypes, setQueueTypes] = useState<QueueType[]>([]);
    const [multiStage, setMultiStage] = useState<MultiStageData>({});
    const [selectedPatient, setSelectedPatient] = useState('');
    const [actualDuration, setActualDuration] = useState('');
    const [selectedQueueId, setSelectedQueueId] = useState('');
    const [newStage, setNewStage] = useState('triage');
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferPatient, setTransferPatient] = useState<QueueItem | null>(null);
    const [selectedQueueType, setSelectedQueueType] = useState<number>(0);
    const [transferNotes, setTransferNotes] = useState('');
    const [loading, setLoading] = useState(true);
    
    // Medical report state
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportPatient, setReportPatient] = useState<QueueItem | null>(null);
    const [reportForm, setReportForm] = useState<ReportFormData>({
        diagnosis: '',
        symptoms: '',
        notes: '',
        vital_signs: { bloodPressure: '', heartRate: '', temperature: '', weight: '', height: '' },
        lab_tests_ordered: [],
        prescriptions: []
    });
    const [newLabTest, setNewLabTest] = useState('');
    const [savingReport, setSavingReport] = useState(false);
    const [activeTab, setActiveTab] = useState<'queue' | 'reports'>('queue');
    const [recentReports, setRecentReports] = useState<any[]>([]);

    const doctorId = localStorage.getItem('doctorId') || '1';
    const userName = localStorage.getItem('userName') || 'Doctor';

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [status, multiRes, types, reports] = await Promise.all([
                    getQueueStatus(doctorId),
                    fetch(`/api/multi-stage-status/${doctorId}`).then(r => r.json()),
                    getQueueTypes(),
                    getReportsByDoctor(parseInt(doctorId))
                ]);
                setQueueStatus(status);
                setMultiStage(multiRes);
                setQueueTypes(types);
                setRecentReports(reports.slice(0, 10));
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        socket.on('queue-update', (data) => {
            if (data.type === 'stage-advanced' || data.type === 'new-booking' || data.type === 'queue-transfer') {
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

    const openReportModal = (patient: QueueItem) => {
        setReportPatient(patient);
        setReportForm({
            diagnosis: '',
            symptoms: '',
            notes: '',
            vital_signs: { bloodPressure: '', heartRate: '', temperature: '', weight: '', height: '' },
            lab_tests_ordered: [],
            prescriptions: []
        });
        setShowReportModal(true);
    };

    const addPrescription = () => {
        setReportForm(prev => ({
            ...prev,
            prescriptions: [...prev.prescriptions, {
                medicine_name: '',
                dosage: '',
                frequency: '',
                duration: '',
                instructions: ''
            }]
        }));
    };

    const updatePrescription = (index: number, field: keyof PrescriptionInput, value: string) => {
        setReportForm(prev => ({
            ...prev,
            prescriptions: prev.prescriptions.map((p, i) => 
                i === index ? { ...p, [field]: value } : p
            )
        }));
    };

    const removePrescription = (index: number) => {
        setReportForm(prev => ({
            ...prev,
            prescriptions: prev.prescriptions.filter((_, i) => i !== index)
        }));
    };

    const addLabTest = () => {
        if (newLabTest.trim()) {
            setReportForm(prev => ({
                ...prev,
                lab_tests_ordered: [...prev.lab_tests_ordered, newLabTest.trim()]
            }));
            setNewLabTest('');
        }
    };

    const removeLabTest = (index: number) => {
        setReportForm(prev => ({
            ...prev,
            lab_tests_ordered: prev.lab_tests_ordered.filter((_, i) => i !== index)
        }));
    };

    const handleSaveReport = async () => {
        if (!reportPatient) return;
        
        setSavingReport(true);
        try {
            const reportData = {
                patientId: parseInt(reportPatient.patient_id),
                doctorId: parseInt(doctorId),
                appointmentId: parseInt(reportPatient.id),
                diagnosis: reportForm.diagnosis,
                symptoms: reportForm.symptoms,
                notes: reportForm.notes,
                vitalSigns: {
                    bloodPressure: reportForm.vital_signs.bloodPressure || undefined,
                    heartRate: reportForm.vital_signs.heartRate ? parseInt(reportForm.vital_signs.heartRate) : undefined,
                    temperature: reportForm.vital_signs.temperature ? parseFloat(reportForm.vital_signs.temperature) : undefined,
                    weight: reportForm.vital_signs.weight ? parseFloat(reportForm.vital_signs.weight) : undefined,
                    height: reportForm.vital_signs.height ? parseFloat(reportForm.vital_signs.height) : undefined
                },
                labTestsOrdered: reportForm.lab_tests_ordered,
                prescriptions: reportForm.prescriptions
                    .filter(p => p.medicine_name.trim())
                    .map(p => ({
                        medicineName: p.medicine_name,
                        dosage: p.dosage || undefined,
                        frequency: p.frequency || undefined,
                        duration: p.duration || undefined,
                        instructions: p.instructions || undefined
                    }))
            };

            await createMedicalReport(reportData);
            
            // Complete the appointment after saving report
            await handleCompletePatient(reportPatient.id);
            
            setShowReportModal(false);
            setReportPatient(null);
            
            // Refresh reports
            const reports = await getReportsByDoctor(parseInt(doctorId));
            setRecentReports(reports.slice(0, 10));
        } catch (error) {
            console.error('Failed to save report:', error);
            alert('Failed to save report. Please try again.');
        } finally {
            setSavingReport(false);
        }
    };

    const handleTransferPatient = async () => {
        if (!transferPatient || !selectedQueueType) return;
        
        try {
            await transferToQueue(
                parseInt(transferPatient.id),
                selectedQueueType,
                parseInt(doctorId),
                transferNotes
            );
            
            // Refresh queue status
            const status = await getQueueStatus(doctorId);
            setQueueStatus(status);
            
            // Reset modal state
            setShowTransferModal(false);
            setTransferPatient(null);
            setSelectedQueueType(0);
            setTransferNotes('');
        } catch (error) {
            console.error('Transfer failed:', error);
            alert('Failed to transfer patient. Please try again.');
        }
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
            <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--primary-100)', color: 'var(--primary-600)' }}>
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
                    <div className="stat-icon" style={{ background: 'var(--accent-100)', color: 'var(--accent-700)' }}>
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
                                                        <>
                                                            <button 
                                                                className="btn btn-sm btn-secondary"
                                                                onClick={() => {
                                                                    setTransferPatient(patient);
                                                                    setShowTransferModal(true);
                                                                }}
                                                                title="Transfer to Lab/Pharmacy/Radiology"
                                                            >
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                                                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                                                    <path d="m15 8 5-5" />
                                                                    <path d="M17.5 2.5 21 6" />
                                                                </svg>
                                                                Transfer
                                                            </button>
                                                            <button 
                                                                className="btn btn-sm btn-primary"
                                                                onClick={() => openReportModal(patient)}
                                                                title="Create medical report and complete"
                                                            >
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                                                    <polyline points="14 2 14 8 20 8"/>
                                                                    <line x1="12" y1="18" x2="12" y2="12"/>
                                                                    <line x1="9" y1="15" x2="15" y2="15"/>
                                                                </svg>
                                                                Report
                                                            </button>
                                                        </>
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

            {/* Transfer to Queue Modal */}
            {showTransferModal && transferPatient && (
                <div className="modal-overlay" onClick={() => setShowTransferModal(false)}>
                    <div className="modal slide-up" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 style={{ marginBottom: 0 }}>Transfer Patient to Queue</h3>
                            <button className="modal-close" onClick={() => setShowTransferModal(false)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="flex items-center gap-3" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--gray-50)', borderRadius: 'var(--radius-lg)' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: 'var(--radius-full)',
                                    background: 'var(--primary-100)',
                                    color: 'var(--primary-600)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 600
                                }}>
                                    {transferPatient.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <div className="font-medium">{transferPatient.name}</div>
                                    <div className="text-muted" style={{ fontSize: '0.875rem' }}>Current: {transferPatient.stage}</div>
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label">Select Destination Queue</label>
                                <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                                    {queueTypes.filter(q => q.name.toLowerCase() !== 'consultation').map((qType) => (
                                        <label 
                                            key={qType.id}
                                            className={`queue-type-option ${selectedQueueType === qType.id ? 'selected' : ''}`}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 'var(--space-3)',
                                                padding: 'var(--space-3) var(--space-4)',
                                                border: `2px solid ${selectedQueueType === qType.id ? qType.color : 'var(--gray-200)'}`,
                                                borderRadius: 'var(--radius-lg)',
                                                cursor: 'pointer',
                                                background: selectedQueueType === qType.id ? `${qType.color}10` : 'white',
                                                transition: 'all 0.15s ease'
                                            }}
                                        >
                                            <input
                                                type="radio"
                                                name="queueType"
                                                value={qType.id}
                                                checked={selectedQueueType === qType.id}
                                                onChange={() => setSelectedQueueType(qType.id)}
                                                style={{ display: 'none' }}
                                            />
                                            <div style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: 'var(--radius-md)',
                                                background: `${qType.color}20`,
                                                color: qType.color,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '1.25rem'
                                            }}>
                                                {qType.icon}
                                            </div>
                                            <div>
                                                <div className="font-medium">{qType.name}</div>
                                                <div className="text-muted" style={{ fontSize: '0.75rem' }}>{qType.description}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label">Notes (Optional)</label>
                                <textarea
                                    className="form-input"
                                    placeholder="e.g., Please run CBC and lipid profile..."
                                    value={transferNotes}
                                    onChange={(e) => setTransferNotes(e.target.value)}
                                    rows={3}
                                    style={{ resize: 'none' }}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => {
                                setShowTransferModal(false);
                                setTransferPatient(null);
                                setSelectedQueueType(0);
                                setTransferNotes('');
                            }}>
                                Cancel
                            </button>
                            <button 
                                className="btn btn-primary" 
                                onClick={handleTransferPatient}
                                disabled={!selectedQueueType}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 12h14" />
                                    <path d="m12 5 7 7-7 7" />
                                </svg>
                                Transfer Patient
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Medical Report Modal */}
            {showReportModal && reportPatient && (
                <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
                    <div className="modal modal-lg slide-up" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3 style={{ marginBottom: 'var(--space-1)' }}>Create Medical Report</h3>
                                <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: 0 }}>
                                    Patient: <strong>{reportPatient.name}</strong>
                                </p>
                            </div>
                            <button className="modal-close" onClick={() => setShowReportModal(false)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                            {/* Diagnosis & Symptoms */}
                            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                                <div className="form-group">
                                    <label className="form-label">Diagnosis *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g., Viral fever, Hypertension"
                                        value={reportForm.diagnosis}
                                        onChange={(e) => setReportForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Symptoms</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g., Fever, headache, body ache"
                                        value={reportForm.symptoms}
                                        onChange={(e) => setReportForm(prev => ({ ...prev, symptoms: e.target.value }))}
                                    />
                                </div>
                            </div>

                            {/* Vital Signs */}
                            <div style={{ marginBottom: 'var(--space-4)' }}>
                                <label className="form-label">Vital Signs</label>
                                <div className="grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gap: 'var(--space-2)' }}>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="BP (120/80)"
                                        value={reportForm.vital_signs.bloodPressure}
                                        onChange={(e) => setReportForm(prev => ({
                                            ...prev,
                                            vital_signs: { ...prev.vital_signs, bloodPressure: e.target.value }
                                        }))}
                                    />
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="HR (bpm)"
                                        value={reportForm.vital_signs.heartRate}
                                        onChange={(e) => setReportForm(prev => ({
                                            ...prev,
                                            vital_signs: { ...prev.vital_signs, heartRate: e.target.value }
                                        }))}
                                    />
                                    <input
                                        type="number"
                                        step="0.1"
                                        className="form-input"
                                        placeholder="Temp (°F)"
                                        value={reportForm.vital_signs.temperature}
                                        onChange={(e) => setReportForm(prev => ({
                                            ...prev,
                                            vital_signs: { ...prev.vital_signs, temperature: e.target.value }
                                        }))}
                                    />
                                    <input
                                        type="number"
                                        step="0.1"
                                        className="form-input"
                                        placeholder="Wt (kg)"
                                        value={reportForm.vital_signs.weight}
                                        onChange={(e) => setReportForm(prev => ({
                                            ...prev,
                                            vital_signs: { ...prev.vital_signs, weight: e.target.value }
                                        }))}
                                    />
                                    <input
                                        type="number"
                                        step="0.1"
                                        className="form-input"
                                        placeholder="Ht (cm)"
                                        value={reportForm.vital_signs.height}
                                        onChange={(e) => setReportForm(prev => ({
                                            ...prev,
                                            vital_signs: { ...prev.vital_signs, height: e.target.value }
                                        }))}
                                    />
                                </div>
                            </div>

                            {/* Lab Tests */}
                            <div style={{ marginBottom: 'var(--space-4)' }}>
                                <label className="form-label">Lab Tests Ordered</label>
                                <div className="flex gap-2" style={{ marginBottom: 'var(--space-2)' }}>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g., CBC, Lipid Profile"
                                        value={newLabTest}
                                        onChange={(e) => setNewLabTest(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLabTest())}
                                    />
                                    <button type="button" className="btn btn-outline" onClick={addLabTest}>Add</button>
                                </div>
                                {reportForm.lab_tests_ordered.length > 0 && (
                                    <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                                        {reportForm.lab_tests_ordered.map((test, i) => (
                                            <span key={i} className="tag">
                                                {test}
                                                <button type="button" className="tag-remove" onClick={() => removeLabTest(i)}>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <line x1="18" y1="6" x2="6" y2="18"/>
                                                        <line x1="6" y1="6" x2="18" y2="18"/>
                                                    </svg>
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Notes */}
                            <div className="form-group">
                                <label className="form-label">Clinical Notes</label>
                                <textarea
                                    className="form-input"
                                    placeholder="Additional notes about the consultation..."
                                    rows={2}
                                    value={reportForm.notes}
                                    onChange={(e) => setReportForm(prev => ({ ...prev, notes: e.target.value }))}
                                    style={{ resize: 'none' }}
                                />
                            </div>

                            {/* Prescriptions */}
                            <div>
                                <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-2)' }}>
                                    <label className="form-label" style={{ marginBottom: 0 }}>Prescriptions</label>
                                    <button type="button" className="btn btn-sm btn-outline" onClick={addPrescription}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="12" y1="5" x2="12" y2="19"/>
                                            <line x1="5" y1="12" x2="19" y2="12"/>
                                        </svg>
                                        Add Medicine
                                    </button>
                                </div>
                                
                                {reportForm.prescriptions.length === 0 ? (
                                    <div className="text-muted" style={{ textAlign: 'center', padding: 'var(--space-4)', background: 'var(--gray-50)', borderRadius: 'var(--radius-lg)' }}>
                                        No prescriptions added yet
                                    </div>
                                ) : (
                                    reportForm.prescriptions.map((rx, index) => (
                                        <div key={index} className="prescription-card">
                                            <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-2)' }}>
                                                <span className="font-medium" style={{ fontSize: '0.875rem' }}>Medicine #{index + 1}</span>
                                                <button 
                                                    type="button" 
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => removePrescription(index)}
                                                    style={{ color: 'var(--error-500)' }}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                            <div className="grid" style={{ gridTemplateColumns: '2fr 1fr 1fr', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    placeholder="Medicine name *"
                                                    value={rx.medicine_name}
                                                    onChange={(e) => updatePrescription(index, 'medicine_name', e.target.value)}
                                                />
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    placeholder="Dosage (500mg)"
                                                    value={rx.dosage}
                                                    onChange={(e) => updatePrescription(index, 'dosage', e.target.value)}
                                                />
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    placeholder="Duration (7 days)"
                                                    value={rx.duration}
                                                    onChange={(e) => updatePrescription(index, 'duration', e.target.value)}
                                                />
                                            </div>
                                            <div className="grid" style={{ gridTemplateColumns: '1fr 2fr', gap: 'var(--space-2)' }}>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    placeholder="Frequency (2x daily)"
                                                    value={rx.frequency}
                                                    onChange={(e) => updatePrescription(index, 'frequency', e.target.value)}
                                                />
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    placeholder="Instructions (after meals)"
                                                    value={rx.instructions}
                                                    onChange={(e) => updatePrescription(index, 'instructions', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowReportModal(false)}>
                                Cancel
                            </button>
                            <button 
                                className="btn btn-primary" 
                                onClick={handleSaveReport}
                                disabled={!reportForm.diagnosis.trim() || savingReport}
                            >
                                {savingReport ? (
                                    <>
                                        <span className="spinner-sm"></span>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="20 6 9 17 4 12"/>
                                        </svg>
                                        Save & Complete
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @media (max-width: 1024px) {
                    .grid[style*="repeat(4"] {
                        grid-template-columns: repeat(2, 1fr) !important;
                    }
                }
                @media (max-width: 600px) {
                    .grid[style*="repeat(4"], .grid[style*="repeat(2"] {
                        grid-template-columns: 1fr !important;
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
                    max-width: 720px;
                    max-height: 90vh;
                    overflow-y: auto;
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
                .prescription-card {
                    border: 1px solid var(--gray-200);
                    border-radius: var(--radius-lg);
                    padding: var(--space-4);
                    background: var(--gray-50);
                    margin-bottom: var(--space-3);
                }
                .tag {
                    display: inline-flex;
                    align-items: center;
                    gap: var(--space-1);
                    padding: var(--space-1) var(--space-2);
                    background: var(--primary-100);
                    color: var(--primary-700);
                    border-radius: var(--radius-md);
                    font-size: 0.75rem;
                }
                .tag-remove {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: inherit;
                    padding: 0;
                    display: flex;
                }
            `}</style>
        </div>
    );
};

export default DoctorDashboard;