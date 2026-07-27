import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Droplet } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function UsageChart({ readings = [] }) {
  // Sort readings chronologically
  const sortedReadings = [...readings].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  // Group readings by Month (YYYY-MM)
  const monthlyMap = new Map();

  sortedReadings.forEach(r => {
    const d = new Date(r.created_at);
    const yearMonthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = d.toLocaleString('default', { month: 'short', year: 'numeric' });

    const current = monthlyMap.get(yearMonthKey) || { label: monthLabel, consumption: 0 };
    current.consumption += parseFloat(r.consumption || 0);
    monthlyMap.set(yearMonthKey, current);
  });

  if (!readings || readings.length === 0 || monthlyMap.size === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Droplet size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>No water consumption recorded yet</p>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>Scan or upload a meter photo to start tracking monthly usage.</span>
      </div>
    );
  }

  let labels = [];
  let consumptionData = [];

  Array.from(monthlyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([_, val]) => {
      labels.push(val.label);
      consumptionData.push(parseFloat(val.consumption.toFixed(2)));
    });

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#94a3b8',
          font: { family: 'Inter', size: 12 }
        }
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f8fafc',
        bodyColor: '#38bdf8',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (context) => ` Total Consumption: ${context.raw} m³`
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8', font: { family: 'Inter', size: 11, weight: 600 } },
        grid: { color: 'rgba(255, 255, 255, 0.05)' }
      },
      y: {
        ticks: { color: '#64748b' },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        beginAtZero: true,
        title: {
          display: true,
          text: 'Monthly Water Consumption (m³)',
          color: '#64748b',
          font: { size: 11 }
        }
      }
    }
  };

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Monthly Water Consumption (m³)',
        data: consumptionData,
        backgroundColor: 'rgba(14, 165, 233, 0.85)',
        borderColor: '#0ea5e9',
        borderWidth: 1,
        borderRadius: 6,
        barThickness: 42
      }
    ]
  };

  return (
    <div style={{ width: '100%', height: 260 }}>
      <Bar options={barOptions} data={chartData} />
    </div>
  );
}
