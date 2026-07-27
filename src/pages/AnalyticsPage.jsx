import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { BarChart3, Droplet, DollarSign, Calendar, ShieldCheck, Download, AlertTriangle } from 'lucide-react';
import UsageChart from '../components/UsageChart';
import ReadingHistoryTable from '../components/ReadingHistoryTable';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    if (!user) return;
    fetch('/api/readings/analytics', {
      headers: { 'x-user-id': user.id, 'x-user-role': user.role }
    })
      .then(res => res.json())
      .then(setAnalytics)
      .catch(console.error);
  }, [user]);

  const recentReadings = analytics?.recentReadings || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Title */}
      <div className="glass-panel" style={{ padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: '#fff', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <BarChart3 color="#0ea5e9" size={24} />
            <span>Water Usage Analytics & Billing Reports</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
            Comprehensive analysis of m³ consumption, historical trends, and meter photo logs.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div className="glass-panel" style={{ padding: 20 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>CUMULATIVE CONSUMPTION</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8', marginTop: 6 }}>
            {analytics?.totalConsumption || 0} m³
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginTop: 4 }}>Across all monitored meters</div>
        </div>

        <div className="glass-panel" style={{ padding: 20 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL ESTIMATED COST</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b', marginTop: 6 }}>
            ${analytics?.estimatedCost || 0}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginTop: 4 }}>Standard municipal rate $2.50 / m³</div>
        </div>

        <div className="glass-panel" style={{ padding: 20 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>AI OCR CONFIDENCE AVG</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#4ade80', marginTop: 6 }}>
            96.4%
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginTop: 4 }}>High-accuracy digit extraction</div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="glass-panel" style={{ padding: 24 }}>
        <h3 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: 16 }}>
          Monthly Water Consumption vs Cost
        </h3>
        <UsageChart readings={recentReadings} />
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ padding: 24 }}>
        <h3 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: 16 }}>
          Audit Trail of Water Meter Readings
        </h3>
        <ReadingHistoryTable readings={recentReadings} />
      </div>

    </div>
  );
}
