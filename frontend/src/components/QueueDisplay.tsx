import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface QueueItem {
    id?: string;
    name: string;
    waitTime: number;
    stage?: string;
    position?: number;
    estimated_start?: string;
}

interface QueueDisplayProps {
    doctorId: string;
    compact?: boolean;
}

const QueueDisplay: React.FC<QueueDisplayProps> = ({ doctorId, compact = false }) => {
    const [queueStatus, setQueueStatus] = useState<QueueItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchQueueStatus = async () => {
            try {
                const response = await axios.get(`/api/queue/status/${doctorId}`);
                setQueueStatus(response.data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchQueueStatus();
        
        // Refresh every 30 seconds
        const interval = setInterval(fetchQueueStatus, 30000);
        return () => clearInterval(interval);
    }, [doctorId]);

    const getWaitTimeColor = (waitTime: number) => {
        if (waitTime <= 10) return 'var(--success-500)';
        if (waitTime <= 20) return 'var(--warning-500)';
        return 'var(--error-500)';
    };

    const getStageIcon = (stage?: string) => {
        switch (stage) {
            case 'registration':
                return (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                    </svg>
                );
            case 'triage':
                return (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                );
            case 'consultation':
                return (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                );
            default:
                return (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                    </svg>
                );
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center" style={{ padding: 'var(--space-8)' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-error">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span>Failed to load queue: {error}</span>
            </div>
        );
    }

    if (queueStatus.length === 0) {
        return (
            <div className="empty-state" style={{ padding: compact ? 'var(--space-6)' : 'var(--space-10)' }}>
                <div className="empty-state-icon" style={{ width: '48px', height: '48px' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <line x1="19" y1="8" x2="19" y2="14" />
                        <line x1="22" y1="11" x2="16" y2="11" />
                    </svg>
                </div>
                <h4 className="empty-state-title">No patients in queue</h4>
                {!compact && (
                    <p className="empty-state-description">
                        The queue will update automatically when patients are added.
                    </p>
                )}
            </div>
        );
    }

    if (compact) {
        return (
            <div className="queue-compact">
                {queueStatus.slice(0, 5).map((patient, index) => (
                    <div 
                        key={patient.id || index} 
                        className="queue-compact-item flex items-center justify-between"
                        style={{
                            padding: 'var(--space-3) var(--space-4)',
                            borderBottom: index < queueStatus.length - 1 ? '1px solid var(--gray-100)' : 'none'
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <span style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: 'var(--radius-full)',
                                background: 'var(--primary-100)',
                                color: 'var(--primary-600)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 600
                            }}>
                                {index + 1}
                            </span>
                            <span className="font-medium text-sm">{patient.name}</span>
                        </div>
                        <span className="text-sm" style={{ color: getWaitTimeColor(patient.waitTime) }}>
                            {patient.waitTime} min
                        </span>
                    </div>
                ))}
                {queueStatus.length > 5 && (
                    <div className="text-center text-sm text-muted" style={{ padding: 'var(--space-3)' }}>
                        +{queueStatus.length - 5} more in queue
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="queue-display">
            <div className="queue-header flex items-center justify-between" style={{ marginBottom: 'var(--space-4)' }}>
                <h3 style={{ marginBottom: 0 }}>Current Queue</h3>
                <span className="badge" style={{
                    background: 'var(--primary-100)',
                    color: 'var(--primary-700)',
                    padding: 'var(--space-1) var(--space-3)',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    fontWeight: 600
                }}>
                    {queueStatus.length} patient{queueStatus.length !== 1 ? 's' : ''}
                </span>
            </div>

            <div className="queue-list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {queueStatus.map((patient, index) => (
                    <div 
                        key={patient.id || index} 
                        className="queue-card slide-up"
                        style={{ 
                            animationDelay: `${index * 50}ms`,
                            background: 'white',
                            border: '1px solid var(--gray-200)',
                            borderRadius: 'var(--radius-lg)',
                            padding: 'var(--space-4)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-4)'
                        }}
                    >
                        {/* Position indicator */}
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: 'var(--radius-full)',
                            background: index === 0 ? 'var(--primary-500)' : 'var(--gray-100)',
                            color: index === 0 ? 'white' : 'var(--gray-600)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '1rem',
                            flexShrink: 0
                        }}>
                            {index + 1}
                        </div>

                        {/* Patient info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="font-semibold" style={{ marginBottom: '2px' }}>
                                {patient.name}
                            </div>
                            {patient.stage && (
                                <div className="flex items-center gap-2 text-sm text-muted">
                                    {getStageIcon(patient.stage)}
                                    <span style={{ textTransform: 'capitalize' }}>{patient.stage}</span>
                                </div>
                            )}
                        </div>

                        {/* Wait time */}
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ 
                                fontSize: '1.25rem', 
                                fontWeight: 700, 
                                color: getWaitTimeColor(patient.waitTime),
                                lineHeight: 1
                            }}>
                                {patient.waitTime}
                            </div>
                            <div className="text-xs text-muted">min wait</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Average wait time summary */}
            {queueStatus.length > 0 && (
                <div style={{
                    marginTop: 'var(--space-4)',
                    padding: 'var(--space-3) var(--space-4)',
                    background: 'var(--gray-50)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <span className="text-sm text-muted">Average wait time</span>
                    <span className="font-semibold">
                        {Math.round(queueStatus.reduce((acc, p) => acc + p.waitTime, 0) / queueStatus.length)} min
                    </span>
                </div>
            )}
        </div>
    );
};

export default QueueDisplay;