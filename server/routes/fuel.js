const express = require('express');
const db = require('../config/db');
const router = express.Router();

// GET /api/fuel
router.get('/', (req, res) => {
  try {
    const { vehicle_id } = req.query;
    let sql = `
      SELECT f.*, v.registration_number as vehicle_reg, v.name as vehicle_name
      FROM fuel_logs f
      JOIN vehicles v ON f.vehicle_id = v.id
      WHERE 1=1
    `;
    const params = [];
    if (vehicle_id) { sql += ' AND f.vehicle_id = ?'; params.push(vehicle_id); }
    sql += ' ORDER BY f.date DESC';

    const logs = db.prepare(sql).all(...params);
    res.json({ fuel_logs: logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/fuel
router.post('/', (req, res) => {
  try {
    const { vehicle_id, trip_id, liters, cost, date } = req.body;
    if (!vehicle_id || !liters || !cost || !date) {
      return res.status(400).json({ error: 'Vehicle, liters, cost, and date are required' });
    }

    // Business Rule: liters and cost must be positive
    if (liters <= 0) return res.status(400).json({ error: 'Liters must be a positive number' });
    if (cost <= 0) return res.status(400).json({ error: 'Cost must be a positive number' });

    const result = db.prepare(`
      INSERT INTO fuel_logs (vehicle_id, trip_id, liters, cost, date) VALUES (?, ?, ?, ?, ?)
    `).run(vehicle_id, trip_id || null, liters, cost, date);

    const log = db.prepare(`
      SELECT f.*, v.registration_number as vehicle_reg
      FROM fuel_logs f JOIN vehicles v ON f.vehicle_id = v.id WHERE f.id = ?
    `).get(result.lastInsertRowid);
    res.status(201).json({ fuel_log: log });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/fuel/:id
router.delete('/:id', (req, res) => {
  try {
    const log = db.prepare('SELECT * FROM fuel_logs WHERE id = ?').get(req.params.id);
    if (!log) return res.status(404).json({ error: 'Fuel log not found' });
    db.prepare('DELETE FROM fuel_logs WHERE id = ?').run(req.params.id);
    res.json({ message: 'Fuel log deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
