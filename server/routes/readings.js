const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const db = require('../db');
const { processMeterImage } = require('../ocr');

// Configure SMTP transporter using GroupFund hostinger SMTP credentials
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'hi@groupfund.eu',
    pass: process.env.SMTP_PASSWORD || 'Uinamui9!'
  }
});

// Configure multer storage for uploaded images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, 'meter-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });

// Single OCR route
router.post('/ocr', upload.single('meterImage'), async (req, res) => {
  try {
    let imagePath = null;
    let relativeUrl = null;

    if (req.file) {
      imagePath = req.file.path;
      relativeUrl = '/uploads/' + req.file.filename;
    } else {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ error: 'Image file not found' });
    }

    const customApiKey = req.headers['x-gemini-api-key'] || req.body.geminiApiKey;
    if (customApiKey) {
      process.env.GEMINI_API_KEY = customApiKey;
    }

    const ocrResult = await processMeterImage(imagePath);

    // Auto-lookup meter by handwritten label or serial number
    let matchedMeter = null;
    if (ocrResult.handwrittenLabel) {
      matchedMeter = db.prepare('SELECT * FROM meters WHERE meter_label = ? OR meter_number LIKE ?').get(ocrResult.handwrittenLabel, `%${ocrResult.handwrittenLabel}%`);
    }
    if (!matchedMeter && ocrResult.detectedMeterNumber) {
      matchedMeter = db.prepare('SELECT * FROM meters WHERE meter_number = ?').get(ocrResult.detectedMeterNumber);
    }

    res.json({
      success: true,
      imagePath: relativeUrl,
      ocr: ocrResult,
      matchedMeter
    });
  } catch (err) {
    console.error('Gemini Vision Endpoint error:', err);
    res.status(500).json({ error: 'Gemini image recognition failed: ' + err.message });
  }
});

// Batch OCR Endpoint
router.post('/batch-ocr', upload.array('meterImages', 20), async (req, res) => {
  try {
    const itemsToProcess = [];

    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        itemsToProcess.push({
          path: file.path,
          relativeUrl: '/uploads/' + file.filename
        });
      });
    } else {
      return res.status(400).json({ error: 'No files provided for batch processing' });
    }

    const propertyId = req.body.propertyId;
    const customApiKey = req.headers['x-gemini-api-key'] || req.body.geminiApiKey;
    if (customApiKey) {
      process.env.GEMINI_API_KEY = customApiKey;
    }

    const propertyMeters = propertyId 
      ? db.prepare('SELECT * FROM meters WHERE property_id = ?').all(propertyId)
      : db.prepare('SELECT * FROM meters').all();

    console.log(`Starting Batch OCR for ${itemsToProcess.length} images...`);

    const results = [];
    for (const item of itemsToProcess) {
      if (fs.existsSync(item.path)) {
        const ocr = await processMeterImage(item.path);

        let matchedMeter = null;
        if (ocr.handwrittenLabel) {
          matchedMeter = propertyMeters.find(m => String(m.meter_label) === String(ocr.handwrittenLabel));
        }

        if (!matchedMeter && ocr.detectedMeterNumber) {
          matchedMeter = propertyMeters.find(m => m.meter_number.toUpperCase() === ocr.detectedMeterNumber.toUpperCase());
        }

        results.push({
          imagePath: item.relativeUrl,
          ocr,
          matchedMeter: matchedMeter || null
        });
      }
    }

    res.json({
      success: true,
      processedCount: results.length,
      results
    });

  } catch (err) {
    console.error('Batch OCR Endpoint error:', err);
    res.status(500).json({ error: 'Batch OCR processing failed: ' + err.message });
  }
});

// Submit/Save single meter reading without auto email
router.post('/', (req, res) => {
  const userId = req.headers['x-user-id'];
  const { meterId, readingValue, imagePath, ocrRawText, ocrConfidence, notes } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'User ID missing' });
  }

  if (!meterId || readingValue === undefined || readingValue === null) {
    return res.status(400).json({ error: 'Meter ID and reading value are required' });
  }

  const numericReading = parseFloat(readingValue);
  if (isNaN(numericReading)) {
    return res.status(400).json({ error: 'Invalid numeric reading value' });
  }

  const meter = db.prepare('SELECT * FROM meters WHERE id = ?').get(meterId);
  if (!meter) {
    return res.status(404).json({ error: 'Meter not found' });
  }

  const lastReading = db.prepare('SELECT reading_value FROM meter_readings WHERE meter_id = ? ORDER BY created_at DESC LIMIT 1').get(meterId);
  const previousValue = lastReading ? lastReading.reading_value : meter.initial_reading;
  const consumption = Math.max(0, parseFloat((numericReading - previousValue).toFixed(2)));

  const stmt = db.prepare(`
    INSERT INTO meter_readings (meter_id, user_id, reading_value, consumption, image_path, ocr_raw_text, ocr_confidence, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    meterId,
    userId,
    numericReading,
    consumption,
    imagePath || '',
    ocrRawText || '',
    ocrConfidence || 0,
    notes || ''
  );

  const savedReading = db.prepare('SELECT * FROM meter_readings WHERE id = ?').get(info.lastInsertRowid);

  res.json({
    success: true,
    reading: savedReading,
    message: `Reading ${numericReading} m³ saved successfully.`
  });
});

// Submit Batch Readings without auto email
router.post('/batch-submit', (req, res) => {
  const userId = req.headers['x-user-id'];
  const { readings } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'User ID missing' });
  }

  if (!Array.isArray(readings) || readings.length === 0) {
    return res.status(400).json({ error: 'Readings array is required' });
  }

  const insertStmt = db.prepare(`
    INSERT INTO meter_readings (meter_id, user_id, reading_value, consumption, image_path, ocr_raw_text, ocr_confidence, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let savedCount = 0;

  db.transaction(() => {
    readings.forEach(item => {
      if (item.meterId && item.readingValue !== undefined && item.readingValue !== null) {
        const meter = db.prepare('SELECT * FROM meters WHERE id = ?').get(item.meterId);
        if (meter) {
          const lastReading = db.prepare('SELECT reading_value FROM meter_readings WHERE meter_id = ? ORDER BY created_at DESC LIMIT 1').get(item.meterId);
          const previousValue = lastReading ? lastReading.reading_value : meter.initial_reading;
          const consumption = Math.max(0, parseFloat((item.readingValue - previousValue).toFixed(2)));

          insertStmt.run(
            item.meterId,
            userId,
            parseFloat(item.readingValue),
            consumption,
            item.imagePath || '',
            item.ocrRawText || '',
            item.ocrConfidence || 0,
            item.notes || 'Batch Upload'
          );
          savedCount++;
        }
      }
    });
  })();

  res.json({
    success: true,
    savedCount,
    message: `Batch submission complete! Saved ${savedCount} meter readings.`
  });
});

// Consolidated Owner Report Endpoint (Manual trigger by tenant for all changed meters)
router.post('/notify-owner', async (req, res) => {
  const userId = req.headers['x-user-id'];

  if (!userId) {
    return res.status(401).json({ error: 'User ID missing' });
  }

  // Find unnotified readings or recent readings for this tenant
  const unnotifiedReadings = db.prepare(`
    SELECT mr.*, m.name as meter_name, m.meter_number, m.meter_label, m.initial_reading,
           p.id as property_id, p.name as property_name, p.address as property_address,
           owner.name as owner_name, owner.email as owner_email,
           tenant.name as tenant_name, tenant.email as tenant_email
    FROM meter_readings mr
    JOIN meters m ON mr.meter_id = m.id
    JOIN properties p ON m.property_id = p.id
    JOIN users owner ON p.owner_id = owner.id
    JOIN users tenant ON mr.user_id = tenant.id
    WHERE mr.user_id = ? AND mr.notified_at IS NULL
    ORDER BY mr.created_at ASC
  `).all(userId);

  if (unnotifiedReadings.length === 0) {
    return res.status(400).json({ error: 'No new meter reading updates to send. All readings have already been sent to property owner.' });
  }

  const first = unnotifiedReadings[0];
  const appUrl = 'https://aquameter.deploynext.com';

  // Group readings per meter to calculate previous reading and total consumption
  const meterSummaries = unnotifiedReadings.map(r => {
    const prevReading = db.prepare(`
      SELECT reading_value, created_at
      FROM meter_readings
      WHERE meter_id = ? AND id < ?
      ORDER BY created_at DESC
      LIMIT 1
    `).get(r.meter_id, r.id);

    const prevValue = prevReading ? prevReading.reading_value : r.initial_reading;
    const prevDate = prevReading ? new Date(prevReading.created_at).toLocaleDateString() : 'Baseline';
    const currDate = new Date(r.created_at).toLocaleDateString();

    return {
      meterName: r.meter_name,
      meterTag: r.meter_label ? `Tag #${r.meter_label}` : r.meter_number,
      prevValue,
      prevDate,
      currValue: r.reading_value,
      currDate,
      consumption: r.consumption
    };
  });

  const totalNetConsumption = meterSummaries.reduce((sum, item) => sum + item.consumption, 0).toFixed(2);

  const emailSubject = `[AquaTrack] Complete Monthly Water Reading Summary (${meterSummaries.length} meters) - ${first.property_name}`;

  // Plain Text Version
  let textTable = meterSummaries.map((m, idx) => 
    `${idx + 1}. ${m.meterName} (${m.meterTag})\n   Previous: ${m.prevValue} m³ (${m.prevDate})\n   New:      ${m.currValue} m³ (${m.currDate})\n   Usage:    +${m.consumption} m³`
  ).join('\n\n');

  const textContent = `Hello ${first.owner_name},

Tenant ${first.tenant_name} (${first.tenant_email}) has submitted a complete water meter reading update for ${first.property_name}.

SUMMARY OF ALL METER READINGS (${meterSummaries.length} METERS):
------------------------------------------------------------
Property: ${first.property_name} (${first.property_address})

${textTable}

------------------------------------------------------------
Total Combined Monthly Consumption: +${totalNetConsumption} m³

View photos & full audit history online:
${appUrl}

Best regards,
AquaTrack Water Management System`;

  // HTML Table Version
  let htmlTableRows = meterSummaries.map(m => `
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
      <td style="padding: 10px 12px; font-weight: bold; color: #ffffff;">${m.meterName} <div style="font-size: 0.78rem; color: #38bdf8; font-weight: normal;">${m.meterTag}</div></td>
      <td style="padding: 10px 12px; color: #cbd5e1;">${m.prevValue} m³ <div style="font-size: 0.72rem; color: #64748b;">${m.prevDate}</div></td>
      <td style="padding: 10px 12px; font-weight: bold; color: #38bdf8;">${m.currValue} m³ <div style="font-size: 0.72rem; color: #94a3b8;">${m.currDate}</div></td>
      <td style="padding: 10px 12px; font-weight: bold; color: #4ade80;">+${m.consumption} m³</td>
    </tr>
  `).join('');

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px; max-width: 680px; margin: 0 auto;">
      <h2 style="color: #38bdf8; margin-top: 0; display: flex; align-items: center; gap: 8px;">
        💧 AquaTrack Monthly Water Meter Report
      </h2>
      <p style="font-size: 1rem; color: #e2e8f0;">Hello <strong>${first.owner_name}</strong>,</p>
      <p style="font-size: 0.95rem; color: #cbd5e1;">
        Tenant <strong>${first.tenant_name}</strong> (<code>${first.tenant_email}</code>) has submitted a complete monthly reading report for <strong>${first.property_name}</strong> (${first.property_address}).
      </p>

      <div style="margin: 20px 0; background: rgba(255,255,255,0.03); border: 1px solid rgba(56,189,248,0.2); border-radius: 10px; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem;">
          <thead>
            <tr style="background: rgba(14, 165, 233, 0.15); color: #38bdf8;">
              <th style="padding: 10px 12px;">Meter</th>
              <th style="padding: 10px 12px;">Previous</th>
              <th style="padding: 10px 12px;">New Reading</th>
              <th style="padding: 10px 12px;">Net Usage</th>
            </tr>
          </thead>
          <tbody>
            ${htmlTableRows}
          </tbody>
        </table>
      </div>

      <div style="background: rgba(34, 197, 94, 0.12); border: 1px solid rgba(34, 197, 94, 0.3); padding: 14px; border-radius: 8px; font-size: 1.05rem; font-weight: bold; color: #4ade80; display: flex; justify-content: space-between; align-items: center;">
        <span>Total Combined Water Consumption:</span>
        <span style="font-size: 1.3rem;">+${totalNetConsumption} m³</span>
      </div>

      <p style="margin-top: 24px;">
        <a href="${appUrl}" style="background-color: #0ea5e9; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 0.95rem;">
          Open AquaTrack & View Submitted Photos
        </a>
      </p>

      <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 24px 0;" />
      <p style="font-size: 0.78rem; color: #64748b; margin: 0;">
        Sent automatically by AquaTrack Water Management System
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'AquaTrack Water Meters'}" <${process.env.SMTP_FROM_EMAIL || 'hi@groupfund.eu'}>`,
      to: first.owner_email,
      subject: emailSubject,
      text: textContent,
      html: htmlContent
    });

    // Mark all unnotified readings as notified
    const readingIds = unnotifiedReadings.map(r => r.id);
    const placeholders = readingIds.map(() => '?').join(',');
    db.prepare(`UPDATE meter_readings SET notified_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`).run(...readingIds);

    console.log(`✅ [CONSOLIDATED REPORT SENT TO OWNER] ${readingIds.length} meters sent to ${first.owner_email}`);

    res.json({
      success: true,
      count: readingIds.length,
      ownerEmail: first.owner_email,
      ownerName: first.owner_name,
      message: `Monthly report for ${readingIds.length} meter(s) sent successfully to property owner (${first.owner_email})!`
    });
  } catch (err) {
    console.error('Failed to send owner summary report:', err);
    res.status(500).json({ error: 'Failed to send email to property owner: ' + err.message });
  }
});

// Analytics Endpoint
router.get('/analytics', (req, res) => {
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];

  if (!userId) {
    return res.status(401).json({ error: 'User ID missing' });
  }

  let totalProperties = 0;
  let totalMeters = 0;
  let totalConsumption = 0;
  let unnotifiedCount = 0;
  let recentReadings = [];

  if (userRole === 'owner') {
    totalProperties = db.prepare('SELECT COUNT(*) as count FROM properties WHERE owner_id = ?').get(userId).count;
    totalMeters = db.prepare('SELECT COUNT(*) as count FROM meters m JOIN properties p ON m.property_id = p.id WHERE p.owner_id = ?').get(userId).count;
    
    const cons = db.prepare('SELECT SUM(mr.consumption) as total FROM meter_readings mr JOIN meters m ON mr.meter_id = m.id JOIN properties p ON m.property_id = p.id WHERE p.owner_id = ?').get(userId).total;
    totalConsumption = cons || 0;

    recentReadings = db.prepare(`
      SELECT mr.*, m.name as meter_name, m.meter_number, m.meter_label, p.name as property_name, u.name as user_name
      FROM meter_readings mr
      JOIN meters m ON mr.meter_id = m.id
      JOIN properties p ON m.property_id = p.id
      JOIN users u ON mr.user_id = u.id
      WHERE p.owner_id = ?
      ORDER BY mr.created_at DESC
      LIMIT 15
    `).all(userId);
  } else {
    totalProperties = db.prepare('SELECT COUNT(*) as count FROM property_assignments WHERE user_id = ?').get(userId).count;
    totalMeters = db.prepare('SELECT COUNT(*) as count FROM meters m JOIN property_assignments pa ON m.property_id = pa.property_id WHERE pa.user_id = ?').get(userId).count;
    
    const cons = db.prepare('SELECT SUM(mr.consumption) as total FROM meter_readings mr WHERE mr.user_id = ?').get(userId).total;
    totalConsumption = cons || 0;

    unnotifiedCount = db.prepare('SELECT COUNT(*) as count FROM meter_readings WHERE user_id = ? AND notified_at IS NULL').get(userId).count;

    recentReadings = db.prepare(`
      SELECT mr.*, m.name as meter_name, m.meter_number, m.meter_label, p.name as property_name, u.name as user_name
      FROM meter_readings mr
      JOIN meters m ON mr.meter_id = m.id
      JOIN properties p ON m.property_id = p.id
      JOIN users u ON mr.user_id = u.id
      WHERE mr.user_id = ?
      ORDER BY mr.created_at DESC
      LIMIT 15
    `).all(userId);
  }

  res.json({
    totalProperties,
    totalMeters,
    totalConsumption: parseFloat(totalConsumption.toFixed(2)),
    unnotifiedCount,
    recentReadings
  });
});

module.exports = router;
