import React from 'react';
import { LayoutDashboard, Building2, Camera, BarChart3, Users, PlusCircle, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab, onOpenUploadModal, onOpenAddPropModal, onOpenBatchModal }) {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'properties', label: isOwner ? 'Properties & Meters' : 'My Properties', icon: Building2 },
    { id: 'analytics', label: 'Water Usage Reports', icon: BarChart3 },
  ];

  return (
    <aside style={{ width: 250, flexShrink: 0, padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      {/* Quick Action Buttons */}
      <button 
        onClick={onOpenUploadModal} 
        className="btn btn-primary" 
        style={{ width: '100%', padding: '12px', fontSize: '0.95rem', boxShadow: '0 4px 20px rgba(14,165,233,0.3)' }}
      >
        <Camera size={18} />
        <span>Scan Single Photo</span>
      </button>

      <button 
        onClick={onOpenBatchModal} 
        className="btn btn-teal" 
        style={{ width: '100%', padding: '10px', fontSize: '0.88rem' }}
      >
        <Layers size={16} />
        <span>Bunch Upload All (1 to N)</span>
      </button>

      {isOwner && (
        <button 
          onClick={onOpenAddPropModal} 
          className="btn btn-secondary" 
          style={{ width: '100%', padding: '10px', fontSize: '0.88rem' }}
        >
          <PlusCircle size={16} />
          <span>Add New Property</span>
        </button>
      )}

      {/* Navigation Links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', paddingLeft: 12, marginBottom: 4 }}>
          Menu
        </div>
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`btn ${isActive ? 'btn-teal' : 'btn-secondary'}`}
              style={{
                justifyContent: 'flex-start',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: isActive ? 'linear-gradient(135deg, #0ea5e9, #0284c7)' : 'transparent',
                borderColor: isActive ? 'transparent' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-muted)'
              }}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

    </aside>
  );
}
