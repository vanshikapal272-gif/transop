const path = require('path');
const Database = require('better-sqlite3');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const fs = require('fs');
const dbDir = path.dirname(path.resolve(__dirname, '../../', process.env.DB_PATH || './data/transitops.db'));
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.resolve(__dirname, '../../', process.env.DB_PATH || './data/transitops.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Schema Creation ──────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('Fleet Manager','Dispatcher','Safety Officer','Financial Analyst')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    registration_number TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('Van','Truck','Bus','Sedan')),
    max_load_capacity REAL NOT NULL CHECK(max_load_capacity >= 0),
    odometer REAL NOT NULL DEFAULT 0,
    acquisition_cost REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Available' CHECK(status IN ('Available','On Trip','In Shop','Retired')),
    region TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS drivers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    license_number TEXT NOT NULL UNIQUE,
    license_category TEXT NOT NULL,
    license_expiry TEXT NOT NULL,
    contact_number TEXT NOT NULL,
    safety_score INTEGER NOT NULL DEFAULT 80 CHECK(safety_score >= 0 AND safety_score <= 100),
    status TEXT NOT NULL DEFAULT 'Available' CHECK(status IN ('Available','On Trip','Off Duty','Suspended')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS trips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    destination TEXT NOT NULL,
    vehicle_id INTEGER,
    driver_id INTEGER,
    cargo_weight REAL,
    planned_distance REAL,
    actual_distance REAL,
    fuel_consumed REAL,
    status TEXT NOT NULL DEFAULT 'Draft' CHECK(status IN ('Draft','Dispatched','Completed','Cancelled')),
    started_at TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (driver_id) REFERENCES drivers(id)
  );

  CREATE TABLE IF NOT EXISTS maintenance_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    cost REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    closed_at TEXT,
    status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active','Closed')),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
  );

  CREATE TABLE IF NOT EXISTS fuel_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    trip_id INTEGER,
    liters REAL NOT NULL CHECK(liters > 0),
    cost REAL NOT NULL CHECK(cost > 0),
    date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (trip_id) REFERENCES trips(id)
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('Toll','Insurance','Repair','Other')),
    amount REAL NOT NULL CHECK(amount > 0),
    date TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
  );

  -- Indexes for performance
  CREATE INDEX IF NOT EXISTS idx_trips_vehicle ON trips(vehicle_id);
  CREATE INDEX IF NOT EXISTS idx_trips_driver ON trips(driver_id);
  CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
  CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle ON maintenance_logs(vehicle_id);
  CREATE INDEX IF NOT EXISTS idx_fuel_vehicle ON fuel_logs(vehicle_id);
  CREATE INDEX IF NOT EXISTS idx_fuel_trip ON fuel_logs(trip_id);
  CREATE INDEX IF NOT EXISTS idx_expenses_vehicle ON expenses(vehicle_id);
`);

module.exports = db;
