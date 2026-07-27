import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Droplet, User, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="glass-panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, padding: '12px 24px', sticky: 'top', zIndex: 100 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(14,165,233,0.4)' }}>
            <Droplet size={24} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              AquaTrack <span style={{ fontSize: '0.65rem', background: 'rgba(14, 165, 233, 0.2)', color: '#38bdf8', padding: '2px 8px', borderRadius: 12, border: '1px solid rgba(14, 165, 233, 0.3)' }}>AI OCR METER</span>
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Water Meter Management System</p>
          </div>
        </div>

        {/* User Info & Actions */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>{user.name}</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, alignItems: 'center' }}>
                <span className={`badge ${user.role === 'owner' ? 'badge-owner' : 'badge-user'}`}>
                  {user.role === 'owner' ? 'Property Owner' : 'Tenant / User'}
                </span>
              </div>
            </div>
            <button onClick={logout} className="btn btn-secondary btn-sm" title="Log out">
              <LogOut size={16} />
              <span>Exit</span>
            </button>
          </div>
        ) : null}

      </div>
    </header>
  );
}
