import React, { useState, useEffect } from 'react';
import { X, Gauge, CheckCircle2, Trash2, Loader2, Tag } from 'lucide-react';

export default function EditMeterModal({ isOpen, onClose, meter, onMeterUpdated }) {
  const [tagNumber, setTagNumber] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [initialReading, setInitialReading] = useState('0.0');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (meter) {
      setTagNumber(meter.meter_label || meter.meter_number?.replace('TAG-', '') || '');
      setName(meter.name || '');
      setLocation(meter.location || '');
      setInitialReading((meter.initial_reading || 0.0).toString());
    }
  }, [meter]);

  if (!isOpen || !meter) return null;

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!name) {
      setErrorMsg('Meter name is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/meters/${meter.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meterLabel: tagNumber.trim(),
          meterNumber: `TAG-${tagNumber.trim()}`,
          name,
          location,
          initialReading: parseFloat(initialReading) || 0.0
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update meter');

      onMeterUpdated();
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${meter.name}"? All past readings for this meter will be deleted.`)) {
      return;
    }

    setIsDeleting(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/meters/${meter.id}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete meter');

      onMeterUpdated();
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 500 }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: '1.25rem', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Gauge color="#0ea5e9" size={20} />
            <span>Edit Water Meter Settings</span>
          </h2>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ padding: 4, borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: 10, borderRadius: 8, fontSize: '0.85rem', marginBottom: 16 }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleUpdate}>
          <div className="form-group">
            <label className="form-label">Meter Name / Purpose</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Water Meter #1 (Cold Water)" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Tag size={15} color="#38bdf8" />
              <span>Handwritten Tag Number (e.g. 1, 2, 3, 4, 5)</span>
            </label>
            <input 
              type="text" 
              className="form-input mono" 
              placeholder="1, 2, 3, 4, 5" 
              value={tagNumber} 
              onChange={e => setTagNumber(e.target.value)} 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Physical Location</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Main Riser Shaft" 
              value={location} 
              onChange={e => setLocation(e.target.value)} 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Initial Baseline Reading (m³)</label>
            <input 
              type="number" 
              step="0.1" 
              className="form-input mono" 
              placeholder="0.0" 
              value={initialReading} 
              onChange={e => setInitialReading(e.target.value)} 
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
            <button 
              type="button" 
              onClick={handleDelete} 
              disabled={isDeleting} 
              className="btn btn-danger btn-sm"
              style={{ gap: 6 }}
            >
              <Trash2 size={16} />
              <span>{isDeleting ? 'Deleting...' : 'Delete Meter'}</span>
            </button>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                {isSubmitting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={16} />}
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
