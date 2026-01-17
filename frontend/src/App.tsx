import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import Login from './components/Login';
import PatientAuth from './components/PatientAuth';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientPortal from './pages/PatientPortal';
import PatientDashboard from './pages/PatientDashboard';
import ReceptionistPortal from './pages/ReceptionistPortal';
import AdminPanel from './pages/AdminPanel';
import ClinicStaffDashboard from './pages/ClinicStaffDashboard';
import Home from './pages/Home';
import api from './utils/api';

const socket = io('/');

// Navigation component for authenticated users
const Navigation: React.FC<{ role: string | null; onLogout: () => void }> = ({ role, onLogout }) => {
    const location = useLocation();
    const displayName = localStorage.getItem('displayName') || role || 'User';

    return (
        <nav className="navbar">
            <div className="container navbar-content">
                <Link to="/" className="navbar-brand">
                    <div className="navbar-brand-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                        </svg>
                    </div>
                    MediQueue<span style={{background: 'linear-gradient(to right, #8b5cf6, #d946ef)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>AI</span>
                </Link>

                <div className="navbar-menu">
                    {role === 'doctor' && (
                        <Link to="/doctor" className={`navbar-link ${location.pathname === '/doctor' ? 'active' : ''}`}>
                            Dashboard
                        </Link>
                    )}
                    {role === 'receptionist' && (
                        <Link to="/receptionist" className={`navbar-link ${location.pathname === '/receptionist' ? 'active' : ''}`}>
                            Reception
                        </Link>
                    )}
                    {role === 'admin' && (
                        <>
                            <Link to="/admin" className={`navbar-link ${location.pathname === '/admin' ? 'active' : ''}`}>
                                Admin Panel
                            </Link>
                        </>
                    )}
                    {role === 'clinic_staff' && (
                        <Link to="/clinic-staff" className={`navbar-link ${location.pathname === '/clinic-staff' ? 'active' : ''}`}>
                            Clinic Staff
                        </Link>
                    )}
                </div>

                <div className="navbar-user">
                    <div className="navbar-avatar">
                        {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="hide-mobile">
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--gray-900)' }}>
                            {displayName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textTransform: 'capitalize' }}>
                            {role}
                        </div>
                    </div>
                    <button onClick={onLogout} className="btn btn-ghost btn-sm">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        <span className="hide-mobile">Logout</span>
                    </button>
                </div>
            </div>
        </nav>
    );
};

function App() {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [role, setRole] = useState(localStorage.getItem('role'));
    const [doctorId, setDoctorId] = useState(localStorage.getItem('doctorId'));
    
    // Patient auth state
    const [patientToken, setPatientToken] = useState(localStorage.getItem('patientToken'));
    const [patientId, setPatientId] = useState(localStorage.getItem('patientId'));
    const [patientName, setPatientName] = useState(localStorage.getItem('patientName'));

    useEffect(() => {
        if (token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            if (doctorId) {
                socket.emit('join-room', doctorId);
            }
        }
        // Add dashboard-view class to body when authenticated
        if (token || patientToken) {
            document.body.classList.add('dashboard-view');
        } else {
            document.body.classList.remove('dashboard-view');
        }
    }, [token, doctorId, patientToken]);

    const handleLogin = (newToken: string, newRole: string, newDoctorId?: string, displayName?: string) => {
        setToken(newToken);
        setRole(newRole);
        setDoctorId(newDoctorId || null);
        localStorage.setItem('token', newToken);
        localStorage.setItem('role', newRole);
        if (newDoctorId) localStorage.setItem('doctorId', newDoctorId);
        if (displayName) localStorage.setItem('displayName', displayName);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        if (newDoctorId) {
            socket.emit('join-room', newDoctorId);
        }
    };

    const handleLogout = () => {
        setToken(null);
        setRole(null);
        setDoctorId(null);
        setPatientToken(null);
        setPatientId(null);
        setPatientName(null);
        localStorage.clear();
        delete api.defaults.headers.common['Authorization'];
    };
    
    const handlePatientLogin = (newToken: string, newPatientId: string, name: string) => {
        setPatientToken(newToken);
        setPatientId(newPatientId);
        setPatientName(name);
        localStorage.setItem('patientToken', newToken);
        localStorage.setItem('patientId', newPatientId);
        localStorage.setItem('patientName', name);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    };

    // Get default route based on role
    const getDefaultRoute = () => {
        switch (role) {
            case 'doctor': return '/doctor';
            case 'admin': return '/admin';
            case 'receptionist': return '/receptionist';
            case 'clinic_staff': return '/clinic-staff';
            default: return '/';
        }
    };

    return (
        <Router>
            <div className="page-wrapper">
                <Routes>
                    {/* Landing page */}
                    <Route path="/" element={<Home />} />
                    
                    {/* Patient login/register */}
                    <Route path="/patient/login" element={
                        patientToken ? <Navigate to="/patient/dashboard" /> : <PatientAuth onLogin={handlePatientLogin} />
                    } />
                    
                    {/* Patient booking - public access */}
                    <Route path="/patient/book" element={
                        patientToken ? (
                            <PatientPortal 
                                isAuthenticated={true}
                                patientId={patientId!}
                                patientName={patientName!}
                                onLogout={handleLogout}
                            />
                        ) : <PatientPortal />
                    } />
                    
                    {/* Patient dashboard - requires patient auth */}
                    <Route path="/patient/dashboard" element={
                        patientToken ? (
                            <PatientDashboard 
                                patientId={patientId!} 
                                patientName={patientName!} 
                                onLogout={handleLogout} 
                            />
                        ) : <Navigate to="/patient/login" />
                    } />
                    
                    {/* Redirect /patient to booking */}
                    <Route path="/patient" element={<Navigate to="/patient/book" />} />
                    
                    {/* Staff login page */}
                    <Route path="/login" element={
                        token ? <Navigate to={getDefaultRoute()} /> : <Login onLogin={handleLogin} />
                    } />
                    
                    {/* Protected routes */}
                    <Route path="/doctor" element={
                        token && role === 'doctor' ? (
                            <>
                                <Navigation role={role} onLogout={handleLogout} />
                                <main className="main-content">
                                    <DoctorDashboard socket={socket} />
                                </main>
                            </>
                        ) : <Navigate to="/login" />
                    } />
                    
                    <Route path="/receptionist" element={
                        token && role === 'receptionist' ? (
                            <>
                                <Navigation role={role} onLogout={handleLogout} />
                                <main className="main-content">
                                    <ReceptionistPortal />
                                </main>
                            </>
                        ) : <Navigate to="/login" />
                    } />
                    
                    <Route path="/admin" element={
                        token && role === 'admin' ? (
                            <>
                                <Navigation role={role} onLogout={handleLogout} />
                                <main className="main-content">
                                    <AdminPanel />
                                </main>
                            </>
                        ) : <Navigate to="/login" />
                    } />
                    
                    <Route path="/clinic-staff" element={
                        token && role === 'clinic_staff' ? (
                            <>
                                <Navigation role={role} onLogout={handleLogout} />
                                <main className="main-content">
                                    <ClinicStaffDashboard />
                                </main>
                            </>
                        ) : <Navigate to="/login" />
                    } />
                    
                    {/* Catch all - redirect to home */}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;