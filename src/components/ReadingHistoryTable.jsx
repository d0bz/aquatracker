import React, { useState } from 'react';
import { Eye, Calendar, User, Droplet, Sparkles, Image as ImageIcon, X } from 'lucide-react';

export default function ReadingHistoryTable({ readings = [] }) {
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  if (!readings || readings.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
        <Droplet size={32} style={{ opacity: 0.4, marginBottom: 8 }} />
        <p>No meter readings recorded yet.</p>
      </div>
    );
  }

  return (
    <>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-dim)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 14px' }}>Date & Time</th>
              <th style={{ padding: '12px 14px' }}>Property & Meter</th>
              <th style={{ padding: '12px 14px' }}>Meter Reading</th>
              <th style={{ padding: '12px 14px' }}>Consumption</th>
              <th style={{ padding: '12px 14px' }}>OCR Accuracy</th>
              <th style={{ padding: '12px 14px' }}>Uploaded By</th>
              <th style={{ padding: '12px 14px', textAlign: 'right' }}>Photo</th>
            </tr>
          </thead>
          <tbody>
            {readings.map((r) => {
              const dateStr = new Date(r.created_at).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <tr key={r.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', transition: 'background 0.2s' }} className="table-row">
                  
                  {/* Timestamp */}
                  <td style={{ padding: '12px 14px', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={14} color="var(--text-dim)" />
                      <span>{dateStr}</span>
                    </div>
                  </td>

                  {/* Property & Meter */}
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>{r.property_name || 'Property'}</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      {r.meter_name} (<span className="mono">{r.meter_number || 'WM-METER'}</span>)
                    </div>
                  </td>

                  {/* Meter Reading Value */}
                  <td style={{ padding: '12px 14px' }}>
                    <span className="mono" style={{ fontSize: '1rem', fontWeight: 700, color: '#38bdf8' }}>
                      {r.reading_value} m³
                    </span>
                  </td>

                  {/* Consumption */}
                  <td style={{ padding: '12px 14px' }}>
                    <span className="badge badge-success">
                      +{r.consumption} m³
                    </span>
                  </td>

                  {/* OCR Confidence */}
                  <td style={{ padding: '12px 14px' }}>
                    {r.ocr_confidence > 0 ? (
                      <span className="badge badge-user" style={{ background: 'rgba(14, 165, 233, 0.12)' }}>
                        <Sparkles size={12} /> {r.ocr_confidence}% Match
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Manual</span>
                    )}
                  </td>

                  {/* Uploaded by */}
                  <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <User size={14} />
                      <span>{r.user_name || r.uploaded_by_name || 'Tenant'}</span>
                    </div>
                  </td>

                  {/* Photo thumbnail action */}
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                    {r.image_path ? (
                      <button
                        onClick={() => setSelectedPhoto(r.image_path)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 8px' }}
                      >
                        <ImageIcon size={14} color="#38bdf8" />
                        <span>View Photo</span>
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>No photo</span>
                    )}
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Image Preview Modal */}
      {selectedPhoto && (
        <div className="modal-overlay" onClick={() => setSelectedPhoto(null)}>
          <div className="modal-content" style={{ maxWidth: 540, padding: 16 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#fff' }}>Meter Photo Evidence</h3>
              <button onClick={() => setSelectedPhoto(null)} className="btn btn-secondary btn-sm" style={{ padding: 4, borderRadius: '50%' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ textAlign: 'center', background: '#000', borderRadius: 12, padding: 8, overflow: 'hidden' }}>
              <img src={selectedPhoto} alt="Water meter reading evidence" style={{ maxWidth: '100%', maxHeight: 400, objectFit: 'contain' }} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
