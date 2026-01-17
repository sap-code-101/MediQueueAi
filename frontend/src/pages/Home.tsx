import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
    return (
        <div className="home-page">
            {/* Navigation */}
            <nav className="home-nav">
                <div className="home-nav-content">
                    <Link to="/" className="home-logo">
                        <div className="home-logo-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                            </svg>
                        </div>
                        <div className="home-logo-text">
                            <span className="home-logo-name">MediQueue<span className="home-logo-ai">AI</span></span>
                            <span className="home-logo-tagline">Smart Hospital Queue Management</span>
                        </div>
                    </Link>
                    <div className="home-nav-links">
                        <Link to="/login" className="home-nav-link">Staff Login</Link>
                        <Link to="/patient" className="home-nav-btn">Book Appointment</Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="home-hero">
                <div className="home-hero-content">
                    <div className="home-hero-badge">
                        <span className="home-hero-badge-dot"></span>
                        <span>Real-Time Queue Tracking</span>
                    </div>
                    <h1 className="home-hero-title">
                        Smart Queue Management<br />
                        <span className="home-hero-title-accent">For Modern Healthcare</span>
                    </h1>
                    <p className="home-hero-desc">
                        Reduce patient wait times with AI-powered predictions, real-time updates, 
                        and seamless appointment management.
                    </p>
                    <div className="home-hero-actions">
                        <Link to="/patient" className="btn btn-primary btn-lg">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            Book Appointment
                        </Link>
                        <Link to="/login" className="btn btn-outline btn-lg">
                            Staff Portal
                        </Link>
                    </div>
                    <div className="home-hero-stats">
                        <div className="home-stat">
                            <div className="home-stat-value">60%</div>
                            <div className="home-stat-label">Reduced Wait Time</div>
                        </div>
                        <div className="home-stat">
                            <div className="home-stat-value">3x</div>
                            <div className="home-stat-label">Faster Check-in</div>
                        </div>
                        <div className="home-stat">
                            <div className="home-stat-value">95%</div>
                            <div className="home-stat-label">Patient Satisfaction</div>
                        </div>
                    </div>
                </div>
                <div className="home-hero-visual">
                    <div className="home-hero-card">
                        <div className="home-hero-card-header">
                            <span className="home-hero-card-dot green"></span>
                            <span className="home-hero-card-dot yellow"></span>
                            <span className="home-hero-card-dot red"></span>
                        </div>
                        <div className="home-hero-card-body">
                            <div className="home-hero-queue-item">
                                <div className="home-hero-queue-avatar">JD</div>
                                <div className="home-hero-queue-info">
                                    <div className="home-hero-queue-name">John Doe</div>
                                    <div className="home-hero-queue-time">Est. wait: 5 min</div>
                                </div>
                                <div className="home-hero-queue-badge">In Progress</div>
                            </div>
                            <div className="home-hero-queue-item">
                                <div className="home-hero-queue-avatar">SM</div>
                                <div className="home-hero-queue-info">
                                    <div className="home-hero-queue-name">Sarah Miller</div>
                                    <div className="home-hero-queue-time">Est. wait: 12 min</div>
                                </div>
                                <div className="home-hero-queue-badge waiting">Waiting</div>
                            </div>
                            <div className="home-hero-queue-item">
                                <div className="home-hero-queue-avatar">RJ</div>
                                <div className="home-hero-queue-info">
                                    <div className="home-hero-queue-name">Robert Johnson</div>
                                    <div className="home-hero-queue-time">Est. wait: 18 min</div>
                                </div>
                                <div className="home-hero-queue-badge waiting">Waiting</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="home-features">
                <div className="home-features-content">
                    <h2 className="home-section-title">Built for Every Role</h2>
                    <p className="home-section-desc">Streamlined workflows for patients, doctors, and staff</p>
                    <div className="home-features-grid">
                        <div className="home-feature-card">
                            <div className="home-feature-icon patients">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                    <circle cx="12" cy="7" r="4"/>
                                </svg>
                            </div>
                            <h3>Patients</h3>
                            <p>Book appointments online, track your queue position in real-time, and receive SMS notifications.</p>
                        </div>
                        <div className="home-feature-card">
                            <div className="home-feature-icon doctors">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                                </svg>
                            </div>
                            <h3>Doctors</h3>
                            <p>Manage consultations efficiently, view patient history, and transfer to lab or pharmacy queues.</p>
                        </div>
                        <div className="home-feature-card">
                            <div className="home-feature-icon reception">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                                    <line x1="8" y1="21" x2="16" y2="21"/>
                                    <line x1="12" y1="17" x2="12" y2="21"/>
                                </svg>
                            </div>
                            <h3>Reception</h3>
                            <p>Quick patient registration, appointment check-in, and real-time queue management.</p>
                        </div>
                        <div className="home-feature-card">
                            <div className="home-feature-icon admin">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="3"/>
                                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                                </svg>
                            </div>
                            <h3>Admin</h3>
                            <p>Full system oversight, analytics dashboard, doctor management, and reporting tools.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="home-cta">
                <div className="home-cta-content">
                    <h2>Ready to Optimize Your Hospital Queue?</h2>
                    <p>Start managing your patient flow with AI-powered insights today.</p>
                    <div className="home-cta-actions">
                        <Link to="/patient" className="btn btn-primary btn-lg">Get Started</Link>
                        <Link to="/login" className="btn btn-outline-white btn-lg">Staff Login</Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="home-footer">
                <p>© 2026 MediQueueAI. Smart Hospital Queue Management System.</p>
            </footer>
        </div>
    );
};

export default Home;
