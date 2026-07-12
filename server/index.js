const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const authenticate = require('./middleware/auth');
const rbac = require('./middleware/rbac');

// Initialize DB (creates tables)
require('./config/db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Public routes
app.use('/api/auth', require('./routes/auth'));

// RBAC helper: all roles can GET, only listed roles can write (POST/PUT/DELETE)
function rbacWrite(...writeRoles) {
  return (req, res, next) => {
    if (req.method === 'GET') return next();
    return rbac(...writeRoles)(req, res, next);
  };
}

// Protected routes — RBAC permission matrix:
// Fleet Manager: full access to vehicles, drivers, maintenance
// Dispatcher: trips (create, dispatch, complete, cancel)
// Financial Analyst: fuel logs, expenses
// Safety Officer: read-only access everywhere
app.use('/api/vehicles', authenticate, rbacWrite('Fleet Manager'), require('./routes/vehicles'));
app.use('/api/drivers', authenticate, rbacWrite('Fleet Manager'), require('./routes/drivers'));
app.use('/api/trips', authenticate, rbacWrite('Fleet Manager', 'Dispatcher'), require('./routes/trips'));
app.use('/api/maintenance', authenticate, rbacWrite('Fleet Manager'), require('./routes/maintenance'));
app.use('/api/fuel', authenticate, rbacWrite('Fleet Manager', 'Financial Analyst'), require('./routes/fuel'));
app.use('/api/expenses', authenticate, rbacWrite('Fleet Manager', 'Financial Analyst'), require('./routes/expenses'));
app.use('/api/analytics', authenticate, require('./routes/analytics'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`🚀 TransitOps API running on http://localhost:${PORT}`);
});
