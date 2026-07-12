// Seed data for TransitOps. Dates are relative to mid-2026.

export const VEHICLE_TYPES = ['Van', 'Truck', 'Trailer', 'Pickup', 'Bus']
export const REGIONS = ['North', 'South', 'East', 'West', 'Central']
export const VEHICLE_STATUS = ['Available', 'On Trip', 'In Shop', 'Retired']
export const DRIVER_STATUS = ['Available', 'On Trip', 'Off Duty', 'Suspended']
export const TRIP_STATUS = ['Draft', 'Dispatched', 'Completed', 'Cancelled']
export const LICENSE_CATEGORIES = ['LMV', 'HMV', 'HGV', 'PSV']
export const EXPENSE_CATEGORIES = ['Toll', 'Parking', 'Fine', 'Insurance', 'Misc']

export const seedVehicles = [
  { id: 'v1', regNumber: 'MH-01-AB-1234', name: 'Tata Ace Gold', type: 'Van', maxCapacity: 750, odometer: 48200, acquisitionCost: 650000, status: 'Available', region: 'West' },
  { id: 'v2', regNumber: 'MH-02-CD-5678', name: 'Ashok Leyland Dost', type: 'Van', maxCapacity: 1250, odometer: 91500, acquisitionCost: 890000, status: 'On Trip', region: 'West' },
  { id: 'v3', regNumber: 'DL-03-EF-9012', name: 'Eicher Pro 2049', type: 'Truck', maxCapacity: 5000, odometer: 132000, acquisitionCost: 1850000, status: 'Available', region: 'North' },
  { id: 'v4', regNumber: 'KA-04-GH-3456', name: 'BharatBenz 1617R', type: 'Truck', maxCapacity: 9000, odometer: 205400, acquisitionCost: 3200000, status: 'In Shop', region: 'South' },
  { id: 'v5', regNumber: 'TN-05-IJ-7890', name: 'Mahindra Bolero Pik-Up', type: 'Pickup', maxCapacity: 1500, odometer: 67800, acquisitionCost: 920000, status: 'Available', region: 'South' },
  { id: 'v6', regNumber: 'GJ-06-KL-2345', name: 'Tata Prima 5530', type: 'Trailer', maxCapacity: 25000, odometer: 310000, acquisitionCost: 5400000, status: 'On Trip', region: 'West' },
  { id: 'v7', regNumber: 'UP-07-MN-6789', name: 'Force Traveller', type: 'Bus', maxCapacity: 2000, odometer: 88900, acquisitionCost: 1650000, status: 'Available', region: 'Central' },
  { id: 'v8', regNumber: 'RJ-08-OP-1122', name: 'Tata 407', type: 'Truck', maxCapacity: 2500, odometer: 178000, acquisitionCost: 1100000, status: 'Retired', region: 'North' },
]

export const seedDrivers = [
  { id: 'd1', name: 'Alex Fernandes', licenseNumber: 'MH1420110012345', licenseCategory: 'HMV', licenseExpiry: '2027-08-15', contact: '+91 98200 11223', safetyScore: 92, status: 'Available' },
  { id: 'd2', name: 'Ravi Kumar', licenseNumber: 'DL0320090054321', licenseCategory: 'HGV', licenseExpiry: '2026-11-30', contact: '+91 99100 44556', safetyScore: 88, status: 'On Trip' },
  { id: 'd3', name: 'Suresh Patel', licenseNumber: 'GJ0620150098765', licenseCategory: 'HMV', licenseExpiry: '2026-03-10', contact: '+91 97250 77889', safetyScore: 75, status: 'Available' },
  { id: 'd4', name: 'Mohammed Iqbal', licenseNumber: 'KA0420120033445', licenseCategory: 'HGV', licenseExpiry: '2028-01-20', contact: '+91 96860 22110', safetyScore: 95, status: 'On Trip' },
  { id: 'd5', name: 'Deepak Sharma', licenseNumber: 'UP0720180066778', licenseCategory: 'LMV', licenseExpiry: '2026-06-05', contact: '+91 94150 99001', safetyScore: 61, status: 'Suspended' },
  { id: 'd6', name: 'Vijay Singh', licenseNumber: 'RJ0820100011224', licenseCategory: 'HMV', licenseExpiry: '2027-12-01', contact: '+91 93140 55667', safetyScore: 84, status: 'Available' },
  { id: 'd7', name: 'Anil More', licenseNumber: 'MH0220160044556', licenseCategory: 'PSV', licenseExpiry: '2026-09-18', contact: '+91 90040 33445', safetyScore: 79, status: 'Off Duty' },
]

export const seedTrips = [
  { id: 't1', source: 'Mumbai', destination: 'Pune', vehicleId: 'v2', driverId: 'd2', cargoWeight: 1100, plannedDistance: 150, status: 'Dispatched', startOdometer: 91500, endOdometer: null, fuelConsumed: null, revenue: 18000, createdAt: '2026-07-10' },
  { id: 't2', source: 'Surat', destination: 'Ahmedabad', vehicleId: 'v6', driverId: 'd4', cargoWeight: 22000, plannedDistance: 265, status: 'Dispatched', startOdometer: 310000, endOdometer: null, fuelConsumed: null, revenue: 62000, createdAt: '2026-07-11' },
  { id: 't3', source: 'Delhi', destination: 'Jaipur', vehicleId: 'v3', driverId: 'd6', cargoWeight: 4200, plannedDistance: 280, status: 'Completed', startOdometer: 131500, endOdometer: 131782, fuelConsumed: 38, revenue: 41000, createdAt: '2026-07-02' },
  { id: 't4', source: 'Bengaluru', destination: 'Chennai', vehicleId: 'v5', driverId: 'd1', cargoWeight: 1200, plannedDistance: 350, status: 'Completed', startOdometer: 67300, endOdometer: 67655, fuelConsumed: 41, revenue: 33500, createdAt: '2026-06-28' },
  { id: 't5', source: 'Mumbai', destination: 'Nashik', vehicleId: 'v1', driverId: 'd3', cargoWeight: 600, plannedDistance: 170, status: 'Draft', startOdometer: null, endOdometer: null, fuelConsumed: null, revenue: 15000, createdAt: '2026-07-12' },
  { id: 't6', source: 'Lucknow', destination: 'Kanpur', vehicleId: 'v7', driverId: 'd6', cargoWeight: 900, plannedDistance: 90, status: 'Cancelled', startOdometer: null, endOdometer: null, fuelConsumed: null, revenue: 0, createdAt: '2026-07-05' },
]

export const seedMaintenance = [
  { id: 'm1', vehicleId: 'v4', type: 'Engine Overhaul', description: 'Full engine service and turbo replacement', cost: 85000, date: '2026-07-08', status: 'Active' },
  { id: 'm2', vehicleId: 'v3', type: 'Oil Change', description: 'Routine oil and filter change', cost: 4500, date: '2026-06-20', status: 'Closed' },
  { id: 'm3', vehicleId: 'v1', type: 'Tyre Replacement', description: 'Replaced 2 rear tyres', cost: 18000, date: '2026-06-15', status: 'Closed' },
  { id: 'm4', vehicleId: 'v5', type: 'Brake Service', description: 'Brake pad replacement', cost: 6200, date: '2026-05-30', status: 'Closed' },
]

export const seedFuelLogs = [
  { id: 'f1', vehicleId: 'v3', liters: 38, cost: 3610, date: '2026-07-02', odometer: 131782 },
  { id: 'f2', vehicleId: 'v5', liters: 41, cost: 3895, date: '2026-06-28', odometer: 67655 },
  { id: 'f3', vehicleId: 'v2', liters: 55, cost: 5225, date: '2026-06-25', odometer: 91200 },
  { id: 'f4', vehicleId: 'v6', liters: 120, cost: 11400, date: '2026-06-22', odometer: 309500 },
  { id: 'f5', vehicleId: 'v1', liters: 28, cost: 2660, date: '2026-06-18', odometer: 48000 },
  { id: 'f6', vehicleId: 'v3', liters: 42, cost: 3990, date: '2026-06-10', odometer: 131200 },
  { id: 'f7', vehicleId: 'v7', liters: 33, cost: 3135, date: '2026-06-08', odometer: 88700 },
]

export const seedExpenses = [
  { id: 'e1', vehicleId: 'v2', category: 'Toll', amount: 850, date: '2026-07-10', note: 'Mumbai-Pune expressway' },
  { id: 'e2', vehicleId: 'v6', category: 'Toll', amount: 1240, date: '2026-07-11', note: 'NH-48 tolls' },
  { id: 'e3', vehicleId: 'v3', category: 'Parking', amount: 300, date: '2026-07-02', note: 'Jaipur depot' },
  { id: 'e4', vehicleId: 'v5', category: 'Fine', amount: 2000, date: '2026-06-28', note: 'Overspeeding' },
  { id: 'e5', vehicleId: 'v1', category: 'Insurance', amount: 22000, date: '2026-06-01', note: 'Annual premium' },
]

export const seedUsers = [
  { id: 'u0', name: 'Riya Kapoor', email: 'admin@transitops.com', role: 'Admin' },
  { id: 'u1', name: 'Priya Menon', email: 'fleet@transitops.com', role: 'Fleet Manager' },
  { id: 'u2', name: 'Arjun Rao', email: 'driver@transitops.com', role: 'Driver' },
  { id: 'u3', name: 'Neha Gupta', email: 'safety@transitops.com', role: 'Safety Officer' },
  { id: 'u4', name: 'Karan Shah', email: 'finance@transitops.com', role: 'Financial Analyst' },
]

export const ROLES = [
  'Admin',
  'Fleet Manager',
  'Driver',
  'Safety Officer',
  'Financial Analyst',
]
