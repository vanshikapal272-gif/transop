const express = require('express');
const db = require('../config/db');
const router = express.Router();

// GET /api/drivers — list all with filters
router.get('/', (req, res) => {
  try {
    const { status, search, license_warning } = req.query;
    let sql = 'SELECT * FROM drivers WHERE 1=1';
    const params = [];

    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (search) { sql += ' AND (name LIKE ? OR license_number LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (license_warning === 'true') {
      sql += " AND license_expiry <= date('now', '+30 days')";
    }

    sql += ' ORDER BY created_at DESC';
    const drivers = db.prepare(sql).all(...params);

    const enriched = drivers.map(d => ({
      ...d,
      license_expired: new Date(d.license_expiry) < new Date(),
      license_expiring_soon: new Date(d.license_expiry) < new Date(Date.now() + 30 * 86400000) && new Date(d.license_expiry) >= new Date(),
    }));

    res.json({ drivers: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/drivers/available — only available for dispatch
router.get('/available', (req, res) => {
  try {
    const drivers = db.prepare(`
      SELECT * FROM drivers 
      WHERE status = 'Available' 
        AND license_expiry > date('now')
    `).all();
    res.json({ drivers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/drivers/:id
router.get('/:id', (req, res) => {
  try {
    const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(req.params.id);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    res.json({ driver });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/drivers
router.post('/', (req, res) => {
  try {
    const { name, license_number, license_category, license_expiry, contact_number, safety_score } = req.body;
    if (!name || !license_number || !license_category || !license_expiry || !contact_number) {
      return res.status(400).json({ error: 'Name, license number, category, expiry, and contact are required' });
    }

    const existing = db.prepare('SELECT id FROM drivers WHERE license_number = ?').get(license_number);
    if (existing) return res.status(409).json({ error: 'License number already exists' });

    const result = db.prepare(`
      INSERT INTO drivers (name, license_number, license_category, license_expiry, contact_number, safety_score)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, license_number, license_category, license_expiry, contact_number, safety_score || 80);

    const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ driver });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/drivers/:id
router.put('/:id', (req, res) => {
  try {
    const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(req.params.id);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });

    const { name, license_number, license_category, license_expiry, contact_number, safety_score, status } = req.body;

    if (license_number && license_number !== driver.license_number) {
      const dup = db.prepare('SELECT id FROM drivers WHERE license_number = ? AND id != ?').get(license_number, req.params.id);
      if (dup) return res.status(409).json({ error: 'License number already exists' });
    }

    db.prepare(`
      UPDATE drivers SET
        name = COALESCE(?, name),
        license_number = COALESCE(?, license_number),
        license_category = COALESCE(?, license_category),
        license_expiry = COALESCE(?, license_expiry),
        contact_number = COALESCE(?, contact_number),
        safety_score = COALESCE(?, safety_score),
        status = COALESCE(?, status)
      WHERE id = ?
    `).run(name, license_number, license_category, license_expiry, contact_number, safety_score, status, req.params.id);

    const updated = db.prepare('SELECT * FROM drivers WHERE id = ?').get(req.params.id);
    res.json({ driver: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/drivers/:id/suspend
router.put('/:id/suspend', (req, res) => {
  try {
    const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(req.params.id);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    if (driver.status === 'On Trip') return res.status(400).json({ error: 'Cannot suspend a driver on a trip' });

    db.prepare("UPDATE drivers SET status = 'Suspended' WHERE id = ?").run(req.params.id);
    res.json({ message: 'Driver suspended' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
