const express = require('express');
const router = express.Router();
const db = require('../db');

// Get meters for property
router.get('/property/:propertyId', (req, res) => {
  const propertyId = req.params.propertyId;
  const meters = db.prepare(`
    SELECT m.*, 
      (SELECT reading_value FROM meter_readings WHERE meter_id = m.id ORDER BY created_at DESC LIMIT 1) as latest_reading,
      (SELECT created_at FROM meter_readings WHERE meter_id = m.id ORDER BY created_at DESC LIMIT 1) as last_updated_at,
      (SELECT SUM(consumption) FROM meter_readings WHERE meter_id = m.id) as total_consumption
    FROM meters m
    WHERE m.property_id = ?
    ORDER BY m.id ASC
  `).all(propertyId);

  res.json(meters);
});

// Get single meter details with readings history
router.get('/:id', (req, res) => {
  const meterId = req.params.id;
  const meter = db.prepare(`
    SELECT m.*, p.name as property_name, p.address as property_address
    FROM meters m
    JOIN properties p ON m.property_id = p.id
    WHERE m.id = ?
  `).get(meterId);

  if (!meter) {
    return res.status(404).json({ error: 'Meter not found' });
  }

  const readings = db.prepare(`
    SELECT mr.*, u.name as uploaded_by_name
    FROM meter_readings mr
    LEFT JOIN users u ON mr.user_id = u.id
    WHERE mr.meter_id = ?
    ORDER BY mr.created_at DESC
  `).all(meterId);

  res.json({ ...meter, readings });
});

// Create meter
router.post('/', (req, res) => {
  const { propertyId, meterNumber, meterLabel, name, location, initialReading } = req.body;

  if (!propertyId || !name) {
    return res.status(400).json({ error: 'Property ID and Meter Name are required' });
  }

  const stmt = db.prepare('INSERT INTO meters (property_id, meter_number, meter_label, name, location, initial_reading) VALUES (?, ?, ?, ?, ?, ?)');
  const info = stmt.run(
    propertyId, 
    (meterNumber || `WM-${Date.now().toString().slice(-6)}`).toUpperCase(), 
    meterLabel || null, 
    name, 
    location || '', 
    parseFloat(initialReading) || 0.0
  );

  const newMeter = db.prepare('SELECT * FROM meters WHERE id = ?').get(info.lastInsertRowid);
  res.json({ success: true, meter: newMeter, message: 'Meter created successfully' });
});

// Update meter details
router.put('/:id', (req, res) => {
  const meterId = req.params.id;
  const { meterNumber, meterLabel, name, location, initialReading } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Meter Name is required' });
  }

  const stmt = db.prepare(`
    UPDATE meters 
    SET meter_number = ?, meter_label = ?, name = ?, location = ?, initial_reading = ?
    WHERE id = ?
  `);

  stmt.run(
    (meterNumber || '').toUpperCase(),
    meterLabel || null,
    name,
    location || '',
    parseFloat(initialReading) || 0.0,
    meterId
  );

  const updatedMeter = db.prepare('SELECT * FROM meters WHERE id = ?').get(meterId);
  res.json({ success: true, meter: updatedMeter, message: 'Meter updated successfully' });
});

// Delete meter
router.delete('/:id', (req, res) => {
  const meterId = req.params.id;
  db.prepare('DELETE FROM meters WHERE id = ?').run(meterId);
  res.json({ success: true, message: 'Meter deleted successfully' });
});

module.exports = router;
