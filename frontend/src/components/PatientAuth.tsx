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
    
    // Register form
    const [registerData, setRegisterData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        age: '',
        gender: '',
        address: '',
        bloodGroup: '',
        emergencyContact: ''
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
        if (!registerData.name || !registerData.email || !registerData.phone || !registerData.password) {
            setError('Name, email, phone, and password are required');
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
                phone: registerData.phone,
                password: registerData.password,
                age: registerData.age ? parseInt(registerData.age) : undefined,
                gender: registerData.gender || undefined,
                address: registerData.address || undefined,
                bloodGroup: registerData.bloodGroup || undefined,
                emergencyContact: registerData.emergencyContact || undefined
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
                        {/* Top gradient bar */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '4px',
                            background: 'linear-gradient(to right, var(--primary-500), var(--accent-500))'
                        }} />

                        {/* Logo & Header */}
                        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
                                borderRadius: 'var(--radius-xl)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto var(--space-4)',
                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                            }}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </div>
                            
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--gray-900)', marginBottom: 'var(--space-2)' }}>
                                {mode === 'login' ? 'Patient Portal' : 'Create Account'}
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
                                    className="btn btn-primary"
                                    style={{ width: '100%', padding: 'var(--space-4)', fontSize: '1rem' }}
                                >
                                    {loading ? 'Signing in...' : 'Sign In'}
                                </button>
                            </form>
                        )}

                        {/* Register Form */}
                        {mode === 'register' && (
                            <form onSubmit={handleRegister}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                    <div style={{ gridColumn: '1 / -1' }}>
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

                                    <div style={{ gridColumn: '1 / -1' }}>
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

                                    <div>
                                        <label style={labelStyle}>Phone Number *</label>
                                        <input
                                            type="tel"
                                            value={registerData.phone}
                                            onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                                            placeholder="+1 234 567 890"
                                            style={inputStyle}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label style={labelStyle}>Age</label>
                                        <input
                                            type="number"
                                            value={registerData.age}
                                            onChange={(e) => setRegisterData({...registerData, age: e.target.value})}
                                            placeholder="25"
                                            style={inputStyle}
                                            min="1"
                                            max="120"
                                        />
                                    </div>

                                    <div>
                                        <label style={labelStyle}>Gender</label>
                                        <select
                                            value={registerData.gender}
                                            onChange={(e) => setRegisterData({...registerData, gender: e.target.value})}
                                            style={inputStyle}
                                        >
                                            <option value="">Select</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={labelStyle}>Blood Group</label>
                                        <select
                                            value={registerData.bloodGroup}
                                            onChange={(e) => setRegisterData({...registerData, bloodGroup: e.target.value})}
                                            style={inputStyle}
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
                                    </div>

                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={labelStyle}>Address</label>
                                        <input
                                            type="text"
                                            value={registerData.address}
                                            onChange={(e) => setRegisterData({...registerData, address: e.target.value})}
                                            placeholder="123 Main St, City"
                                            style={inputStyle}
                                        />
                                    </div>

                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={labelStyle}>Emergency Contact</label>
                                        <input
                                            type="tel"
                                            value={registerData.emergencyContact}
                                            onChange={(e) => setRegisterData({...registerData, emergencyContact: e.target.value})}
                                            placeholder="+1 234 567 890"
                                            style={inputStyle}
                                        />
                                    </div>

                                    <div>
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

                                    <div>
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
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn btn-primary"
                                    style={{ width: '100%', padding: 'var(--space-4)', fontSize: '1rem', marginTop: 'var(--space-6)' }}
                                >
                                    {loading ? 'Creating Account...' : 'Create Account'}
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
