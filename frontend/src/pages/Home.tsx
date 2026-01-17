import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
    return (
        <div className="landing-page">
            {/* Navigation */}
            <nav className="landing-nav">
                <div className="landing-container">
                    <div className="landing-nav-content">
                        <Link to="/" className="landing-logo">
                            <div className="landing-logo-icon">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                </svg>
                            </div>
                            <span className="landing-logo-text">
                                MediQueue<span className="landing-logo-ai">AI</span>
                            </span>
                        </Link>
                        <div className="landing-nav-links">
                            <a href="#features" className="landing-nav-link">Features</a>
                            <a href="#how-it-works" className="landing-nav-link">How It Works</a>
                            <Link to="/login" className="landing-nav-link staff-link">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                                    <circle cx="9" cy="7" r="4"/>
                                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                                </svg>
                                Staff Portal
                            </Link>
                            <Link to="/patient/login" className="landing-btn-nav">
                                Patient Login
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 12h14M12 5l7 7-7 7"/>
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="landing-hero">
                <div className="landing-hero-bg">
                    <div className="landing-hero-gradient"></div>
                    <div className="landing-hero-pattern"></div>
                </div>
                <div className="landing-container">
                    <div className="landing-hero-grid">
                        <div className="landing-hero-content">
                            <div className="landing-hero-badge">
                                <span className="landing-badge-icon">🏥</span>
                                Trusted by 500+ Healthcare Facilities
                            </div>
                            <h1 className="landing-hero-title">
                                Smart Hospital
                                <span className="landing-title-gradient"> Queue Management</span>
                            </h1>
                            <p className="landing-hero-subtitle">
                                Reduce patient wait times by up to 60% with AI-powered predictions, 
                                real-time queue tracking, and seamless appointment management.
                            </p>
                            <div className="landing-hero-cta">
                                <Link to="/patient/login" className="landing-btn-primary">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                        <circle cx="12" cy="7" r="4"/>
                                    </svg>
                                    Patient Login / Register
                                </Link>
                                <Link to="/login" className="landing-btn-secondary">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                    </svg>
                                    Staff Portal
                                </Link>
                            </div>
                            <div className="landing-hero-stats">
                                <div className="landing-stat">
                                    <div className="landing-stat-number">60%</div>
                                    <div className="landing-stat-label">Reduced Wait</div>
                                </div>
                                <div className="landing-stat-divider"></div>
                                <div className="landing-stat">
                                    <div className="landing-stat-number">50K+</div>
                                    <div className="landing-stat-label">Patients Served</div>
                                </div>
                                <div className="landing-stat-divider"></div>
                                <div className="landing-stat">
                                    <div className="landing-stat-number">98%</div>
                                    <div className="landing-stat-label">Satisfaction</div>
                                </div>
                            </div>
                        </div>
                        <div className="landing-hero-visual">
                            <div className="landing-mockup">
                                <div className="landing-mockup-header">
                                    <div className="landing-mockup-dots">
                                        <span></span><span></span><span></span>
                                    </div>
                                    <span className="landing-mockup-title">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                        </svg>
                                        Live Queue
                                    </span>
                                </div>
                                <div className="landing-mockup-body">
                                    <div className="landing-queue-item active">
                                        <div className="landing-queue-avatar">JD</div>
                                        <div className="landing-queue-info">
                                            <div className="landing-queue-name">John Doe</div>
                                            <div className="landing-queue-detail">Dr. Smith • General</div>
                                        </div>
                                        <div className="landing-queue-badge success">
                                            <span className="pulse-dot"></span>In Progress
                                        </div>
                                    </div>
                                    <div className="landing-queue-item">
                                        <div className="landing-queue-avatar">SM</div>
                                        <div className="landing-queue-info">
                                            <div className="landing-queue-name">Sarah Miller</div>
                                            <div className="landing-queue-detail">Est. wait: 8 min</div>
                                        </div>
                                        <div className="landing-queue-badge warning">Next</div>
                                    </div>
                                    <div className="landing-queue-item">
                                        <div className="landing-queue-avatar">RJ</div>
                                        <div className="landing-queue-info">
                                            <div className="landing-queue-name">Robert Johnson</div>
                                            <div className="landing-queue-detail">Est. wait: 15 min</div>
                                        </div>
                                        <div className="landing-queue-badge neutral">Waiting</div>
                                    </div>
                                </div>
                            </div>
                            <div className="landing-mockup-float">
                                <div className="landing-float-card">
                                    <div className="landing-float-icon">⚡</div>
                                    <div className="landing-float-text">
                                        <span className="landing-float-title">AI Predicted</span>
                                        <span className="landing-float-value">~12 min wait</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="landing-features">
                <div className="landing-container">
                    <div className="landing-section-header">
                        <span className="landing-section-badge">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                            Features
                        </span>
                        <h2 className="landing-section-title">Everything You Need for Better Healthcare</h2>
                        <p className="landing-section-subtitle">
                            Comprehensive tools designed for patients, doctors, and hospital staff
                        </p>
                    </div>
                    <div className="landing-features-grid">
                        <div className="landing-feature-card">
                            <div className="landing-feature-icon blue">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                    <line x1="16" y1="2" x2="16" y2="6"/>
                                    <line x1="8" y1="2" x2="8" y2="6"/>
                                    <line x1="3" y1="10" x2="21" y2="10"/>
                                </svg>
                            </div>
                            <h3>Online Booking</h3>
                            <p>Book appointments 24/7 from any device with real-time slot availability.</p>
                        </div>
                        <div className="landing-feature-card">
                            <div className="landing-feature-icon teal">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <polyline points="12 6 12 12 16 14"/>
                                </svg>
                            </div>
                            <h3>AI Wait Prediction</h3>
                            <p>Machine learning predicts accurate wait times so you arrive at the right moment.</p>
                        </div>
                        <div className="landing-feature-card">
                            <div className="landing-feature-icon purple">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                                </svg>
                            </div>
                            <h3>Real-Time Tracking</h3>
                            <p>Live updates on queue status and estimated wait time for complete transparency.</p>
                        </div>
                        <div className="landing-feature-card">
                            <div className="landing-feature-icon green">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                    <circle cx="9" cy="7" r="4"/>
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                                </svg>
                            </div>
                            <h3>Multi-Queue System</h3>
                            <p>Manage consultations, lab tests, and pharmacy in separate organized queues.</p>
                        </div>
                        <div className="landing-feature-card">
                            <div className="landing-feature-icon orange">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                    <polyline points="14 2 14 8 20 8"/>
                                    <line x1="16" y1="13" x2="8" y2="13"/>
                                    <line x1="16" y1="17" x2="8" y2="17"/>
                                </svg>
                            </div>
                            <h3>Medical Records</h3>
                            <p>Access prescriptions and reports from your secure patient portal.</p>
                        </div>
                        <div className="landing-feature-card">
                            <div className="landing-feature-icon pink">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                                </svg>
                            </div>
                            <h3>SMS Notifications</h3>
                            <p>Get alerts for appointments, queue updates, and when it's your turn.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="landing-how">
                <div className="landing-container">
                    <div className="landing-section-header">
                        <span className="landing-section-badge teal">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12 6 12 12 16 14"/>
                            </svg>
                            How It Works
                        </span>
                        <h2 className="landing-section-title">Simple Steps to Better Healthcare</h2>
                    </div>
                    <div className="landing-steps">
                        <div className="landing-step">
                            <div className="landing-step-number">1</div>
                            <div className="landing-step-content">
                                <h3>Create Account</h3>
                                <p>Sign up with your name, email, and password in under a minute.</p>
                            </div>
                        </div>
                        <div className="landing-step-connector"></div>
                        <div className="landing-step">
                            <div className="landing-step-number">2</div>
                            <div className="landing-step-content">
                                <h3>Book Appointment</h3>
                                <p>Choose your doctor and select a convenient time slot.</p>
                            </div>
                        </div>
                        <div className="landing-step-connector"></div>
                        <div className="landing-step">
                            <div className="landing-step-number">3</div>
                            <div className="landing-step-content">
                                <h3>Check In</h3>
                                <p>Use your confirmation code to check in when you arrive.</p>
                            </div>
                        </div>
                        <div className="landing-step-connector"></div>
                        <div className="landing-step">
                            <div className="landing-step-number">4</div>
                            <div className="landing-step-content">
                                <h3>Skip the Wait</h3>
                                <p>Track your position and get notified when it's your turn.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="landing-cta">
                <div className="landing-container">
                    <div className="landing-cta-card">
                        <div className="landing-cta-content">
                            <h2>Ready to Transform Your Hospital Experience?</h2>
                            <p>Join thousands of patients and healthcare providers using MediQueueAI.</p>
                            <div className="landing-cta-buttons">
                                <Link to="/patient/login" className="landing-btn-white">
                                    Get Started Free
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M5 12h14M12 5l7 7-7 7"/>
                                    </svg>
                                </Link>
                                <Link to="/login" className="landing-btn-outline-white">
                                    Staff Portal
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="landing-container">
                    <div className="landing-footer-content">
                        <div className="landing-footer-brand">
                            <Link to="/" className="landing-logo">
                                <div className="landing-logo-icon light">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                    </svg>
                                </div>
                                <span className="landing-logo-text light">
                                    MediQueue<span className="landing-logo-ai">AI</span>
                                </span>
                            </Link>
                            <p>Smart Hospital Queue Management powered by AI. Making healthcare more efficient and patient-friendly.</p>
                        </div>
                        <div className="landing-footer-links">
                            <div className="landing-footer-group">
                                <h4>Product</h4>
                                <a href="#features">Features</a>
                                <a href="#how-it-works">How It Works</a>
                            </div>
                            <div className="landing-footer-group">
                                <h4>Access</h4>
                                <Link to="/patient/login">Patient Portal</Link>
                                <Link to="/login">Staff Login</Link>
                            </div>
                        </div>
                    </div>
                    <div className="landing-footer-bottom">
                        <p>© 2026 MediQueueAI. All rights reserved.</p>
                        <div className="landing-footer-social">
                            <a href="#" aria-label="Twitter">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                </svg>
                            </a>
                            <a href="#" aria-label="LinkedIn">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
