import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Upload, Camera, CheckCircle2, AlertTriangle, Sparkles, Loader2, Cpu, Save } from 'lucide-react';

export default function MeterUploadModal({ isOpen, onClose, onReadingAdded, preselectedMeterId }) {
  const { user } = useAuth();
  
  const [properties, setProperties] = useState([]);
  const [meters, setMeters] = useState([]);
  
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [selectedMeterId, setSelectedMeterId] = useState(preselectedMeterId || '');

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [isScanning, setIsScanning] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);

  const [manualValue, setManualValue] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Fetch properties and meters
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

  // Load meters when selected property changes
  useEffect(() => {
    if (!selectedPropertyId) return;

    fetch(`/api/meters/property/${selectedPropertyId}`)
      .then(res => res.json())
      .then(data => {
        setMeters(data);
        if (data.length > 0) {
          if (preselectedMeterId && data.some(m => m.id == preselectedMeterId)) {
            setSelectedMeterId(preselectedMeterId);
          } else {
            setSelectedMeterId(data[0].id);
          }
        } else {
          setSelectedMeterId('');
        }
      })
      .catch(console.error);
  }, [selectedPropertyId, preselectedMeterId]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setOcrResult(null);
      setErrorMsg('');
    }
  };

  const runGeminiVisionOCR = async () => {
    if (!selectedFile) {
      setErrorMsg('Please select or upload a meter photo first.');
      return;
    }

    setIsScanning(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('meterImage', selectedFile);

      const res = await fetch('/api/readings/ocr', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gemini Vision processing failed');

      setOcrResult(data);
      if (data.ocr && data.ocr.detectedReading !== null) {
        setManualValue(data.ocr.detectedReading.toString());
      }

      if (data.matchedMeter && data.matchedMeter.id) {
        setSelectedMeterId(data.matchedMeter.id);
        if (data.matchedMeter.property_id) {
          setSelectedPropertyId(data.matchedMeter.property_id);
        }
      }
    } catch (err) {
      setErrorMsg('Gemini Vision Error: ' + err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveReading = async () => {
    if (!selectedMeterId) {
      setErrorMsg('Please select a water meter.');
      return;
    }

    if (!manualValue || isNaN(parseFloat(manualValue))) {
      setErrorMsg('Please enter a valid numeric reading value.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        meterId: selectedMeterId,
        readingValue: parseFloat(manualValue),
        imagePath: ocrResult?.imagePath || previewUrl || '',
        ocrRawText: ocrResult?.ocr?.rawText || '',
        ocrConfidence: ocrResult?.ocr?.confidence || 0,
        notes
      };

      const res = await fetch('/api/readings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          'x-user-role': user.role
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save reading');

      setSuccessMsg(`Reading ${manualValue} m³ saved!`);
      setTimeout(() => {
        onReadingAdded();
        onClose();
        setManualValue('');
        setSelectedFile(null);
        setPreviewUrl(null);
        setOcrResult(null);
      }, 1200);

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
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setOcrResult(null);
      setErrorMsg('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 720 }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Camera color="#0ea5e9" size={24} />
              <span>Log Water Meter Reading</span>
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
              Insert reading value manually or upload photo to auto-extract with AI
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

        {/* Property & Meter Selector */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">1. Target Property</label>
            <select 
              className="form-select" 
              value={selectedPropertyId} 
              onChange={e => setSelectedPropertyId(e.target.value)}
            >
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">2. Target Water Meter</label>
            <select 
              className="form-select" 
              value={selectedMeterId} 
              onChange={e => setSelectedMeterId(e.target.value)}
            >
              {meters.length > 0 ? (
                meters.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.meter_label ? `Tag #${m.meter_label} - ` : ''}{m.name}
                  </option>
                ))
              ) : (
                <option value="">No meters found in property</option>
              )}
            </select>
          </div>
        </div>

        {/* Direct Reading Input Field (Immediate Manual Entry) */}
        <div className="form-group" style={{ background: 'rgba(14, 165, 233, 0.08)', padding: 14, borderRadius: 10, border: '1px solid rgba(14, 165, 233, 0.25)', marginBottom: 16 }}>
          <label className="form-label" style={{ color: '#f8fafc', fontWeight: 700, fontSize: '0.9rem' }}>
            3. Meter Reading Value (m³) — Enter Manually or Auto-Scan
          </label>
          <input 
            type="number" 
            step="0.01" 
            className="form-input mono" 
            placeholder="e.g. 128.5"
            style={{ fontSize: '1.35rem', fontWeight: 800, color: '#38bdf8', background: '#0b0f19', border: '1px solid #0ea5e9' }}
            value={manualValue} 
            onChange={e => setManualValue(e.target.value)} 
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Type your numeric meter reading here, or upload a photo below to auto-fill using AI OCR.
          </span>
        </div>

        {/* Upload File Section */}
        <div style={{ marginBottom: 16 }}>
          <label className="form-label">4. Photo Upload & AI Scan (Optional)</label>

          {/* Drag & Drop File Input */}
          <label 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
              background: isDragging ? 'rgba(14, 165, 233, 0.15)' : 'var(--bg-input)',
              border: isDragging ? '2px dashed #0ea5e9' : '2px dashed var(--border-color)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: isDragging ? '0 0 20px rgba(14, 165, 233, 0.3)' : 'none'
            }}
          >
            <Upload size={22} color={isDragging ? '#38bdf8' : 'var(--primary)'} />
            <span style={{ fontSize: '0.86rem', fontWeight: 600, color: isDragging ? '#38bdf8' : 'var(--text-main)', marginTop: 4 }}>
              {isDragging ? 'Release photo to upload!' : (selectedFile ? selectedFile.name : 'Attach Meter Photo (or drag & drop)')}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>Supports JPG, PNG, WEBP files</span>
            <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
          </label>
        </div>

        {/* Image Preview & Scanner Visual Overlay */}
        {previewUrl && (
          <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-accent)', marginBottom: 16, background: '#000', textAlign: 'center', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={previewUrl} alt="Meter preview" style={{ maxHeight: 240, maxWidth: '100%', objectFit: 'contain' }} />

            {/* Scanning Overlay Animation */}
            {isScanning && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(14, 165, 233, 0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, backdropFilter: 'blur(3px)' }}>
                <Loader2 size={36} color="#38bdf8" style={{ animation: 'spin 1s linear infinite' }} />
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                  Analyzing Water Meter Photo...
                </div>
                <div style={{ fontSize: '0.78rem', color: '#93c5fd' }}>
                  Extracting numeric counter digits & handwritten tag
                </div>
              </div>
            )}

            {/* Recognized Bounding Box Overlay if AI succeeds */}
            {ocrResult && ocrResult.ocr && (
              <div style={{
                position: 'absolute',
                top: '38%',
                left: '18%',
                right: '18%',
                border: '2px solid #4ade80',
                background: 'rgba(74, 222, 128, 0.2)',
                borderRadius: 8,
                padding: '8px 12px',
                pointerEvents: 'none',
                boxShadow: '0 0 25px rgba(74, 222, 128, 0.6)',
                zIndex: 10
              }}>
                <span style={{ background: '#22c55e', color: '#000', fontWeight: 800, fontSize: '0.82rem', padding: '4px 10px', borderRadius: 4 }}>
                  ✨ Detected Reading: {ocrResult.ocr.detectedReading} m³ ({ocrResult.ocr.confidence}% confidence)
                </span>
              </div>
            )}
          </div>
        )}

        {/* AI OCR Trigger Button */}
        {!ocrResult && previewUrl && (
          <button 
            onClick={runGeminiVisionOCR} 
            disabled={isScanning} 
            className="btn btn-secondary" 
            style={{ width: '100%', padding: '10px', fontSize: '0.88rem', marginBottom: 16 }}
          >
            {isScanning ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={16} color="#38bdf8" />}
            <span>{isScanning ? 'Reading Meter Photo...' : '✨ Auto-Fill Reading with AI OCR Scan'}</span>
          </button>
        )}

        {/* Notes */}
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">Notes / Remarks (Optional)</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="e.g. Monthly July reading" 
            value={notes} 
            onChange={e => setNotes(e.target.value)} 
          />
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button 
            onClick={handleSaveReading} 
            disabled={isSubmitting || !manualValue} 
            className="btn btn-primary" 
            style={{ padding: '10px 24px', fontSize: '0.95rem', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' }}
          >
            {isSubmitting ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={18} />}
            <span>Save Reading</span>
          </button>
        </div>

      </div>
    </div>
  );
}
