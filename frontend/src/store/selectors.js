// Derived data & business-rule helpers.

export const TODAY = new Date('2026-07-12')

export function isLicenseExpired(driver, ref = TODAY) {
  return new Date(driver.licenseExpiry) < ref
}

export function daysUntilExpiry(driver, ref = TODAY) {
  const diff = new Date(driver.licenseExpiry) - ref
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// Vehicles that can be dispatched: Available only (never Retired / In Shop / On Trip).
export function dispatchableVehicles(vehicles) {
  return vehicles.filter((v) => v.status === 'Available')
}

// Drivers that can be assigned: Available, not suspended, license not expired.
export function assignableDrivers(drivers) {
  return drivers.filter(
    (d) =>
      d.status === 'Available' &&
      d.status !== 'Suspended' &&
      !isLicenseExpired(d),
  )
}

export function getVehicle(vehicles, id) {
  return vehicles.find((v) => String(v.id) === String(id))
}

export function getDriver(drivers, id) {
  return drivers.find((d) => String(d.id) === String(id))
}

// ---------------- KPIs ----------------
export function computeKpis(state) {
  const { vehicles, trips, drivers } = state
  const total = vehicles.length
  const onTrip = vehicles.filter((v) => v.status === 'On Trip').length
  const available = vehicles.filter((v) => v.status === 'Available').length
  const inShop = vehicles.filter((v) => v.status === 'In Shop').length
  const activeTrips = trips.filter((t) => t.status === 'Dispatched').length
  const pendingTrips = trips.filter((t) => t.status === 'Draft').length
  const driversOnDuty = drivers.filter((d) => d.status === 'On Trip').length
  const usable = total - vehicles.filter((v) => v.status === 'Retired').length
  const utilization = usable ? Math.round((onTrip / usable) * 100) : 0

  return {
    total,
    onTrip,
    available,
    inShop,
    activeTrips,
    pendingTrips,
    driversOnDuty,
    utilization,
  }
}

// ---------------- Per-vehicle cost & analytics ----------------
export function vehicleCosts(state, vehicleId) {
  const fuel = state.fuelLogs
    .filter((f) => f.vehicleId === vehicleId)
    .reduce((s, f) => s + Number(f.cost), 0)
  const maintenance = state.maintenance
    .filter((m) => m.vehicleId === vehicleId)
    .reduce((s, m) => s + Number(m.cost), 0)
  const otherExpenses = state.expenses
    .filter((e) => e.vehicleId === vehicleId)
    .reduce((s, e) => s + Number(e.amount), 0)
  const revenue = state.trips
    .filter((t) => t.vehicleId === vehicleId && t.status === 'Completed')
    .reduce((s, t) => s + Number(t.revenue || 0), 0)
  return {
    fuel,
    maintenance,
    otherExpenses,
    revenue,
    operational: fuel + maintenance + otherExpenses,
  }
}

// Fuel efficiency = distance / fuel across completed trips for a vehicle.
export function vehicleFuelEfficiency(state, vehicleId) {
  const trips = state.trips.filter(
    (t) => t.vehicleId === vehicleId && t.status === 'Completed' && t.fuelConsumed,
  )
  const distance = trips.reduce(
    (s, t) => s + (Number(t.endOdometer) - Number(t.startOdometer) || t.plannedDistance),
    0,
  )
  const fuel = trips.reduce((s, t) => s + Number(t.fuelConsumed), 0)
  return fuel ? +(distance / fuel).toFixed(2) : 0
}

// ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost
export function vehicleROI(state, vehicle) {
  const { revenue, maintenance, fuel } = vehicleCosts(state, vehicle.id)
  if (!vehicle.acquisitionCost) return 0
  return +(((revenue - (maintenance + fuel)) / vehicle.acquisitionCost) * 100).toFixed(1)
}
