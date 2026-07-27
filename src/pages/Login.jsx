import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Droplet, Lock, Mail, User, ShieldCheck } from 'lucide-react';

export default function Login() {
  const { login, register } = useAuth();
  
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegisterMode) {
        await register(name, email, password, role);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ maxWidth: 480, width: '100%' }}>
        
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 54, height: 54, borderRadius: 16, background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', boxShadow: '0 0 30px rgba(14,165,233,0.4)' }}>
            <Droplet size={30} color="#fff" />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.1 }}>AquaTrack</h1>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: 6 }}>
            Multi-Meter Management & AI OCR Water Reading System
          </p>
        </div>

        {/* Login / Register Card */}
        <div className="glass-panel" style={{ padding: 32 }}>
          <h2 style={{ fontSize: '1.35rem', color: '#fff', marginBottom: 6 }}>
            {isRegisterMode ? 'Create New Account' : 'Sign In to AquaTrack'}
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 20 }}>
            {isRegisterMode ? 'Register as Property Owner or Tenant' : 'Enter your email and password to sign in'}
          </p>

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: 10, borderRadius: 8, fontSize: '0.85rem', marginBottom: 16 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {isRegisterMode && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="John Doe" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required 
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="user@example.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
              />
            </div>

            {isRegisterMode && (
              <div className="form-group">
                <label className="form-label">Account Role</label>
                <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
                  <option value="user">User / Tenant (Submits readings for assigned property)</option>
                  <option value="owner">Property Owner (Creates properties, adds 1-N meters, assigns users)</option>
                </select>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: 10, fontSize: '0.95rem' }}>
              <span>{isRegisterMode ? 'Register Account' : 'Sign In'}</span>
            </button>
          </form>

          <div style={{ marginTop: 20, textAlign: 'center', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            {isRegisterMode ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => { setIsRegisterMode(!isRegisterMode); setError(''); }}
              style={{ background: 'none', border: 'none', color: '#38bdf8', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
            >
              {isRegisterMode ? 'Sign In' : 'Register now'}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
