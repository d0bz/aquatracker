import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, Gauge, Camera, Droplet, Calendar, CheckCircle2, Sparkles, TrendingUp, Layers, Tag, Send, Mail, Loader2, AlertTriangle } from 'lucide-react';
import UsageChart from '../components/UsageChart';
import ReadingHistoryTable from '../components/ReadingHistoryTable';

export default function UserDashboard({ onOpenUploadModal, onOpenBatchModal }) {
  const { user } = useAuth();
  
  const [properties, setProperties] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const [isSendingReport, setIsSendingReport] = useState(false);
  const [reportSuccessMsg, setReportSuccessMsg] = useState('');
  const [reportErrorMsg, setReportErrorMsg] = useState('');

  const loadData = () => {
    if (!user) return;

    fetch('/api/properties', {
      headers: { 'x-user-id': user.id, 'x-user-role': user.role }
    })
      .then(res => res.json())
      .then(async data => {
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

  const handleSendReportToLandlord = async () => {
    setIsSendingReport(true);
    setReportSuccessMsg('');
    setReportErrorMsg('');

    try {
      const res = await fetch('/api/readings/notify-owner', {
        method: 'POST',
        headers: {
          'x-user-id': user.id,
          'x-user-role': user.role
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send report');

      setReportSuccessMsg(data.message || 'Report sent successfully!');
      loadData(); // refresh analytics to update unnotifiedCount to 0
    } catch (err) {
      setReportErrorMsg(err.message);
    } finally {
      setIsSendingReport(false);
    }
  };

  const unnotifiedCount = analytics?.unnotifiedCount || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Welcome Hero Banner */}
      <div className="glass-panel" style={{ padding: 24, background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.2) 0%, rgba(20, 184, 166, 0.1) 100%)', border: '1px solid var(--border-accent)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(14,165,233,0.2)', color: '#38bdf8', fontSize: '0.78rem', fontWeight: 600, padding: '4px 10px', borderRadius: 12, marginBottom: 8 }}>
            <Sparkles size={14} /> TENANT WATER METER PORTAL
          </div>
          <h2 style={{ fontSize: '1.6rem', color: '#fff', margin: 0, fontWeight: 800 }}>
            Hello, {user?.name}!
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
            Take a picture of your water meter to log readings, then send the consolidated report to your landlord when ready.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          
          {/* Send Monthly Report to Landlord (Visible ONLY when there are pending meter updates) */}
          {unnotifiedCount > 0 && (
            <button 
              onClick={handleSendReportToLandlord} 
              disabled={isSendingReport} 
              className="btn" 
              style={{ 
                padding: '12px 20px', 
                fontSize: '0.95rem', 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #22c55e, #16a34a)', 
                color: '#ffffff', 
                boxShadow: '0 0 20px rgba(34, 197, 94, 0.4)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {isSendingReport ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={18} />}
              <span>Send Monthly Report to Landlord ({unnotifiedCount} Pending)</span>
            </button>
          )}

          <button onClick={() => onOpenBatchModal()} className="btn btn-teal" style={{ padding: '12px 20px', fontSize: '0.95rem' }}>
            <Layers size={18} />
            <span>Bunch Upload All (1 to N)</span>
          </button>
          <button onClick={() => onOpenUploadModal()} className="btn btn-primary" style={{ padding: '12px 20px', fontSize: '0.95rem', boxShadow: '0 0 25px rgba(14,165,233,0.4)' }}>
            <Camera size={18} />
            <span>Scan Single Photo</span>
          </button>
        </div>
      </div>

      {/* Notifications / Feedback Alerts */}
      {reportSuccessMsg && (
        <div style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#4ade80', padding: 14, borderRadius: 10, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle2 size={20} />
          <span>{reportSuccessMsg}</span>
        </div>
      )}

      {reportErrorMsg && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: 14, borderRadius: 10, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={20} />
          <span>{reportErrorMsg}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        
        <div className="glass-panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-dim)' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase' }}>My Property</span>
            <Building2 size={20} color="#0ea5e9" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginTop: 8 }}>
            {properties.length > 0 ? properties[0].name : 'Assigned Unit'}
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            {properties.length > 0 ? `Landlord: ${properties[0].owner_name || 'Owner'}` : 'No property assigned'}
          </span>
        </div>

        <div className="glass-panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-dim)' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase' }}>Active Meters</span>
            <Gauge size={20} color="#14b8a6" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginTop: 8 }}>
            {analytics?.totalMeters || 0}
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Water meters on unit</span>
        </div>

        <div className="glass-panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-dim)' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Consumption</span>
            <Droplet size={20} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8', marginTop: 8 }}>
            {analytics?.totalConsumption || 0} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>m³</span>
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Recorded water readings</span>
        </div>

        <div className="glass-panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-dim)' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase' }}>Report Status</span>
            <Mail size={20} color={unnotifiedCount > 0 ? '#4ade80' : '#0ea5e9'} />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: unnotifiedCount > 0 ? '#4ade80' : '#fff', marginTop: 8 }}>
            {unnotifiedCount > 0 ? `${unnotifiedCount} Pending Update(s)` : 'All Sent to Landlord'}
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            {unnotifiedCount > 0 ? 'Click button above to email report' : 'Landlord up to date'}
          </span>
        </div>

      </div>

      {/* Property & Meters List */}
      <div>
        <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: 16 }}>
          My Water Meters (1 to N)
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
          {properties.map(p => (
            <div key={p.id} className="glass-panel" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <h4 style={{ fontSize: '1.1rem', color: '#38bdf8', margin: 0 }}>{p.name}</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>{p.address}</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {p.metersList && p.metersList.length > 0 ? (
                  p.metersList.map(m => (
                    <div key={m.id} style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {m.meter_label ? (
                            <span className="badge badge-owner" style={{ fontSize: '0.75rem' }}>
                              <Tag size={12} /> Tag #{m.meter_label}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>#{m.meter_number}</span>
                          )}
                          <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{m.name}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                          Last update: {m.last_updated ? new Date(m.last_updated).toLocaleDateString() : 'Baseline Setup'}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8' }}>
                          {m.latest_reading !== null && m.latest_reading !== undefined ? m.latest_reading : m.initial_reading} m³
                        </div>
                        <button onClick={() => onOpenUploadModal(m.id)} className="btn btn-secondary btn-sm" style={{ marginTop: 4, padding: '4px 8px', fontSize: '0.72rem' }}>
                          Log Reading
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>No water meters attached yet by landlord.</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics Chart */}
      <div className="glass-panel" style={{ padding: 24 }}>
        <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={20} color="#0ea5e9" />
          <span>Water Meter Usage Analytics</span>
        </h3>
        <UsageChart readings={analytics?.recentReadings || []} />
      </div>

      {/* Reading History Audit Table */}
      <div className="glass-panel" style={{ padding: 24 }}>
        <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={20} color="#14b8a6" />
          <span>Reading Audit Log</span>
        </h3>
        <ReadingHistoryTable readings={analytics?.recentReadings || []} userRole={user?.role} />
      </div>

    </div>
  );
}
