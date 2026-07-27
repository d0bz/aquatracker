import React, { useState } from 'react';
import { X, Building2, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AddPropertyModal({ isOpen, onClose, onPropertyAdded }) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !address) {
      setErrorMsg('Property name and address are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          'x-user-role': user.role
        },
        body: JSON.stringify({
          name,
          address,
          notes,
          tenantEmail: tenantEmail.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create property');

      onPropertyAdded();
      onClose();
      setName('');
      setAddress('');
      setNotes('');
      setTenantEmail('');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 540 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: '1.25rem', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building2 color="#0ea5e9" size={20} />
            <span>Add New Property</span>
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
            <label className="form-label">Property Name</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Sunset Heights - Unit 401" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. 142 Park Avenue, New York, NY" 
              value={address} 
              onChange={e => setAddress(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Assign Tenant Email (Optional)</label>
            <input 
              type="email" 
              className="form-input" 
              placeholder="e.g. tenant@example.com" 
              value={tenantEmail} 
              onChange={e => setTenantEmail(e.target.value)} 
            />
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Enter the tenant's email address to attach them directly to this property.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Notes (Optional)</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. 2-bedroom residential unit" 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={16} />}
              <span>Create Property</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
