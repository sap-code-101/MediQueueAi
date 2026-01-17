import React, { useState, useEffect } from 'react';
import { getPendingPrescriptions, dispensePrescription, dispenseAllPrescriptions, getAllMedicalReports, getMedicalReportById } from '../utils/api';

interface Prescription {
    id: number;
    report_id: number;
    medicine_name: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    instructions?: string;
    patient_name: string;
    doctor_name: string;
    created_at: string;
}

interface Report {
    id: number;
    patient_name: string;
    doctor_name: string;
    specialty: string;
    diagnosis?: string;
    symptoms?: string;
    prescription_count: number;
    pending_prescriptions: number;
    created_at: string;
}

interface ReportDetail {
    id: number;
    patient_name: string;
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
        dispensed_by_name?: string;
        dispensed_at?: string;
    }[];
    created_at: string;
}

const ClinicStaffDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'prescriptions' | 'reports'>('prescriptions');
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [reports, setReports] = useState<Report[]>([]);
    const [selectedReport, setSelectedReport] = useState<ReportDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [dispensing, setDispensing] = useState<number | null>(null);
    const [message, setMessage] = useState({ text: '', type: '' });

    const userName = localStorage.getItem('displayName') || 'Staff';

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'prescriptions') {
                const data = await getPendingPrescriptions();
                setPrescriptions(data);
            } else {
                const data = await getAllMedicalReports();
                setReports(data);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDispense = async (prescriptionId: number) => {
        setDispensing(prescriptionId);
        try {
            await dispensePrescription(prescriptionId);
            setMessage({ text: 'Prescription dispensed successfully', type: 'success' });
            loadData();
        } catch (error: any) {
            setMessage({ text: error.response?.data?.error || 'Failed to dispense', type: 'error' });
        } finally {
            setDispensing(null);
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        }
    };

    const handleDispenseAll = async (reportId: number) => {
        setDispensing(reportId);
        try {
            await dispenseAllPrescriptions(reportId);
            setMessage({ text: 'All prescriptions dispensed', type: 'success' });
            loadData();
            setSelectedReport(null);
        } catch (error: any) {
            setMessage({ text: error.response?.data?.error || 'Failed to dispense', type: 'error' });
        } finally {
            setDispensing(null);
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        }
    };

    const viewReport = async (reportId: number) => {
        try {
            const report = await getMedicalReportById(reportId);
            setSelectedReport(report);
        } catch (error) {
            console.error('Failed to load report:', error);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    return (
        <div className="page-container fade-in">
            {/* Header */}
            <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-6)' }}>
                <div>
                    <h1 style={{ marginBottom: 'var(--space-1)' }}>Clinic Staff Dashboard</h1>
                    <p className="text-muted">Welcome, {userName}. Manage prescriptions and medical reports.</p>
                </div>
            </div>

            {/* Message */}
            {message.text && (
                <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`} style={{ marginBottom: 'var(--space-4)' }}>
                    {message.text}
                </div>
            )}

            {/* Tabs */}
            <div className="tabs" style={{ marginBottom: 'var(--space-6)' }}>
                <button
                    className={`tab ${activeTab === 'prescriptions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('prescriptions')}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/>
                        <line x1="12" y1="8" x2="12" y2="16"/>
                        <line x1="8" y1="12" x2="16" y2="12"/>
                    </svg>
                    Pending Prescriptions
                    {prescriptions.length > 0 && (
                        <span className="badge badge-primary" style={{ marginLeft: 'var(--space-2)' }}>
                            {prescriptions.length}
                        </span>
                    )}
                </button>
                <button
                    className={`tab ${activeTab === 'reports' ? 'active' : ''}`}
                    onClick={() => setActiveTab('reports')}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    All Reports
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center" style={{ padding: 'var(--space-16)' }}>
                    <div className="spinner"></div>
                </div>
            ) : activeTab === 'prescriptions' ? (
                <div className="card">
                    <div className="card-header">
                        <h3 style={{ marginBottom: 0 }}>Pending Prescriptions to Dispense</h3>
                    </div>
                    {prescriptions.length === 0 ? (
                        <div className="empty-state" style={{ padding: 'var(--space-10)' }}>
                            <div className="empty-state-icon">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <polyline points="20 6 9 17 4 12"/>
                                </svg>
                            </div>
                            <h4 className="empty-state-title">All Caught Up!</h4>
                            <p className="empty-state-description">No pending prescriptions to dispense.</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Patient</th>
                                        <th>Medicine</th>
                                        <th>Dosage</th>
                                        <th>Frequency</th>
                                        <th>Duration</th>
                                        <th>Doctor</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {prescriptions.map((rx) => (
                                        <tr key={rx.id}>
                                            <td className="font-medium">{rx.patient_name}</td>
                                            <td>
                                                <span className="font-medium">{rx.medicine_name}</span>
                                                {rx.instructions && (
                                                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                        {rx.instructions}
                                                    </div>
                                                )}
                                            </td>
                                            <td>{rx.dosage || '—'}</td>
                                            <td>{rx.frequency || '—'}</td>
                                            <td>{rx.duration || '—'}</td>
                                            <td className="text-muted">Dr. {rx.doctor_name}</td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    onClick={() => handleDispense(rx.id)}
                                                    disabled={dispensing === rx.id}
                                                >
                                                    {dispensing === rx.id ? (
                                                        <span className="spinner-sm"></span>
                                                    ) : (
                                                        <>
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <polyline points="20 6 9 17 4 12"/>
                                                            </svg>
                                                            Dispense
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                <div className="card">
                    <div className="card-header">
                        <h3 style={{ marginBottom: 0 }}>Medical Reports</h3>
                    </div>
                    {reports.length === 0 ? (
                        <div className="empty-state" style={{ padding: 'var(--space-10)' }}>
                            <h4 className="empty-state-title">No Reports Yet</h4>
                            <p className="empty-state-description">Medical reports will appear here.</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Patient</th>
                                        <th>Doctor</th>
                                        <th>Diagnosis</th>
                                        <th>Prescriptions</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.map((report) => (
                                        <tr key={report.id}>
                                            <td className="text-muted">{formatDate(report.created_at)}</td>
                                            <td className="font-medium">{report.patient_name}</td>
                                            <td>
                                                Dr. {report.doctor_name}
                                                <div className="text-muted" style={{ fontSize: '0.75rem' }}>{report.specialty}</div>
                                            </td>
                                            <td>{report.diagnosis || '—'}</td>
                                            <td>
                                                {report.prescription_count > 0 ? (
                                                    <span className={`badge ${report.pending_prescriptions > 0 ? 'badge-warning' : 'badge-success'}`}>
                                                        {report.pending_prescriptions > 0 
                                                            ? `${report.pending_prescriptions} pending`
                                                            : 'All dispensed'
                                                        }
                                                    </span>
                                                ) : (
                                                    <span className="text-muted">None</span>
                                                )}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button
                                                    className="btn btn-sm btn-outline"
                                                    onClick={() => viewReport(report.id)}
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Report Detail Modal */}
            {selectedReport && (
                <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
                    <div className="modal modal-lg slide-up" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 style={{ marginBottom: 0 }}>Medical Report</h3>
                            <button className="modal-close" onClick={() => setSelectedReport(null)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                                <div>
                                    <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: 'var(--space-1)' }}>Patient</div>
                                    <div className="font-medium">{selectedReport.patient_name}</div>
                                </div>
                                <div>
                                    <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: 'var(--space-1)' }}>Doctor</div>
                                    <div className="font-medium">Dr. {selectedReport.doctor_name}</div>
                                    <div className="text-muted" style={{ fontSize: '0.875rem' }}>{selectedReport.specialty}</div>
                                </div>
                                <div>
                                    <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: 'var(--space-1)' }}>Date</div>
                                    <div>{formatDate(selectedReport.created_at)}</div>
                                </div>
                            </div>

                            {selectedReport.diagnosis && (
                                <div style={{ marginBottom: 'var(--space-4)' }}>
                                    <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: 'var(--space-1)' }}>Diagnosis</div>
                                    <div className="font-medium">{selectedReport.diagnosis}</div>
                                </div>
                            )}

                            {selectedReport.symptoms && (
                                <div style={{ marginBottom: 'var(--space-4)' }}>
                                    <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: 'var(--space-1)' }}>Symptoms</div>
                                    <div>{selectedReport.symptoms}</div>
                                </div>
                            )}

                            {selectedReport.vital_signs && (
                                <div style={{ marginBottom: 'var(--space-4)' }}>
                                    <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: 'var(--space-2)' }}>Vital Signs</div>
                                    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'var(--space-2)' }}>
                                        {selectedReport.vital_signs.bloodPressure && (
                                            <div className="stat-mini">
                                                <span className="stat-mini-label">Blood Pressure</span>
                                                <span className="stat-mini-value">{selectedReport.vital_signs.bloodPressure}</span>
                                            </div>
                                        )}
                                        {selectedReport.vital_signs.heartRate && (
                                            <div className="stat-mini">
                                                <span className="stat-mini-label">Heart Rate</span>
                                                <span className="stat-mini-value">{selectedReport.vital_signs.heartRate} bpm</span>
                                            </div>
                                        )}
                                        {selectedReport.vital_signs.temperature && (
                                            <div className="stat-mini">
                                                <span className="stat-mini-label">Temperature</span>
                                                <span className="stat-mini-value">{selectedReport.vital_signs.temperature}°F</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {selectedReport.prescriptions && selectedReport.prescriptions.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-2)' }}>
                                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>Prescriptions</div>
                                        {selectedReport.prescriptions.some(p => !p.dispensed) && (
                                            <button
                                                className="btn btn-sm btn-primary"
                                                onClick={() => handleDispenseAll(selectedReport.id)}
                                                disabled={dispensing === selectedReport.id}
                                            >
                                                Dispense All
                                            </button>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                        {selectedReport.prescriptions.map((rx) => (
                                            <div key={rx.id} className="prescription-item" style={{
                                                padding: 'var(--space-3)',
                                                background: rx.dispensed ? 'var(--success-50)' : 'var(--gray-50)',
                                                borderRadius: 'var(--radius-lg)',
                                                border: `1px solid ${rx.dispensed ? 'var(--success-200)' : 'var(--gray-200)'}`
                                            }}>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-medium">{rx.medicine_name}</div>
                                                        <div className="text-muted" style={{ fontSize: '0.875rem' }}>
                                                            {[rx.dosage, rx.frequency, rx.duration].filter(Boolean).join(' • ')}
                                                        </div>
                                                        {rx.instructions && (
                                                            <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: 'var(--space-1)' }}>
                                                                {rx.instructions}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {rx.dispensed ? (
                                                        <span className="badge badge-success">
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <polyline points="20 6 9 17 4 12"/>
                                                            </svg>
                                                            Dispensed
                                                        </span>
                                                    ) : (
                                                        <button
                                                            className="btn btn-sm btn-primary"
                                                            onClick={() => handleDispense(rx.id)}
                                                            disabled={dispensing === rx.id}
                                                        >
                                                            Dispense
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .stat-mini {
                    padding: var(--space-2) var(--space-3);
                    background: var(--gray-50);
                    border-radius: var(--radius-md);
                    border: 1px solid var(--gray-200);
                }
                .stat-mini-label {
                    display: block;
                    font-size: 0.625rem;
                    color: var(--gray-500);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .stat-mini-value {
                    font-size: 1rem;
                    font-weight: 600;
                    color: var(--gray-900);
                }
                .modal-lg {
                    max-width: 640px;
                }
            `}</style>
        </div>
    );
};

export default ClinicStaffDashboard;
