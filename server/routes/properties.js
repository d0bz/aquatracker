const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper to find or create tenant by email
function getOrCreateTenantByEmail(emailStr) {
  const cleanEmail = emailStr.trim().toLowerCase();
  let user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(cleanEmail);

  if (!user) {
    // Automatically create a tenant account for this email
    const defaultName = cleanEmail.split('@')[0].replace('.', ' ').replace(/^./, str => str.toUpperCase());
    const stmt = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
    const info = stmt.run(defaultName, cleanEmail, 'password123', 'user');
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  }

  return user;
}

// Get properties (Role-based)
router.get('/', (req, res) => {
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];

  if (!userId) {
    return res.status(401).json({ error: 'User ID header missing' });
  }

  let properties = [];
  if (userRole === 'owner') {
    properties = db.prepare(`
      SELECT p.*, 
        (SELECT COUNT(*) FROM meters WHERE property_id = p.id) as meter_count,
        (SELECT COUNT(*) FROM property_assignments WHERE property_id = p.id) as user_count
      FROM properties p 
      WHERE p.owner_id = ?
      ORDER BY p.created_at DESC
    `).all(userId);
  } else {
    // Regular User/Tenant: return properties assigned to them
    properties = db.prepare(`
      SELECT p.*, u.name as owner_name,
        (SELECT COUNT(*) FROM meters WHERE property_id = p.id) as meter_count
      FROM properties p
      JOIN property_assignments pa ON pa.property_id = p.id
      JOIN users u ON p.owner_id = u.id
      WHERE pa.user_id = ?
      ORDER BY p.created_at DESC
    `).all(userId);
  }

  // Attach assigned users to each property
  const result = properties.map(prop => {
    const assignedUsers = db.prepare(`
      SELECT u.id, u.name, u.email 
      FROM users u
      JOIN property_assignments pa ON pa.user_id = u.id
      WHERE pa.property_id = ?
    `).all(prop.id);

    return { ...prop, assignedUsers };
  });

  res.json(result);
});

// Get single property details
router.get('/:id', (req, res) => {
  const propId = req.params.id;
  const property = db.prepare('SELECT p.*, u.name as owner_name FROM properties p JOIN users u ON p.owner_id = u.id WHERE p.id = ?').get(propId);

  if (!property) {
    return res.status(404).json({ error: 'Property not found' });
  }

  const assignedUsers = db.prepare(`
    SELECT u.id, u.name, u.email 
    FROM users u
    JOIN property_assignments pa ON pa.user_id = u.id
    WHERE pa.property_id = ?
  `).all(propId);

  const meters = db.prepare(`
    SELECT m.*,
      (SELECT reading_value FROM meter_readings WHERE meter_id = m.id ORDER BY created_at DESC LIMIT 1) as latest_reading,
      (SELECT created_at FROM meter_readings WHERE meter_id = m.id ORDER BY created_at DESC LIMIT 1) as last_updated
    FROM meters m
    WHERE m.property_id = ?
    ORDER BY m.id ASC
  `).all(propId);

  res.json({ ...property, assignedUsers, meters });
});

// Create property (Owner only) - accepts tenant email string
router.post('/', (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];
    const { name, address, notes, tenantEmail } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User ID header missing. Please log in.' });
    }

    if (userRole !== 'owner') {
      return res.status(403).json({ error: 'Only property owners can create properties' });
    }

    if (!name || !address) {
      return res.status(400).json({ error: 'Property Name and Address are required' });
    }

    // Verify owner exists in users table
    const ownerUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!ownerUser) {
      return res.status(401).json({ error: 'Owner user session invalid or expired. Please log out and register/login again.' });
    }

    const stmt = db.prepare('INSERT INTO properties (owner_id, name, address, notes) VALUES (?, ?, ?, ?)');
    const info = stmt.run(userId, name, address, notes || '');
    const newPropId = info.lastInsertRowid;

    // Assign tenant by email if provided
    if (tenantEmail && tenantEmail.trim().length > 0) {
      try {
        const tenant = getOrCreateTenantByEmail(tenantEmail);
        db.prepare('INSERT INTO property_assignments (property_id, user_id) VALUES (?, ?)').run(newPropId, tenant.id);
      } catch (e) {
        // ignore duplicates or assignment errors
      }
    }

    res.json({ success: true, id: newPropId, message: 'Property created successfully' });
  } catch (err) {
    console.error('Create property error:', err);
    res.status(500).json({ error: 'Failed to create property: ' + err.message });
  }
});

// Assign user to property by email or userId
router.post('/:id/assign', (req, res) => {
  const propId = req.params.id;
  const { email, userId } = req.body;

  if (!email && !userId) {
    return res.status(400).json({ error: 'Tenant email address is required' });
  }

  let targetUserId = userId;

  if (email) {
    const tenant = getOrCreateTenantByEmail(email);
    targetUserId = tenant.id;
  }

  try {
    const stmt = db.prepare('INSERT INTO property_assignments (property_id, user_id) VALUES (?, ?)');
    stmt.run(propId, targetUserId);
    res.json({ success: true, message: 'Tenant assigned to property successfully' });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Tenant is already assigned to this property' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Unassign user from property
router.delete('/:id/assign/:userId', (req, res) => {
  const { id: propId, userId } = req.params;
  const stmt = db.prepare('DELETE FROM property_assignments WHERE property_id = ? AND user_id = ?');
  stmt.run(propId, userId);
  res.json({ success: true, message: 'Tenant unassigned' });
});

// Delete property
router.delete('/:id', (req, res) => {
  const propId = req.params.id;
  db.prepare('DELETE FROM properties WHERE id = ?').run(propId);
  res.json({ success: true, message: 'Property deleted' });
});

module.exports = router;
