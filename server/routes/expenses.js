const express = require('express');
const db = require('../config/db');
const router = express.Router();

// GET /api/expenses
router.get('/', (req, res) => {
  try {
    const { vehicle_id, category } = req.query;
    let sql = `
      SELECT e.*, v.registration_number as vehicle_reg, v.name as vehicle_name
      FROM expenses e
      JOIN vehicles v ON e.vehicle_id = v.id
      WHERE 1=1
    `;
    const params = [];
    if (vehicle_id) { sql += ' AND e.vehicle_id = ?'; params.push(vehicle_id); }
    if (category) { sql += ' AND e.category = ?'; params.push(category); }
    sql += ' ORDER BY e.date DESC';

    const expenses = db.prepare(sql).all(...params);
    res.json({ expenses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/expenses
router.post('/', (req, res) => {
  try {
    const { vehicle_id, category, amount, date, description } = req.body;
    if (!vehicle_id || !category || !amount || !date) {
      return res.status(400).json({ error: 'Vehicle, category, amount, and date are required' });
    }

    // Business Rule: amount must be positive
    if (amount <= 0) return res.status(400).json({ error: 'Amount must be a positive number' });

    const result = db.prepare(`
      INSERT INTO expenses (vehicle_id, category, amount, date, description) VALUES (?, ?, ?, ?, ?)
    `).run(vehicle_id, category, amount, date, description || '');

    const expense = db.prepare(`
      SELECT e.*, v.registration_number as vehicle_reg
      FROM expenses e JOIN vehicles v ON e.vehicle_id = v.id WHERE e.id = ?
    `).get(result.lastInsertRowid);
    res.status(201).json({ expense });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id);
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
