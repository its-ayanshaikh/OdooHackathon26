// Resource API layer. Handles CRUD + business actions and maps between the
// backend (snake_case) and the frontend (camelCase) shapes.

const API_BASE =
  import.meta.env.VITE_API_URL ||
  `http://${window.location.hostname}:8000/api`

let refreshing = null

async function tryRefresh() {
  if (!refreshing) {
    refreshing = fetch(`${API_BASE}/auth/refresh/`, {
      method: 'POST',
      credentials: 'include',
    })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => {
        refreshing = null
      })
  }
  return refreshing
}

async function req(path, { method = 'GET', body, retry = true } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 401 && retry) {
    const ok = await tryRefresh()
    if (ok) return req(path, { method, body, retry: false })
  }
  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const detail = data.detail
    const msg =
      typeof detail === 'string'
        ? detail
        : detail
          ? Object.values(detail).flat().join(' ')
          : 'Request failed'
    throw new Error(msg)
  }
  return data
}

const n = (x) => (x === null || x === undefined || x === '' ? x : Number(x))

/* ---------------- Mappers ---------------- */
const vehicleFromApi = (v) => ({
  id: v.id,
  regNumber: v.reg_number,
  name: v.name,
  type: v.type,
  maxCapacity: n(v.max_capacity),
  odometer: n(v.odometer),
  acquisitionCost: n(v.acquisition_cost),
  region: v.region,
  status: v.status,
})
const vehicleToApi = (v) => ({
  reg_number: v.regNumber,
  name: v.name,
  type: v.type,
  max_capacity: n(v.maxCapacity),
  odometer: n(v.odometer),
  acquisition_cost: n(v.acquisitionCost),
  region: v.region,
  status: v.status,
})

const driverFromApi = (d) => ({
  id: d.id,
  name: d.name,
  email: d.email,
  licenseNumber: d.license_number,
  licenseCategory: d.license_category,
  licenseExpiry: d.license_expiry,
  contact: d.contact,
  safetyScore: n(d.safety_score),
  status: d.status,
  licenseExpired: d.license_expired,
})
const driverToApi = (d) => ({
  name: d.name,
  email: d.email,
  license_number: d.licenseNumber,
  license_category: d.licenseCategory,
  license_expiry: d.licenseExpiry,
  contact: d.contact,
  safety_score: n(d.safetyScore),
  status: d.status,
})

const tripFromApi = (t) => ({
  id: t.id,
  source: t.source,
  destination: t.destination,
  vehicleId: t.vehicle,
  driverId: t.driver,
  vehicleReg: t.vehicle_reg,
  driverName: t.driver_name,
  cargoWeight: n(t.cargo_weight),
  plannedDistance: n(t.planned_distance),
  revenue: n(t.revenue),
  status: t.status,
  startOdometer: n(t.start_odometer),
  endOdometer: n(t.end_odometer),
  fuelConsumed: n(t.fuel_consumed),
  createdAt: (t.created_at || '').slice(0, 10),
})
const tripToApi = (t) => ({
  source: t.source,
  destination: t.destination,
  vehicle: n(t.vehicleId),
  driver: n(t.driverId),
  cargo_weight: n(t.cargoWeight),
  planned_distance: n(t.plannedDistance),
  revenue: n(t.revenue) || 0,
})

const maintFromApi = (m) => ({
  id: m.id,
  vehicleId: m.vehicle,
  vehicleReg: m.vehicle_reg,
  type: m.type,
  description: m.description,
  cost: n(m.cost),
  date: m.date,
  status: m.status,
})
const maintToApi = (m) => ({
  vehicle: n(m.vehicleId),
  type: m.type,
  description: m.description,
  cost: n(m.cost),
  date: m.date,
  status: m.status,
})

const fuelFromApi = (f) => ({
  id: f.id,
  vehicleId: f.vehicle,
  vehicleReg: f.vehicle_reg,
  liters: n(f.liters),
  cost: n(f.cost),
  odometer: n(f.odometer),
  date: f.date,
})
const fuelToApi = (f) => ({
  vehicle: n(f.vehicleId),
  liters: n(f.liters),
  cost: n(f.cost),
  odometer: n(f.odometer) || null,
  date: f.date,
})

const expenseFromApi = (e) => ({
  id: e.id,
  vehicleId: e.vehicle,
  vehicleReg: e.vehicle_reg,
  category: e.category,
  amount: n(e.amount),
  date: e.date,
  note: e.note,
})
const expenseToApi = (e) => ({
  vehicle: n(e.vehicleId),
  category: e.category,
  amount: n(e.amount),
  date: e.date,
  note: e.note,
})

/* ---------------- Resource API ---------------- */
export const resources = {
  // Vehicles
  listVehicles: async () => (await req('/vehicles/')).map(vehicleFromApi),
  createVehicle: async (v) =>
    vehicleFromApi(await req('/vehicles/', { method: 'POST', body: vehicleToApi(v) })),
  updateVehicle: async (id, v) =>
    vehicleFromApi(await req(`/vehicles/${id}/`, { method: 'PATCH', body: vehicleToApi(v) })),
  deleteVehicle: (id) => req(`/vehicles/${id}/`, { method: 'DELETE' }),

  // Drivers
  listDrivers: async () => (await req('/drivers/')).map(driverFromApi),
  createDriver: async (d) =>
    driverFromApi(await req('/drivers/', { method: 'POST', body: driverToApi(d) })),
  updateDriver: async (id, d) =>
    driverFromApi(await req(`/drivers/${id}/`, { method: 'PATCH', body: driverToApi(d) })),
  deleteDriver: (id) => req(`/drivers/${id}/`, { method: 'DELETE' }),

  // Trips
  listTrips: async () => (await req('/trips/')).map(tripFromApi),
  createTrip: async (t) =>
    tripFromApi(await req('/trips/', { method: 'POST', body: tripToApi(t) })),
  deleteTrip: (id) => req(`/trips/${id}/`, { method: 'DELETE' }),
  dispatchTrip: async (id) => tripFromApi(await req(`/trips/${id}/dispatch/`, { method: 'POST' })),
  completeTrip: async (id, payload) =>
    tripFromApi(
      await req(`/trips/${id}/complete/`, {
        method: 'POST',
        body: { end_odometer: n(payload.endOdometer), fuel_consumed: n(payload.fuelConsumed) },
      }),
    ),
  cancelTrip: async (id) => tripFromApi(await req(`/trips/${id}/cancel/`, { method: 'POST' })),

  // Maintenance
  listMaintenance: async () => (await req('/maintenance/')).map(maintFromApi),
  createMaintenance: async (m) =>
    maintFromApi(await req('/maintenance/', { method: 'POST', body: maintToApi(m) })),
  closeMaintenance: async (id) =>
    maintFromApi(await req(`/maintenance/${id}/close/`, { method: 'POST' })),
  deleteMaintenance: (id) => req(`/maintenance/${id}/`, { method: 'DELETE' }),

  // Fuel
  listFuel: async () => (await req('/fuel/')).map(fuelFromApi),
  createFuel: async (f) =>
    fuelFromApi(await req('/fuel/', { method: 'POST', body: fuelToApi(f) })),
  deleteFuel: (id) => req(`/fuel/${id}/`, { method: 'DELETE' }),

  // Expenses
  listExpenses: async () => (await req('/expenses/')).map(expenseFromApi),
  createExpense: async (e) =>
    expenseFromApi(await req('/expenses/', { method: 'POST', body: expenseToApi(e) })),
  deleteExpense: (id) => req(`/expenses/${id}/`, { method: 'DELETE' }),
}
