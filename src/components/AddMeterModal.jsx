import React, { useState } from 'react';
import { X, Gauge, CheckCircle2, Loader2, Tag } from 'lucide-react';

export default function AddMeterModal({ isOpen, onClose, propertyId, propertyName, onMeterAdded }) {
  const [tagNumber, setTagNumber] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [initialReading, setInitialReading] = useState('0.0');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tagNumber || !name) {
      setErrorMsg('Tag number and meter name are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/meters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          meterLabel: tagNumber.trim(),
          meterNumber: `TAG-${tagNumber.trim()}`,
          name,
          location,
          initialReading: parseFloat(initialReading) || 0.0
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add meter');

      onMeterAdded();
      onClose();
      setTagNumber('');
      setName('');
      setLocation('');
      setInitialReading('0.0');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 500 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: '1.2rem', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Gauge color="#0ea5e9" size={20} />
            <span>Add Water Meter to {propertyName}</span>
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

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Tag size={15} color="#38bdf8" />
              <span>Handwritten Tag Number (e.g. 1, 2, 3, 4, 5)</span>
            </label>
            <input 
              type="text" 
              className="form-input mono" 
              placeholder="e.g. 1" 
              value={tagNumber} 
              onChange={e => setTagNumber(e.target.value)} 
              required 
            />
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Enter the handwritten number attached on the meter body. AI OCR will match uploads automatically.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Meter Name / Purpose</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Main Kitchen Water" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Physical Location (Optional)</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Basement Utility Shaft B" 
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={16} />}
              <span>Add Meter</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
