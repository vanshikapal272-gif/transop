const express = require('express');
const db = require('../config/db');
const router = express.Router();

// GET /api/trips
router.get('/', (req, res) => {
  try {
    const { status, search } = req.query;
    let sql = `
      SELECT t.*, v.registration_number as vehicle_reg, v.name as vehicle_name, v.max_load_capacity,
             d.name as driver_name, d.license_number as driver_license
      FROM trips t
      JOIN vehicles v ON t.vehicle_id = v.id
      JOIN drivers d ON t.driver_id = d.id
      WHERE 1=1
    `;
    const params = [];
    if (status) { sql += ' AND t.status = ?'; params.push(status); }
    if (search) { sql += ' AND (t.source LIKE ? OR t.destination LIKE ? OR v.registration_number LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    sql += ' ORDER BY t.created_at DESC';

    const trips = db.prepare(sql).all(...params);
    res.json({ trips });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/trips/:id
router.get('/:id', (req, res) => {
  try {
    const trip = db.prepare(`
      SELECT t.*, v.registration_number as vehicle_reg, v.name as vehicle_name, v.max_load_capacity,
             d.name as driver_name, d.license_number as driver_license
      FROM trips t
      JOIN vehicles v ON t.vehicle_id = v.id
      JOIN drivers d ON t.driver_id = d.id
      WHERE t.id = ?
    `).get(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    res.json({ trip });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/trips — create a draft trip
router.post('/', (req, res) => {
  try {
    const { source, destination, vehicle_id, driver_id, cargo_weight, planned_distance } = req.body;
    if (!source || !destination) {
      return res.status(400).json({ error: 'Source and destination are required' });
    }

    // Business Rule: Cargo weight must be positive if provided
    if (cargo_weight !== undefined && cargo_weight !== null && cargo_weight <= 0) {
      return res.status(400).json({ error: 'Cargo weight must be a positive number' });
    }

    // If vehicle and driver are provided, validate them (for immediate draft with assignment)
    if (vehicle_id) {
      const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicle_id);
      if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
      if (vehicle.status !== 'Available') {
        return res.status(400).json({ error: `Vehicle is currently ${vehicle.status}. Only Available vehicles can be assigned.` });
      }

      // Business Rule: Cargo weight must not exceed max load
      if (cargo_weight && cargo_weight > vehicle.max_load_capacity) {
        return res.status(400).json({ error: `Cargo weight (${cargo_weight} kg) exceeds vehicle capacity (${vehicle.max_load_capacity} kg)` });
      }
    }

    if (driver_id) {
      const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(driver_id);
      if (!driver) return res.status(404).json({ error: 'Driver not found' });
      if (driver.status !== 'Available') {
        return res.status(400).json({ error: `Driver is currently ${driver.status}. Only Available drivers can be assigned.` });
      }
      if (new Date(driver.license_expiry) < new Date()) {
        return res.status(400).json({ error: `Driver's license expired on ${driver.license_expiry}` });
      }
    }

    const result = db.prepare(`
      INSERT INTO trips (source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, status)
      VALUES (?, ?, ?, ?, ?, ?, 'Draft')
    `).run(source, destination, vehicle_id || null, driver_id || null, cargo_weight || 0, planned_distance || 0);

    const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ trip });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/trips/:id/dispatch — Draft → Dispatched
router.put('/:id/dispatch', (req, res) => {
  try {
    const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (trip.status !== 'Draft') return res.status(400).json({ error: 'Only Draft trips can be dispatched' });

    // Business Rule: vehicle and driver must be assigned before dispatch
    if (!trip.vehicle_id || !trip.driver_id) {
      return res.status(400).json({ error: 'Vehicle and driver must be assigned before dispatching' });
    }

    // Re-validate vehicle and driver availability
    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(trip.vehicle_id);
    if (!vehicle || vehicle.status !== 'Available') {
      return res.status(400).json({ error: `Vehicle is ${vehicle ? vehicle.status : 'not found'}, cannot dispatch` });
    }

    const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(trip.driver_id);
    if (!driver || driver.status !== 'Available') {
      return res.status(400).json({ error: `Driver is ${driver ? driver.status : 'not found'}, cannot dispatch` });
    }
    if (new Date(driver.license_expiry) < new Date()) {
      return res.status(400).json({ error: 'Driver license has expired' });
    }

    // Transaction: update trip + vehicle + driver
    const dispatch = db.transaction(() => {
      db.prepare("UPDATE trips SET status = 'Dispatched', started_at = datetime('now') WHERE id = ?").run(req.params.id);
      db.prepare("UPDATE vehicles SET status = 'On Trip' WHERE id = ?").run(trip.vehicle_id);
      db.prepare("UPDATE drivers SET status = 'On Trip' WHERE id = ?").run(trip.driver_id);
    });
    dispatch();

    const updated = db.prepare(`
      SELECT t.*, v.registration_number as vehicle_reg, v.name as vehicle_name,
             d.name as driver_name
      FROM trips t
      JOIN vehicles v ON t.vehicle_id = v.id
      JOIN drivers d ON t.driver_id = d.id
      WHERE t.id = ?
    `).get(req.params.id);
    res.json({ trip: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/trips/:id/complete — Dispatched → Completed
router.put('/:id/complete', (req, res) => {
  try {
    const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (trip.status !== 'Dispatched') return res.status(400).json({ error: 'Only Dispatched trips can be completed' });

    const { actual_distance, fuel_consumed } = req.body;

    const complete = db.transaction(() => {
      db.prepare(`
        UPDATE trips SET 
          status = 'Completed', 
          completed_at = datetime('now'),
          actual_distance = COALESCE(?, planned_distance),
          fuel_consumed = ?
        WHERE id = ?
      `).run(actual_distance || trip.planned_distance, fuel_consumed || null, req.params.id);

      db.prepare("UPDATE vehicles SET status = 'Available', odometer = odometer + COALESCE(?, 0) WHERE id = ?")
        .run(actual_distance || trip.planned_distance, trip.vehicle_id);
      db.prepare("UPDATE drivers SET status = 'Available' WHERE id = ?").run(trip.driver_id);

      // Auto-create fuel log if fuel consumed provided
      if (fuel_consumed && fuel_consumed > 0) {
        const fuelCost = fuel_consumed * 105; // ~₹105/liter average
        db.prepare(`
          INSERT INTO fuel_logs (vehicle_id, trip_id, liters, cost, date)
          VALUES (?, ?, ?, ?, date('now'))
        `).run(trip.vehicle_id, trip.id, fuel_consumed, fuelCost);
      }
    });
    complete();

    const updated = db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.id);
    res.json({ trip: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/trips/:id/cancel — Dispatched → Cancelled
router.put('/:id/cancel', (req, res) => {
  try {
    const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (trip.status !== 'Draft' && trip.status !== 'Dispatched') {
      return res.status(400).json({ error: 'Only Draft or Dispatched trips can be cancelled' });
    }

    const cancel = db.transaction(() => {
      db.prepare("UPDATE trips SET status = 'Cancelled' WHERE id = ?").run(req.params.id);
      if (trip.status === 'Dispatched') {
        db.prepare("UPDATE vehicles SET status = 'Available' WHERE id = ?").run(trip.vehicle_id);
        db.prepare("UPDATE drivers SET status = 'Available' WHERE id = ?").run(trip.driver_id);
      }
    });
    cancel();

    res.json({ message: 'Trip cancelled', trip: db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.id) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
