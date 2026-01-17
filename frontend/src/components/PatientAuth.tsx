import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

interface PatientAuthProps {
    onLogin: (token: string, patientId: string, name: string) => void;
}

const PatientAuth: React.FC<PatientAuthProps> = ({ onLogin }) => {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Login form
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    // Register form - simplified
    const [registerData, setRegisterData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Please enter email and password');
            return;
        }
        
        setLoading(true);
        setError('');
        
        try {
            const res = await api.post('/patient/login', { email, password });
            localStorage.setItem('patientToken', res.data.token);
            localStorage.setItem('patientId', res.data.patientId);
            localStorage.setItem('patientName', res.data.name);
            onLogin(res.data.token, res.data.patientId, res.data.name);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation
        if (!registerData.name || !registerData.email || !registerData.password) {
            setError('Name, email, and password are required');
            return;
        }
        
        if (registerData.password !== registerData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        
        if (registerData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        
        setLoading(true);
        setError('');
        
        try {
            const res = await api.post('/patient/register', {
                name: registerData.name,
                email: registerData.email,
                phone: registerData.phone || '',
                password: registerData.password
            });
            
            localStorage.setItem('patientToken', res.data.token);
            localStorage.setItem('patientId', res.data.patientId);
            localStorage.setItem('patientName', res.data.name);
            onLogin(res.data.token, res.data.patientId, res.data.name);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '0.875rem 1rem',
        fontSize: '0.9375rem',
        border: '2px solid var(--gray-200)',
        borderRadius: 'var(--radius-lg)',
        outline: 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxSizing: 'border-box' as const,
        background: 'white'
    };

    const labelStyle = {
        display: 'block',
        fontSize: '0.875rem',
        fontWeight: 600,
        color: 'var(--gray-700)',
        marginBottom: '0.5rem'
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, var(--primary-50) 0%, var(--surface-secondary) 50%, var(--accent-50) 100%)',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'var(--font-sans)'
        }}>
            {/* Back to Home */}
            <div style={{ position: 'absolute', top: 'var(--space-4)', left: 'var(--space-4)', zIndex: 10 }}>
                <Link 
                    to="/" 
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        padding: 'var(--space-2) var(--space-4)',
                        background: 'white',
                        border: '1px solid var(--gray-200)',
                        borderRadius: 'var(--radius-lg)',
                        color: 'var(--gray-600)',
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        boxShadow: 'var(--shadow-sm)'
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                    Back to Home
                </Link>
            </div>

            {/* Main Content */}
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--space-8)'
            }}>
                <div style={{
                    width: '100%',
                    maxWidth: mode === 'register' ? '520px' : '420px'
                }}>
                    {/* Card */}
                    <div style={{
                        background: 'white',
                        borderRadius: 'var(--radius-2xl)',
                        padding: 'var(--space-8)',
                        boxShadow: 'var(--shadow-2xl)',
                        border: '1px solid var(--gray-200)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {/* Top gradient bar - SKY BLUE for Patient */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '5px',
                            background: 'linear-gradient(to right, #0ea5e9, #06b6d4, #14b8a6)'
                        }} />

                        {/* Badge */}
                        <div style={{
                            position: 'absolute',
                            top: '1.5rem',
                            right: '1.5rem',
                            padding: '0.375rem 0.75rem',
                            background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
                            borderRadius: '0.5rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: 'white',
                            letterSpacing: '0.025em'
                        }}>
                            PATIENT
                        </div>

                        {/* Logo & Header */}
                        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
                            <div style={{
                                width: '72px',
                                height: '72px',
                                background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
                                borderRadius: '1.25rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto var(--space-4)',
                                boxShadow: '0 8px 16px rgba(14, 165, 233, 0.4)',
                                border: '3px solid rgba(6, 182, 212, 0.2)'
                            }}>
                                <svg width="36" height="36" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                </svg>
                            </div>
                            
                            <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--gray-900)', marginBottom: 'var(--space-2)' }}>
                                {mode === 'login' ? 'Patient Portal' : 'Create Patient Account'}
                            </h1>
                            <p style={{ color: 'var(--gray-500)', fontSize: '0.9375rem' }}>
                                {mode === 'login' 
                                    ? 'Sign in to manage your appointments' 
                                    : 'Register to book appointments online'}
                            </p>
                        </div>

                        {/* Mode Toggle */}
                        <div style={{
                            display: 'flex',
                            background: 'var(--gray-100)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '4px',
                            marginBottom: 'var(--space-6)'
                        }}>
                            <button
                                type="button"
                                onClick={() => { setMode('login'); setError(''); }}
                                style={{
                                    flex: 1,
                                    padding: 'var(--space-3)',
                                    border: 'none',
                                    borderRadius: 'var(--radius-md)',
                                    background: mode === 'login' ? 'white' : 'transparent',
                                    color: mode === 'login' ? 'var(--primary-600)' : 'var(--gray-500)',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    boxShadow: mode === 'login' ? 'var(--shadow-sm)' : 'none',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Sign In
                            </button>
                            <button
                                type="button"
                                onClick={() => { setMode('register'); setError(''); }}
                                style={{
                                    flex: 1,
                                    padding: 'var(--space-3)',
                                    border: 'none',
                                    borderRadius: 'var(--radius-md)',
                                    background: mode === 'register' ? 'white' : 'transparent',
                                    color: mode === 'register' ? 'var(--primary-600)' : 'var(--gray-500)',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    boxShadow: mode === 'register' ? 'var(--shadow-sm)' : 'none',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Register
                            </button>
                        </div>

                        {/* Error/Success Messages */}
                        {error && (
                            <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="15" y1="9" x2="9" y2="15" />
                                    <line x1="9" y1="9" x2="15" y2="15" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        {success && (
                            <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                                <span>{success}</span>
                            </div>
                        )}

                        {/* Login Form */}
                        {mode === 'login' && (
                            <form onSubmit={handleLogin}>
                                <div style={{ marginBottom: 'var(--space-4)' }}>
                                    <label style={labelStyle}>Email Address</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        style={inputStyle}
                                    />
                                </div>

                                <div style={{ marginBottom: 'var(--space-6)' }}>
                                    <label style={labelStyle}>Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Enter your password"
                                            style={{ ...inputStyle, paddingRight: '3rem' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            style={{
                                                position: 'absolute',
                                                right: '0.75rem',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: 'var(--gray-500)'
                                            }}
                                        >
                                            {showPassword ? '🙈' : '👁️'}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        width: '100%',
                                        padding: 'var(--space-4)',
                                        fontSize: '1rem',
                                        fontWeight: 600,
                                        color: 'white',
                                        background: loading ? 'var(--gray-400)' : 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
                                        border: 'none',
                                        borderRadius: 'var(--radius-lg)',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s',
                                        boxShadow: loading ? 'none' : '0 8px 16px rgba(14, 165, 233, 0.4)'
                                    }}
                                >
                                    {loading ? 'Signing in...' : 'Sign In as Patient'}
                                </button>
                            </form>
                        )}

                        {/* Register Form - Simplified */}
                        {mode === 'register' && (
                            <form onSubmit={handleRegister}>
                                <div style={{ marginBottom: 'var(--space-4)' }}>
                                    <label style={labelStyle}>Full Name *</label>
                                    <input
                                        type="text"
                                        value={registerData.name}
                                        onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                                        placeholder="John Doe"
                                        style={inputStyle}
                                        required
                                    />
                                </div>

                                <div style={{ marginBottom: 'var(--space-4)' }}>
                                    <label style={labelStyle}>Email Address *</label>
                                    <input
                                        type="email"
                                        value={registerData.email}
                                        onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                                        placeholder="you@example.com"
                                        style={inputStyle}
                                        required
                                    />
                                </div>

                                <div style={{ marginBottom: 'var(--space-4)' }}>
                                    <label style={labelStyle}>Phone Number (Optional)</label>
                                    <input
                                        type="tel"
                                        value={registerData.phone}
                                        onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                                        placeholder="+1 234 567 890"
                                        style={inputStyle}
                                    />
                                </div>

                                <div style={{ marginBottom: 'var(--space-4)' }}>
                                    <label style={labelStyle}>Password *</label>
                                    <input
                                        type="password"
                                        value={registerData.password}
                                        onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                                        placeholder="Min 6 characters"
                                        style={inputStyle}
                                        required
                                        minLength={6}
                                    />
                                </div>

                                <div style={{ marginBottom: 'var(--space-6)' }}>
                                    <label style={labelStyle}>Confirm Password *</label>
                                    <input
                                        type="password"
                                        value={registerData.confirmPassword}
                                        onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                                        placeholder="Repeat password"
                                        style={inputStyle}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        width: '100%',
                                        padding: 'var(--space-4)',
                                        fontSize: '1rem',
                                        fontWeight: 600,
                                        color: 'white',
                                        background: loading ? 'var(--gray-400)' : 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
                                        border: 'none',
                                        borderRadius: 'var(--radius-lg)',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s',
                                        boxShadow: loading ? 'none' : '0 8px 16px rgba(14, 165, 233, 0.4)'
                                    }}
                                >
                                    {loading ? 'Creating Account...' : 'Create Patient Account'}
                                </button>
                            </form>
                        )}

                        {/* Staff Login Link */}
                        <div style={{
                            marginTop: 'var(--space-6)',
                            paddingTop: 'var(--space-4)',
                            borderTop: '1px solid var(--gray-200)',
                            textAlign: 'center'
                        }}>
                            <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>
                                Are you a staff member?{' '}
                                <Link to="/login" style={{ color: 'var(--primary-600)', fontWeight: 600 }}>
                                    Staff Login
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientAuth;
