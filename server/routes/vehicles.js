const express = require('express');
const db = require('../config/db');
const router = express.Router();

// GET /api/vehicles — list all vehicles with filters
router.get('/', (req, res) => {
  try {
    const { type, status, region, search } = req.query;
    let sql = 'SELECT * FROM vehicles WHERE 1=1';
    const params = [];

    if (type) { sql += ' AND type = ?'; params.push(type); }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (region) { sql += ' AND region = ?'; params.push(region); }
    if (search) { sql += ' AND (registration_number LIKE ? OR name LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    sql += ' ORDER BY created_at DESC';
    const vehicles = db.prepare(sql).all(...params);

    // Compute total costs per vehicle
    const costStmt = db.prepare(`
      SELECT 
        COALESCE((SELECT SUM(cost) FROM fuel_logs WHERE vehicle_id = ?), 0) as fuel_cost,
        COALESCE((SELECT SUM(cost) FROM maintenance_logs WHERE vehicle_id = ?), 0) as maintenance_cost,
        COALESCE((SELECT SUM(amount) FROM expenses WHERE vehicle_id = ?), 0) as expense_cost
    `);

    const enriched = vehicles.map(v => {
      const costs = costStmt.get(v.id, v.id, v.id);
      return { ...v, total_cost: costs.fuel_cost + costs.maintenance_cost + costs.expense_cost, ...costs };
    });

    res.json({ vehicles: enriched });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vehicles', details: err.message });
  }
});

// GET /api/vehicles/available — only available for dispatch
router.get('/available', (req, res) => {
  try {
    const vehicles = db.prepare("SELECT * FROM vehicles WHERE status = 'Available'").all();
    res.json({ vehicles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/vehicles/:id
router.get('/:id', (req, res) => {
  try {
    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    res.json({ vehicle });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/vehicles
router.post('/', (req, res) => {
  try {
    const { registration_number: rawReg, name, type, max_load_capacity, odometer, acquisition_cost, region } = req.body;
    if (!rawReg || !name || !type || !max_load_capacity) {
      return res.status(400).json({ error: 'Registration number, name, type, and max load capacity are required' });
    }

    // Normalize to uppercase for case-insensitive uniqueness
    const registration_number = rawReg.toUpperCase().trim();

    const existing = db.prepare('SELECT id FROM vehicles WHERE UPPER(registration_number) = ?').get(registration_number);
    if (existing) {
      return res.status(409).json({ error: 'Registration number already exists' });
    }

    const result = db.prepare(`
      INSERT INTO vehicles (registration_number, name, type, max_load_capacity, odometer, acquisition_cost, region)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(registration_number, name, type, max_load_capacity, odometer || 0, acquisition_cost || 0, region || null);

    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ vehicle });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create vehicle', details: err.message });
  }
});

// PUT /api/vehicles/:id
router.put('/:id', (req, res) => {
  try {
    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    const { registration_number, name, type, max_load_capacity, odometer, acquisition_cost, status, region } = req.body;

    // Normalize registration on update
    const normalizedReg = registration_number ? registration_number.toUpperCase().trim() : null;
    if (normalizedReg && normalizedReg !== vehicle.registration_number) {
      const dup = db.prepare('SELECT id FROM vehicles WHERE UPPER(registration_number) = ? AND id != ?').get(normalizedReg, req.params.id);
      if (dup) return res.status(409).json({ error: 'Registration number already exists' });
    }

    db.prepare(`
      UPDATE vehicles SET 
        registration_number = COALESCE(?, registration_number),
        name = COALESCE(?, name),
        type = COALESCE(?, type),
        max_load_capacity = COALESCE(?, max_load_capacity),
        odometer = COALESCE(?, odometer),
        acquisition_cost = COALESCE(?, acquisition_cost),
        status = COALESCE(?, status),
        region = COALESCE(?, region)
      WHERE id = ?
    `).run(registration_number, name, type, max_load_capacity, odometer, acquisition_cost, status, region, req.params.id);

    const updated = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
    res.json({ vehicle: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/vehicles/:id — soft delete (retire)
router.delete('/:id', (req, res) => {
  try {
    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    if (vehicle.status === 'On Trip') return res.status(400).json({ error: 'Cannot retire a vehicle that is on a trip' });

    db.prepare("UPDATE vehicles SET status = 'Retired' WHERE id = ?").run(req.params.id);
    res.json({ message: 'Vehicle retired successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
