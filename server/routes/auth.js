const express = require('express');
const router = express.Router();
const db = require('../db');

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.prepare('SELECT id, name, email, role FROM users WHERE email = ? AND password = ?').get(email, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  res.json({ success: true, user });
});

// Register
router.post('/register', (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, and role are required' });
  }

  if (!['owner', 'user'].includes(role)) {
    return res.status(400).json({ error: 'Role must be either "owner" or "user"' });
  }

  try {
    const stmt = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
    const result = stmt.run(name, email, password, role);
    const newUser = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(result.lastInsertRowid);
    
    res.json({ success: true, user: newUser });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Email is already registered' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Get all users (for owner assignment selector)
router.get('/tenants', (req, res) => {
  const users = db.prepare("SELECT id, name, email, role FROM users WHERE role = 'user' ORDER BY name ASC").all();
  res.json(users);
});

// Get current user info by ID
router.get('/me', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User ID header missing' });
  }

  const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(user);
});

module.exports = router;
