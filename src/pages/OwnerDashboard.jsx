import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, Users, Gauge, Droplet, Plus, Camera, ArrowUpRight, CheckCircle2, UserPlus, Trash2, X, Layers, Edit3, Tag, Mail } from 'lucide-react';
import UsageChart from '../components/UsageChart';
import ReadingHistoryTable from '../components/ReadingHistoryTable';
import AddMeterModal from '../components/AddMeterModal';
import EditMeterModal from '../components/EditMeterModal';

export default function OwnerDashboard({ onOpenUploadModal, onOpenAddPropModal, onOpenBatchModal }) {
  const { user } = useAuth();
  
  const [properties, setProperties] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  // Active modal & input states
  const [activePropForMeter, setActivePropForMeter] = useState(null);
  const [editingMeter, setEditingMeter] = useState(null);
  const [assigningPropId, setAssigningPropId] = useState(null);
  const [tenantEmailInput, setTenantEmailInput] = useState('');

  const loadData = () => {
    if (!user) return;

    fetch('/api/properties', {
      headers: { 'x-user-id': user.id, 'x-user-role': user.role }
    })
      .then(res => res.json())
      .then(async data => {
        // Fetch meters per property
        const propsWithMeters = await Promise.all(data.map(async p => {
          const res = await fetch(`/api/meters/property/${p.id}`);
          const metersList = await res.json();
          return { ...p, metersList };
        }));
        setProperties(propsWithMeters);
      })
      .catch(console.error);

    fetch('/api/readings/analytics', {
      headers: { 'x-user-id': user.id, 'x-user-role': user.role }
    })
      .then(res => res.json())
      .then(setAnalytics)
      .catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleAssignTenant = async (propId) => {
    if (!tenantEmailInput || !tenantEmailInput.trim()) return;

    try {
      const res = await fetch(`/api/properties/${propId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: tenantEmailInput.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to assign tenant');
      
      setAssigningPropId(null);
      setTenantEmailInput('');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUnassignTenant = async (propId, tenantId) => {
    if (!confirm('Unassign this user from property?')) return;
    try {
      await fetch(`/api/properties/${propId}/assign/${tenantId}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProperty = async (propId) => {
    if (!confirm('Are you sure you want to delete this property and all attached meters?')) return;
    try {
      await fetch(`/api/properties/${propId}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMeter = async (meterId) => {
    if (!confirm('Delete this meter and all past reading history?')) return;
    try {
      await fetch(`/api/meters/${meterId}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Welcome Banner */}
      <div className="glass-panel" style={{ padding: 24, background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(15, 23, 42, 0.8) 100%)', border: '1px solid var(--border-accent)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', color: '#fff', margin: 0, fontWeight: 700 }}>
            Property Owner Portal
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
            Overview of properties, assigned tenants, water meter readings, and AI OCR uploads.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={onOpenAddPropModal} className="btn btn-secondary">
            <Plus size={16} />
            <span>Add Property</span>
          </button>
          <button onClick={onOpenBatchModal} className="btn btn-teal">
            <Layers size={16} />
            <span>Bunch Upload (1 to N)</span>
          </button>
          <button onClick={onOpenUploadModal} className="btn btn-primary">
            <Camera size={16} />
            <span>Scan Single Photo</span>
          </button>
        </div>
      </div>

      {/* Analytics Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        
        <div className="glass-panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-dim)' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase' }}>Properties</span>
            <Building2 size={20} color="#0ea5e9" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginTop: 8 }}>
            {analytics?.totalProperties || properties.length}
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Managed properties</span>
        </div>

        <div className="glass-panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-dim)' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase' }}>Water Meters</span>
            <Gauge size={20} color="#14b8a6" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginTop: 8 }}>
            {analytics?.totalMeters || 0}
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Active 1-to-N meters</span>
        </div>

        <div className="glass-panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-dim)' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Usage</span>
            <Droplet size={20} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8', marginTop: 8 }}>
            {analytics?.totalConsumption || 0} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>m³</span>
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Aggregated consumption</span>
        </div>

      </div>

      {/* Properties & Meters Overview */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: '1.25rem', color: '#fff', margin: 0 }}>
            Properties & Associated Meters
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 18 }}>
          {properties.map(p => (
            <div key={p.id} className="glass-panel" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontSize: '1.1rem', color: '#fff', margin: 0, fontWeight: 700 }}>
                    {p.name}
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                    📍 {p.address}
                  </p>
                </div>
                <button onClick={() => handleDeleteProperty(p.id)} className="btn btn-secondary btn-sm" style={{ padding: 4, color: '#f87171' }} title="Delete Property">
                  <Trash2 size={15} />
                </button>
              </div>

              {/* Assigned Tenants */}
              <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>Assigned Tenants / Users:</span>
                  <button onClick={() => setAssigningPropId(assigningPropId === p.id ? null : p.id)} className="btn btn-secondary btn-sm" style={{ padding: '2px 6px', fontSize: '0.72rem' }}>
                    <UserPlus size={12} /> Assign Tenant
                  </button>
                </div>

                {assigningPropId === p.id && (
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    <input 
                      type="email" 
                      className="form-input" 
                      style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                      placeholder="Tenant email (e.g. tenant@example.com)..." 
                      value={tenantEmailInput}
                      onChange={e => setTenantEmailInput(e.target.value)}
                    />
                    <button onClick={() => handleAssignTenant(p.id)} className="btn btn-primary btn-sm" style={{ whiteSpace: 'nowrap' }}>
                      Assign Email
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {p.assignedUsers && p.assignedUsers.length > 0 ? (
                    p.assignedUsers.map(u => (
                      <span key={u.id} className="badge badge-user" style={{ fontSize: '0.72rem', textTransform: 'none' }}>
                        👤 {u.name} ({u.email})
                        <X size={12} style={{ cursor: 'pointer', marginLeft: 4 }} onClick={() => handleUnassignTenant(p.id, u.id)} />
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', italic: true }}>No tenants assigned yet.</span>
                  )}
                </div>
              </div>

              {/* Meters List */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Meters ({p.metersList ? p.metersList.length : (p.meter_count || 0)})
                  </span>
                  <button 
                    onClick={() => setActivePropForMeter(p)} 
                    className="btn btn-teal btn-sm" 
                    style={{ padding: '3px 8px', fontSize: '0.76rem' }}
                  >
                    <Plus size={12} /> Add Meter
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {p.metersList && p.metersList.length > 0 ? (
                    p.metersList.map(m => (
                      <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6 }}>
                            {m.meter_label && (
                              <span className="badge badge-owner" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                                Tag #{m.meter_label}
                              </span>
                            )}
                            <span>{m.name}</span>
                          </div>
                          <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: 2 }}>
                            {m.meter_label ? `Tag #${m.meter_label}` : `ID: ${m.meter_number}`} {m.location ? `• ${m.location}` : ''}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div>
                            <div className="mono" style={{ fontSize: '0.95rem', fontWeight: 800, color: '#38bdf8' }}>
                              {m.latest_reading !== null && m.latest_reading !== undefined ? `${m.latest_reading} m³` : `${m.initial_reading} m³`}
                            </div>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Latest Reading</span>
                          </div>

                          {/* Edit / Delete Meter Actions */}
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              onClick={() => setEditingMeter(m)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: 4, borderRadius: 6 }}
                              title="Edit Meter Settings"
                            >
                              <Edit3 size={14} color="#38bdf8" />
                            </button>
                            <button
                              onClick={() => handleDeleteMeter(m.id)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: 4, borderRadius: 6 }}
                              title="Delete Meter"
                            >
                              <Trash2 size={14} color="#f87171" />
                            </button>
                          </div>
                        </div>

                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: 8 }}>
                      No meters attached to property. Click "Add Meter" to attach.
                    </div>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* Analytics Chart & Recent Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, flexWrap: 'wrap' }}>
        
        <div className="glass-panel" style={{ padding: 20 }}>
          <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: 14 }}>
            Monthly Water Consumption Trend (m³)
          </h3>
          <UsageChart readings={analytics?.recentReadings || []} />
        </div>

        <div className="glass-panel" style={{ padding: 20 }}>
          <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: 14 }}>
            Recent OCR Uploads
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {analytics?.recentReadings && analytics.recentReadings.length > 0 ? (
              analytics.recentReadings.slice(0, 4).map(r => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 6 }}>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>{r.meter_name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.user_name} • {new Date(r.created_at).toLocaleDateString()}</div>
                  </div>
                  <span className="mono" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#38bdf8' }}>
                    {r.reading_value} m³
                  </span>
                </div>
              ))
            ) : (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No recent readings.</span>
            )}
          </div>
        </div>

      </div>

      {/* Full Reading History Table */}
      <div className="glass-panel" style={{ padding: 20 }}>
        <h3 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: 14 }}>
          Comprehensive Meter Reading Audit History
        </h3>
        <ReadingHistoryTable readings={analytics?.recentReadings || []} />
      </div>

      {/* Add Meter Modal */}
      {activePropForMeter && (
        <AddMeterModal
          isOpen={!!activePropForMeter}
          onClose={() => setActivePropForMeter(null)}
          propertyId={activePropForMeter.id}
          propertyName={activePropForMeter.name}
          onMeterAdded={loadData}
        />
      )}

      {/* Edit Meter Modal */}
      {editingMeter && (
        <EditMeterModal
          isOpen={!!editingMeter}
          onClose={() => setEditingMeter(null)}
          meter={editingMeter}
          onMeterUpdated={loadData}
        />
      )}

    </div>
  );
}
