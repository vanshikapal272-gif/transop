const express = require('express');
const db = require('../config/db');
const router = express.Router();

// GET /api/analytics/kpis — Dashboard KPIs
router.get('/kpis', (req, res) => {
  try {
    const totalVehicles = db.prepare('SELECT COUNT(*) as count FROM vehicles').get().count;
    const activeVehicles = db.prepare("SELECT COUNT(*) as count FROM vehicles WHERE status != 'Retired'").get().count;
    const availableVehicles = db.prepare("SELECT COUNT(*) as count FROM vehicles WHERE status = 'Available'").get().count;
    const onTripVehicles = db.prepare("SELECT COUNT(*) as count FROM vehicles WHERE status = 'On Trip'").get().count;
    const inShopVehicles = db.prepare("SELECT COUNT(*) as count FROM vehicles WHERE status = 'In Shop'").get().count;

    const totalDrivers = db.prepare('SELECT COUNT(*) as count FROM drivers').get().count;
    const onDutyDrivers = db.prepare("SELECT COUNT(*) as count FROM drivers WHERE status = 'On Trip'").get().count;
    const availableDrivers = db.prepare("SELECT COUNT(*) as count FROM drivers WHERE status = 'Available'").get().count;

    const activeTrips = db.prepare("SELECT COUNT(*) as count FROM trips WHERE status = 'Dispatched'").get().count;
    const pendingTrips = db.prepare("SELECT COUNT(*) as count FROM trips WHERE status = 'Draft'").get().count;
    const completedTrips = db.prepare("SELECT COUNT(*) as count FROM trips WHERE status = 'Completed'").get().count;
    const totalTrips = db.prepare('SELECT COUNT(*) as count FROM trips').get().count;

    const fleetUtilization = activeVehicles > 0 ? ((onTripVehicles / activeVehicles) * 100).toFixed(1) : 0;

    const totalFuelCost = db.prepare('SELECT COALESCE(SUM(cost), 0) as total FROM fuel_logs').get().total;
    const totalMaintenanceCost = db.prepare('SELECT COALESCE(SUM(cost), 0) as total FROM maintenance_logs').get().total;
    const totalExpenses = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM expenses').get().total;
    const totalOperationalCost = totalFuelCost + totalMaintenanceCost + totalExpenses;

    const expiringLicenses = db.prepare("SELECT COUNT(*) as count FROM drivers WHERE license_expiry <= date('now', '+30 days') AND license_expiry > date('now')").get().count;
    const expiredLicenses = db.prepare("SELECT COUNT(*) as count FROM drivers WHERE license_expiry <= date('now')").get().count;

    res.json({
      kpis: {
        totalVehicles, activeVehicles, availableVehicles, onTripVehicles, inShopVehicles,
        totalDrivers, onDutyDrivers, availableDrivers,
        activeTrips, pendingTrips, completedTrips, totalTrips,
        fleetUtilization: parseFloat(fleetUtilization),
        totalFuelCost, totalMaintenanceCost, totalExpenses, totalOperationalCost,
        expiringLicenses, expiredLicenses,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/fleet-utilization — utilization over time
router.get('/fleet-utilization', (req, res) => {
  try {
    const data = db.prepare(`
      SELECT 
        strftime('%Y-%m', started_at) as month,
        COUNT(*) as trips,
        COUNT(DISTINCT vehicle_id) as vehicles_used
      FROM trips
      WHERE started_at IS NOT NULL
      GROUP BY strftime('%Y-%m', started_at)
      ORDER BY month
    `).all();

    const totalVehicles = db.prepare("SELECT COUNT(*) as count FROM vehicles WHERE status != 'Retired'").get().count;
    const enriched = data.map(d => ({
      ...d,
      utilization: totalVehicles > 0 ? ((d.vehicles_used / totalVehicles) * 100).toFixed(1) : 0,
    }));

    res.json({ data: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/fuel-efficiency — per vehicle
router.get('/fuel-efficiency', (req, res) => {
  try {
    const data = db.prepare(`
      SELECT 
        v.id, v.registration_number, v.name, v.type,
        COALESCE(SUM(t.actual_distance), 0) as total_distance,
        COALESCE(SUM(t.fuel_consumed), 0) as total_fuel,
        CASE WHEN COALESCE(SUM(t.fuel_consumed), 0) > 0 
          THEN ROUND(COALESCE(SUM(t.actual_distance), 0) / SUM(t.fuel_consumed), 2) 
          ELSE 0 
        END as efficiency
      FROM vehicles v
      LEFT JOIN trips t ON v.id = t.vehicle_id AND t.status = 'Completed'
      GROUP BY v.id
      ORDER BY efficiency DESC
    `).all();
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/costs — cost breakdown
router.get('/costs', (req, res) => {
  try {
    const fuelByMonth = db.prepare(`
      SELECT strftime('%Y-%m', date) as month, SUM(cost) as total
      FROM fuel_logs GROUP BY month ORDER BY month
    `).all();

    const maintenanceByMonth = db.prepare(`
      SELECT strftime('%Y-%m', created_at) as month, SUM(cost) as total
      FROM maintenance_logs GROUP BY month ORDER BY month
    `).all();

    const expensesByCategory = db.prepare(`
      SELECT category, SUM(amount) as total FROM expenses GROUP BY category
    `).all();

    const costPerVehicle = db.prepare(`
      SELECT v.id, v.registration_number, v.name,
        COALESCE((SELECT SUM(cost) FROM fuel_logs WHERE vehicle_id = v.id), 0) as fuel,
        COALESCE((SELECT SUM(cost) FROM maintenance_logs WHERE vehicle_id = v.id), 0) as maintenance,
        COALESCE((SELECT SUM(amount) FROM expenses WHERE vehicle_id = v.id), 0) as expenses,
        v.acquisition_cost
      FROM vehicles v ORDER BY v.id
    `).all();

    res.json({ fuelByMonth, maintenanceByMonth, expensesByCategory, costPerVehicle });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/roi — Vehicle ROI
router.get('/roi', (req, res) => {
  try {
    const data = db.prepare(`
      SELECT v.id, v.registration_number, v.name, v.acquisition_cost,
        COALESCE((SELECT SUM(t.cargo_weight * 12) FROM trips t WHERE t.vehicle_id = v.id AND t.status = 'Completed'), 0) as revenue,
        COALESCE((SELECT SUM(cost) FROM fuel_logs WHERE vehicle_id = v.id), 0) as fuel_cost,
        COALESCE((SELECT SUM(cost) FROM maintenance_logs WHERE vehicle_id = v.id), 0) as maintenance_cost,
        COALESCE((SELECT SUM(amount) FROM expenses WHERE vehicle_id = v.id), 0) as expense_cost
      FROM vehicles v
      ORDER BY v.id
    `).all();

    const enriched = data.map(v => {
      const totalCost = v.fuel_cost + v.maintenance_cost + v.expense_cost;
      const roi = v.acquisition_cost > 0 ? (((v.revenue - totalCost) / v.acquisition_cost) * 100).toFixed(1) : 0;
      return { ...v, total_cost: totalCost, roi: parseFloat(roi) };
    });

    res.json({ data: enriched });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/alerts — dashboard alerts
router.get('/alerts', (req, res) => {
  try {
    const expiringDrivers = db.prepare(`
      SELECT id, name, license_expiry FROM drivers
      WHERE license_expiry <= date('now', '+30 days') ORDER BY license_expiry LIMIT 10
    `).all();

    const activeMaintenance = db.prepare(`
      SELECT m.id, v.registration_number, m.type, m.created_at
      FROM maintenance_logs m JOIN vehicles v ON m.vehicle_id = v.id
      WHERE m.status = 'Active' ORDER BY m.created_at LIMIT 10
    `).all();

    const recentTrips = db.prepare(`
      SELECT t.id, t.source, t.destination, t.status, t.created_at,
             v.registration_number as vehicle_reg, d.name as driver_name
      FROM trips t
      JOIN vehicles v ON t.vehicle_id = v.id
      JOIN drivers d ON t.driver_id = d.id
      ORDER BY t.created_at DESC LIMIT 10
    `).all();

    res.json({ expiringDrivers, activeMaintenance, recentTrips });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/export/csv
router.get('/export/csv', (req, res) => {
  try {
    const { Parser } = require('json2csv');
    const trips = db.prepare(`
      SELECT t.id, t.source, t.destination, t.cargo_weight, t.planned_distance, t.actual_distance,
             t.fuel_consumed, t.status, t.started_at, t.completed_at,
             v.registration_number as vehicle, d.name as driver
      FROM trips t
      JOIN vehicles v ON t.vehicle_id = v.id
      JOIN drivers d ON t.driver_id = d.id
      ORDER BY t.created_at DESC
    `).all();

    const parser = new Parser();
    const csv = parser.parse(trips);

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename=transitops_report.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
