const express = require('express');
const db = require('../config/db');
const router = express.Router();

// GET /api/maintenance
router.get('/', (req, res) => {
  try {
    const { status, vehicle_id } = req.query;
    let sql = `
      SELECT m.*, v.registration_number as vehicle_reg, v.name as vehicle_name
      FROM maintenance_logs m
      JOIN vehicles v ON m.vehicle_id = v.id
      WHERE 1=1
    `;
    const params = [];
    if (status) { sql += ' AND m.status = ?'; params.push(status); }
    if (vehicle_id) { sql += ' AND m.vehicle_id = ?'; params.push(vehicle_id); }
    sql += ' ORDER BY m.created_at DESC';

    const logs = db.prepare(sql).all(...params);
    res.json({ maintenance: logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/maintenance — create record, auto set vehicle to In Shop
router.post('/', (req, res) => {
  try {
    const { vehicle_id, type, description, cost } = req.body;
    if (!vehicle_id || !type) return res.status(400).json({ error: 'Vehicle and maintenance type are required' });

    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicle_id);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    if (vehicle.status === 'On Trip') return res.status(400).json({ error: 'Vehicle is on a trip, cannot add maintenance' });

    const createMaintenance = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO maintenance_logs (vehicle_id, type, description, cost) VALUES (?, ?, ?, ?)
      `).run(vehicle_id, type, description || '', cost || 0);

      // Business Rule: auto-set vehicle to In Shop
      db.prepare("UPDATE vehicles SET status = 'In Shop' WHERE id = ?").run(vehicle_id);

      return result.lastInsertRowid;
    });

    const id = createMaintenance();
    const log = db.prepare(`
      SELECT m.*, v.registration_number as vehicle_reg, v.name as vehicle_name
      FROM maintenance_logs m JOIN vehicles v ON m.vehicle_id = v.id WHERE m.id = ?
    `).get(id);
    res.status(201).json({ maintenance: log });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/maintenance/:id/close — close maintenance, restore vehicle
router.put('/:id/close', (req, res) => {
  try {
    const log = db.prepare('SELECT * FROM maintenance_logs WHERE id = ?').get(req.params.id);
    if (!log) return res.status(404).json({ error: 'Maintenance record not found' });
    if (log.status === 'Closed') return res.status(400).json({ error: 'Already closed' });

    const { cost } = req.body;

    const closeMaintenance = db.transaction(() => {
      db.prepare(`
        UPDATE maintenance_logs SET status = 'Closed', closed_at = datetime('now'), cost = COALESCE(?, cost) WHERE id = ?
      `).run(cost, req.params.id);

      // Business Rule: restore vehicle to Available unless Retired
      const vehicle = db.prepare('SELECT status FROM vehicles WHERE id = ?').get(log.vehicle_id);
      if (vehicle && vehicle.status !== 'Retired') {
        // Check if there are other active maintenance records for this vehicle
        const otherActive = db.prepare("SELECT COUNT(*) as cnt FROM maintenance_logs WHERE vehicle_id = ? AND status = 'Active' AND id != ?")
          .get(log.vehicle_id, req.params.id);
        if (otherActive.cnt === 0) {
          db.prepare("UPDATE vehicles SET status = 'Available' WHERE id = ?").run(log.vehicle_id);
        }
      }
    });
    closeMaintenance();

    const updated = db.prepare(`
      SELECT m.*, v.registration_number as vehicle_reg, v.name as vehicle_name
      FROM maintenance_logs m JOIN vehicles v ON m.vehicle_id = v.id WHERE m.id = ?
    `).get(req.params.id);
    res.json({ maintenance: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
