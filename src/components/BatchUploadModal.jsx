import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Upload, Layers, CheckCircle2, AlertTriangle, Sparkles, Loader2, Save, Tag } from 'lucide-react';

export default function BatchUploadModal({ isOpen, onClose, onReadingsAdded }) {
  const { user } = useAuth();

  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [allMeters, setAllMeters] = useState([]);

  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [batchResults, setBatchResults] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) return;

    fetch('/api/properties', {
      headers: {
        'x-user-id': user.id,
        'x-user-role': user.role
      }
    })
      .then(res => res.json())
      .then(data => {
        setProperties(data);
        if (data.length > 0 && !selectedPropertyId) {
          setSelectedPropertyId(data[0].id);
        }
      })
      .catch(console.error);
  }, [isOpen, user]);

  useEffect(() => {
    if (!selectedPropertyId) return;

    fetch(`/api/meters/property/${selectedPropertyId}`)
      .then(res => res.json())
      .then(setAllMeters)
      .catch(console.error);
  }, [selectedPropertyId]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
      setBatchResults(null);
      setErrorMsg('');
    }
  };

  const runBatchOCR = async () => {
    if (files.length === 0) {
      setErrorMsg('Please select at least one meter photo.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      files.forEach(f => formData.append('meterImages', f));
      if (selectedPropertyId) formData.append('propertyId', selectedPropertyId);

      const res = await fetch('/api/readings/batch-ocr', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Batch processing failed');

      const items = data.results.map((r, idx) => ({
        imagePath: r.imagePath,
        rawText: r.ocr?.rawText || '',
        confidence: r.ocr?.confidence || 0,
        detectedReading: r.ocr?.detectedReading !== null ? r.ocr.detectedReading : '',
        manualReading: r.ocr?.detectedReading !== null ? r.ocr.detectedReading.toString() : '',
        handwrittenLabel: r.ocr?.handwrittenLabel || null,
        selectedMeterId: r.matchedMeter ? r.matchedMeter.id : (allMeters[idx % allMeters.length]?.id || '')
      }));

      setBatchResults(items);
    } catch (err) {
      setErrorMsg('Batch OCR Error: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleItemMeterChange = (idx, meterId) => {
    const updated = [...batchResults];
    updated[idx].selectedMeterId = meterId;
    setBatchResults(updated);
  };

  const handleItemReadingChange = (idx, val) => {
    const updated = [...batchResults];
    updated[idx].manualReading = val;
    setBatchResults(updated);
  };

  const handleSaveAllBatch = async () => {
    if (!batchResults || batchResults.length === 0) return;

    const validReadings = batchResults.filter(item => item.selectedMeterId && item.manualReading !== '');
    if (validReadings.length === 0) {
      setErrorMsg('Please select a valid meter and enter reading values for the photos.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        readings: validReadings.map(item => ({
          meterId: item.selectedMeterId,
          readingValue: parseFloat(item.manualReading),
          imagePath: item.imagePath,
          ocrRawText: item.rawText,
          ocrConfidence: item.confidence,
          notes: item.handwrittenLabel ? `Tag #${item.handwrittenLabel} Batch Upload` : 'Batch Upload'
        }))
      };

      const res = await fetch('/api/readings/batch-submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          'x-user-role': user.role
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit batch readings');

      setSuccessMsg(`Successfully saved ${data.savedCount} meter readings!`);

      setTimeout(() => {
        onReadingsAdded();
        onClose();
        setFiles([]);
        setBatchResults(null);
      }, 1400);

    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(Array.from(e.dataTransfer.files));
      setBatchResults(null);
      setErrorMsg('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 840 }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers color="#0ea5e9" size={24} />
              <span>Bunch / Batch Upload Water Meter Photos</span>
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
              Upload all 1 to N meter photos at once. AI detects handwritten tags (1, 2, 3, 4, 5) and auto-routes readings to the correct meter!
            </p>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ padding: 6, borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: 12, borderRadius: 8, fontSize: '0.85rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#4ade80', padding: 12, borderRadius: 8, fontSize: '0.85rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Step 1: Select Property */}
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">1. Select Target Property</label>
          <select className="form-select" value={selectedPropertyId} onChange={e => setSelectedPropertyId(e.target.value)}>
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.address})</option>
            ))}
          </select>
        </div>

        {/* Step 2: Upload Files */}
        <div style={{ marginBottom: 16 }}>
          <label className="form-label">2. Select Batch Images</label>

          {/* Drag & Drop Multi-file selector */}
          <label 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
              background: isDragging ? 'rgba(14, 165, 233, 0.15)' : 'var(--bg-input)',
              border: isDragging ? '2px dashed #0ea5e9' : '2px dashed var(--border-color)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: isDragging ? '0 0 20px rgba(14, 165, 233, 0.3)' : 'none'
            }}
          >
            <Upload size={24} color={isDragging ? '#38bdf8' : 'var(--primary)'} />
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: isDragging ? '#38bdf8' : 'var(--text-main)', marginTop: 4 }}>
              {isDragging ? 'Release photos to upload!' : (files.length > 0 ? `${files.length} photos selected` : 'Drag & Drop Multiple Meter Photos Here (or click to browse)')}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>Hold Ctrl/Cmd to select multiple files</span>
            <input type="file" accept="image/*" multiple onChange={handleFileChange} style={{ display: 'none' }} />
          </label>
        </div>

        {/* Run Batch Processing Button */}
        {!batchResults && files.length > 0 && (
          <button
            onClick={runBatchOCR}
            disabled={isProcessing}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '0.95rem', marginBottom: 16, background: 'linear-gradient(135deg, #0ea5e9, #14b8a6)' }}
          >
            {isProcessing ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={18} />}
            <span>{isProcessing ? 'Analyzing All Photos with Gemini Vision...' : 'Batch Process All Meter Photos'}</span>
          </button>
        )}

        {/* Batch Results Review Cards */}
        {batchResults && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} /> Batch Auto-Routing Review ({batchResults.length} Meters Recognized)
              </span>
              <span className="badge badge-success">
                Auto-Matched by Handwritten Tag / Serial
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 300, overflowY: 'auto', paddingRight: 4, marginBottom: 14 }}>
              {batchResults.map((item, idx) => (
                <div key={idx} className="glass-panel" style={{ padding: 14, background: 'rgba(15, 23, 42, 0.7)', display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: 14, alignItems: 'center' }}>
                  
                  {/* Image Thumbnail */}
                  <div style={{ borderRadius: 8, overflow: 'hidden', height: 70, background: '#000', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <img src={item.imagePath} alt={`Meter ${idx+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>

                  {/* AI Extracted Info */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      {item.handwrittenLabel ? (
                        <span className="badge badge-owner" style={{ fontSize: '0.7rem' }}>
                          <Tag size={10} /> Tag #{item.handwrittenLabel}
                        </span>
                      ) : (
                        <span className="badge badge-user" style={{ fontSize: '0.7rem' }}>Photo #{idx+1}</span>
                      )}
                      <span style={{ fontSize: '0.72rem', color: '#4ade80' }}>
                        {item.confidence}% Match
                      </span>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                      {item.rawText}
                    </div>
                  </div>

                  {/* Meter Selector & Manual Input */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Assigned Meter:</span>
                      <select
                        className="form-select"
                        style={{ fontSize: '0.8rem', padding: '4px 6px' }}
                        value={item.selectedMeterId}
                        onChange={e => handleItemMeterChange(idx, e.target.value)}
                      >
                        <option value="">Select Target Meter...</option>
                        {allMeters.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.meter_label ? `Label #${m.meter_label} - ` : ''}{m.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Reading Value (m³):</span>
                      <input
                        type="number"
                        step="0.01"
                        className="form-input mono"
                        style={{ fontSize: '0.9rem', padding: '4px 6px', color: '#38bdf8', fontWeight: 700 }}
                        value={item.manualReading}
                        onChange={e => handleItemReadingChange(idx, e.target.value)}
                      />
                    </div>
                  </div>

                </div>
              ))}
            </div>

          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          {batchResults && (
            <button
              onClick={handleSaveAllBatch}
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ padding: '10px 24px', fontSize: '0.95rem', background: 'gradient(135deg, #0ea5e9, #0284c7)' }}
            >
              {isSubmitting ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={18} />}
              <span>Save All Readings</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
