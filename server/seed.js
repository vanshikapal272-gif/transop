const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('./config/db');
const bcrypt = require('bcryptjs');

console.log('🌱 Seeding TransitOps database...');

// Clear existing data
db.exec(`
  DELETE FROM expenses; DELETE FROM fuel_logs; DELETE FROM maintenance_logs;
  DELETE FROM trips; DELETE FROM drivers; DELETE FROM vehicles; DELETE FROM users;
`);

const hash = bcrypt.hashSync('Transit@2026', 10);

// ── Users ──
const insertUser = db.prepare('INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)');
insertUser.run('fleet@transitops.in', hash, 'Ravi Kumar', 'Fleet Manager');
insertUser.run('dispatch@transitops.in', hash, 'Priya Sharma', 'Dispatcher');
insertUser.run('safety@transitops.in', hash, 'Amit Patel', 'Safety Officer');
insertUser.run('finance@transitops.in', hash, 'Neha Gupta', 'Financial Analyst');
console.log('✅ Users seeded');

// ── Vehicles ──
const insertVehicle = db.prepare('INSERT INTO vehicles (registration_number, name, type, max_load_capacity, odometer, acquisition_cost, status, region) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
const vehicles = [
  ['MH-12-AB-1234', 'Tata Ace Gold', 'Van', 750, 45230, 650000, 'Available', 'West'],
  ['MH-14-CD-5678', 'Mahindra Bolero Pickup', 'Van', 1200, 62100, 820000, 'Available', 'West'],
  ['DL-01-EF-9012', 'Ashok Leyland Dost', 'Van', 1500, 38900, 750000, 'On Trip', 'North'],
  ['KA-05-GH-3456', 'Tata 407', 'Truck', 3500, 128400, 1450000, 'Available', 'South'],
  ['GJ-06-IJ-7890', 'BharatBenz 1217', 'Truck', 9000, 215600, 2800000, 'On Trip', 'West'],
  ['TN-09-KL-2345', 'Eicher Pro 3015', 'Truck', 12000, 178300, 3200000, 'Available', 'South'],
  ['RJ-14-MN-6789', 'Tata Signa 4825', 'Truck', 25000, 342100, 4500000, 'In Shop', 'North'],
  ['UP-32-OP-1357', 'Ashok Leyland 12M', 'Bus', 0, 89200, 5500000, 'Available', 'North'],
  ['MH-04-QR-2468', 'Tata Starbus', 'Bus', 0, 156700, 4800000, 'Available', 'West'],
  ['KA-01-ST-3579', 'Toyota Innova Crysta', 'Sedan', 400, 67800, 1900000, 'On Trip', 'South'],
  ['DL-03-UV-4680', 'Maruti Suzuki Ertiga', 'Sedan', 350, 43200, 1200000, 'Available', 'North'],
  ['TN-07-WX-5791', 'Hyundai Verna', 'Sedan', 300, 28900, 1400000, 'Available', 'South'],
  ['GJ-01-YZ-6802', 'Tata Ultra T.7', 'Truck', 5000, 95400, 1800000, 'Available', 'West'],
  ['AP-07-AA-7913', 'Mahindra Furio', 'Truck', 7500, 142600, 2200000, 'Retired', 'South'],
  ['MP-09-BB-8024', 'Force Traveller', 'Van', 2000, 112300, 1100000, 'Available', 'Central'],
];
vehicles.forEach(v => insertVehicle.run(...v));
console.log('✅ Vehicles seeded');

// ── Drivers ──
const insertDriver = db.prepare('INSERT INTO drivers (name, license_number, license_category, license_expiry, contact_number, safety_score, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
const drivers = [
  ['Rajesh Verma', 'DL-0420110012345', 'HMV', '2027-06-15', '9876543210', 92, 'On Trip'],
  ['Suresh Yadav', 'MH-0320090067890', 'HMV', '2026-12-20', '9876543211', 85, 'Available'],
  ['Manoj Singh', 'KA-0120150034567', 'LMV', '2027-03-10', '9876543212', 78, 'On Trip'],
  ['Vijay Patil', 'GJ-0620110089012', 'HMV', '2026-08-05', '9876543213', 88, 'Available'],
  ['Arun Nair', 'TN-0920130045678', 'HMV', '2027-09-25', '9876543214', 95, 'Available'],
  ['Deepak Sharma', 'DL-0120100023456', 'LMV', '2026-07-20', '9876543215', 72, 'Available'],
  ['Ramesh Gupta', 'UP-3220140078901', 'HMV', '2027-01-15', '9876543216', 81, 'Off Duty'],
  ['Kiran Kumar', 'RJ-1420120056789', 'HMV', '2026-05-10', '9876543217', 65, 'Suspended'],
  ['Prakash Joshi', 'MP-0920110034567', 'HMV', '2027-11-30', '9876543218', 90, 'Available'],
  ['Sanjay Mishra', 'AP-0720130012345', 'LMV', '2027-04-18', '9876543219', 83, 'On Trip'],
  ['Vikram Reddy', 'TN-0720160089012', 'HMV', '2027-08-22', '9876543220', 91, 'Available'],
  ['Harish Pandey', 'MH-0420140067890', 'LMV', '2026-09-15', '9876543221', 76, 'Available'],
];
drivers.forEach(d => insertDriver.run(...d));
console.log('✅ Drivers seeded');

// ── Trips ──
const insertTrip = db.prepare('INSERT INTO trips (source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, actual_distance, fuel_consumed, status, started_at, completed_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
const trips = [
  ['Mumbai', 'Pune', 1, 2, 500, 150, 148, 18, 'Completed', '2026-06-01 08:00', '2026-06-01 14:00', '2026-05-31 20:00'],
  ['Delhi', 'Jaipur', 3, 1, 1200, 280, 275, 35, 'Dispatched', '2026-07-10 06:00', null, '2026-07-09 18:00'],
  ['Bangalore', 'Chennai', 4, 3, 2800, 350, 345, 45, 'Completed', '2026-06-05 07:00', '2026-06-05 18:00', '2026-06-04 22:00'],
  ['Ahmedabad', 'Surat', 5, 4, 7500, 265, null, null, 'Dispatched', '2026-07-11 05:00', null, '2026-07-10 20:00'],
  ['Chennai', 'Coimbatore', 6, 5, 10000, 500, 495, 68, 'Completed', '2026-06-10 04:00', '2026-06-10 16:00', '2026-06-09 22:00'],
  ['Mumbai', 'Nashik', 2, 6, 800, 170, 168, 22, 'Completed', '2026-06-12 09:00', '2026-06-12 15:00', '2026-06-12 06:00'],
  ['Delhi', 'Agra', 11, 7, 200, 230, 228, 20, 'Completed', '2026-06-15 07:00', '2026-06-15 12:00', '2026-06-14 20:00'],
  ['Bangalore', 'Mysore', 10, 10, 300, 150, null, null, 'Dispatched', '2026-07-12 06:00', null, '2026-07-11 22:00'],
  ['Jaipur', 'Udaipur', 15, 9, 1500, 400, 395, 52, 'Completed', '2026-06-18 05:00', '2026-06-18 14:00', '2026-06-17 20:00'],
  ['Pune', 'Goa', 1, 2, 600, 450, 448, 55, 'Completed', '2026-06-20 06:00', '2026-06-20 18:00', '2026-06-19 22:00'],
  ['Hyderabad', 'Vijayawada', 13, 11, 4000, 270, 268, 36, 'Completed', '2026-06-22 07:00', '2026-06-22 14:00', '2026-06-21 22:00'],
  ['Mumbai', 'Ahmedabad', 2, 4, 1000, 530, 525, 65, 'Completed', '2026-06-25 04:00', '2026-06-25 16:00', '2026-06-24 22:00'],
  ['Delhi', 'Chandigarh', 11, 6, 250, 250, 248, 22, 'Completed', '2026-06-28 08:00', '2026-06-28 14:00', '2026-06-27 22:00'],
  ['Bangalore', 'Hyderabad', 4, 5, 3000, 570, 565, 75, 'Completed', '2026-07-01 05:00', '2026-07-01 18:00', '2026-06-30 22:00'],
  ['Chennai', 'Madurai', 6, 11, 8000, 460, 458, 62, 'Completed', '2026-07-03 04:00', '2026-07-03 15:00', '2026-07-02 22:00'],
  ['Surat', 'Rajkot', 13, 9, 3500, 260, null, null, 'Draft', null, null, '2026-07-11 10:00'],
  ['Lucknow', 'Varanasi', 15, 12, 1800, 320, null, null, 'Draft', null, null, '2026-07-11 12:00'],
  ['Mumbai', 'Kolhapur', 1, 2, 700, 380, null, null, 'Draft', null, null, '2026-07-11 14:00'],
  ['Pune', 'Nagpur', 2, 4, 900, 720, 715, 88, 'Completed', '2026-07-05 03:00', '2026-07-05 18:00', '2026-07-04 22:00'],
  ['Delhi', 'Lucknow', 11, 6, 280, 550, 545, 48, 'Completed', '2026-07-06 05:00', '2026-07-06 16:00', '2026-07-05 22:00'],
  ['Bangalore', 'Goa', 4, 5, 2500, 560, null, null, 'Cancelled', null, null, '2026-07-07 10:00'],
  ['Ahmedabad', 'Mumbai', 13, 9, 4500, 530, 528, 70, 'Completed', '2026-07-08 04:00', '2026-07-08 16:00', '2026-07-07 22:00'],
  ['Jaipur', 'Delhi', 15, 12, 1600, 280, 278, 35, 'Completed', '2026-07-08 06:00', '2026-07-08 12:00', '2026-07-07 22:00'],
  ['Chennai', 'Bangalore', 6, 11, 9000, 350, 348, 48, 'Completed', '2026-07-09 05:00', '2026-07-09 14:00', '2026-07-08 22:00'],
  ['Mumbai', 'Pune', 2, 4, 1100, 150, null, null, 'Cancelled', null, null, '2026-07-10 08:00'],
];
trips.forEach(t => insertTrip.run(...t));
console.log('✅ Trips seeded');

// ── Maintenance ──
const insertMaint = db.prepare('INSERT INTO maintenance_logs (vehicle_id, type, description, cost, created_at, closed_at, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
const maintenance = [
  [7, 'Engine Overhaul', 'Complete engine rebuild due to high mileage', 85000, '2026-07-10 10:00', null, 'Active'],
  [1, 'Oil Change', 'Regular 10000km service', 3500, '2026-06-15 09:00', '2026-06-15 14:00', 'Closed'],
  [4, 'Brake Replacement', 'Front and rear brake pad replacement', 12000, '2026-06-18 08:00', '2026-06-18 17:00', 'Closed'],
  [5, 'Tyre Rotation', 'All six tyres rotated', 8000, '2026-06-20 10:00', '2026-06-20 15:00', 'Closed'],
  [2, 'AC Repair', 'Compressor replacement', 15000, '2026-06-25 09:00', '2026-06-26 14:00', 'Closed'],
  [6, 'Clutch Replacement', 'Full clutch kit replacement', 22000, '2026-07-01 08:00', '2026-07-02 16:00', 'Closed'],
  [13, 'Suspension Work', 'Leaf spring replacement', 18000, '2026-07-05 10:00', '2026-07-06 12:00', 'Closed'],
  [11, 'Battery Replacement', 'New Amaron battery', 6500, '2026-07-08 11:00', '2026-07-08 13:00', 'Closed'],
];
maintenance.forEach(m => insertMaint.run(...m));
console.log('✅ Maintenance seeded');

// ── Fuel Logs ──
const insertFuel = db.prepare('INSERT INTO fuel_logs (vehicle_id, trip_id, liters, cost, date) VALUES (?, ?, ?, ?, ?)');
const fuelLogs = [
  [1, 1, 18, 1890, '2026-06-01'], [3, 2, 35, 3675, '2026-07-10'], [4, 3, 45, 4725, '2026-06-05'],
  [5, 4, 40, 4200, '2026-07-11'], [6, 5, 68, 7140, '2026-06-10'], [2, 6, 22, 2310, '2026-06-12'],
  [11, 7, 20, 2100, '2026-06-15'], [10, 8, 18, 1890, '2026-07-12'], [15, 9, 52, 5460, '2026-06-18'],
  [1, 10, 55, 5775, '2026-06-20'], [13, 11, 36, 3780, '2026-06-22'], [2, 12, 65, 6825, '2026-06-25'],
  [11, 13, 22, 2310, '2026-06-28'], [4, 14, 75, 7875, '2026-07-01'], [6, 15, 62, 6510, '2026-07-03'],
  [2, 19, 88, 9240, '2026-07-05'], [11, 20, 48, 5040, '2026-07-06'], [13, 22, 70, 7350, '2026-07-08'],
  [15, 23, 35, 3675, '2026-07-08'], [6, 24, 48, 5040, '2026-07-09'],
  [1, null, 30, 3150, '2026-05-20'], [2, null, 25, 2625, '2026-05-25'],
  [4, null, 50, 5250, '2026-05-28'], [5, null, 60, 6300, '2026-06-01'],
  [6, null, 45, 4725, '2026-05-15'], [7, null, 80, 8400, '2026-05-10'],
  [11, null, 20, 2100, '2026-05-18'], [13, null, 40, 4200, '2026-05-22'],
  [15, null, 35, 3675, '2026-05-30'], [10, null, 15, 1575, '2026-06-08'],
];
fuelLogs.forEach(f => insertFuel.run(...f));
console.log('✅ Fuel logs seeded');

// ── Expenses ──
const insertExpense = db.prepare('INSERT INTO expenses (vehicle_id, category, amount, date, description) VALUES (?, ?, ?, ?, ?)');
const expenses = [
  [1, 'Toll', 850, '2026-06-01', 'Mumbai-Pune Expressway'], [1, 'Toll', 1200, '2026-06-20', 'Mumbai-Goa Highway'],
  [2, 'Insurance', 28000, '2026-06-01', 'Annual comprehensive insurance'], [2, 'Toll', 650, '2026-06-12', 'Nashik toll'],
  [3, 'Toll', 1500, '2026-07-10', 'Delhi-Jaipur NH48'], [4, 'Toll', 1800, '2026-06-05', 'Bangalore-Chennai NH'],
  [4, 'Insurance', 35000, '2026-06-01', 'Annual policy renewal'], [5, 'Toll', 2200, '2026-07-11', 'Gujarat tolls'],
  [6, 'Repair', 4500, '2026-06-08', 'Windshield replacement'], [6, 'Toll', 2800, '2026-06-10', 'TN highway tolls'],
  [7, 'Repair', 12000, '2026-07-05', 'Radiator repair'], [10, 'Insurance', 22000, '2026-06-01', 'Comprehensive cover'],
  [11, 'Toll', 900, '2026-06-15', 'Delhi-Agra toll'], [11, 'Toll', 1100, '2026-06-28', 'Delhi-Chandigarh toll'],
  [13, 'Toll', 1400, '2026-06-22', 'Hyderabad tolls'], [13, 'Insurance', 32000, '2026-06-01', 'Fleet insurance'],
  [15, 'Toll', 1600, '2026-06-18', 'Rajasthan state highway'], [15, 'Repair', 3200, '2026-07-01', 'Exhaust repair'],
  [2, 'Toll', 2400, '2026-07-05', 'Pune-Nagpur tolls'], [11, 'Toll', 1800, '2026-07-06', 'Delhi-Lucknow expressway'],
];
expenses.forEach(e => insertExpense.run(...e));
console.log('✅ Expenses seeded');

console.log('🎉 Database seeded successfully!');
process.exit(0);
