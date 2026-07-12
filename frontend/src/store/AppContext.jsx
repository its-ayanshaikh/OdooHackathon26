import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { resources } from '../lib/resources.js'
import { useAuth } from './AuthContext.jsx'

const AppContext = createContext(null)

const emptyState = {
  vehicles: [],
  drivers: [],
  trips: [],
  maintenance: [],
  fuelLogs: [],
  expenses: [],
}

export function AppProvider({ children }) {
  const { user } = useAuth()
  const [state, setState] = useState(emptyState)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const patch = useCallback((slice) => setState((s) => ({ ...s, ...slice })), [])

  const reloadVehicles = useCallback(
    async () => patch({ vehicles: await resources.listVehicles() }),
    [patch],
  )
  const reloadDrivers = useCallback(
    async () => patch({ drivers: await resources.listDrivers() }),
    [patch],
  )
  const reloadTrips = useCallback(
    async () => patch({ trips: await resources.listTrips() }),
    [patch],
  )
  const reloadMaintenance = useCallback(
    async () => patch({ maintenance: await resources.listMaintenance() }),
    [patch],
  )
  const reloadFuel = useCallback(
    async () => patch({ fuelLogs: await resources.listFuel() }),
    [patch],
  )
  const reloadExpenses = useCallback(
    async () => patch({ expenses: await resources.listExpenses() }),
    [patch],
  )

  const reloadAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [vehicles, drivers, trips, maintenance, fuelLogs, expenses] = await Promise.all([
        resources.listVehicles(),
        resources.listDrivers(),
        resources.listTrips(),
        resources.listMaintenance(),
        resources.listFuel(),
        resources.listExpenses(),
      ])
      setState({ vehicles, drivers, trips, maintenance, fuelLogs, expenses })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load data when authenticated; clear on logout.
  useEffect(() => {
    if (user) reloadAll()
    else setState(emptyState)
  }, [user, reloadAll])

  // ---------------- Mutations (throw on error; pages toast) ----------------
  const actions = {
    // Vehicles
    addVehicle: async (v) => {
      await resources.createVehicle(v)
      await reloadVehicles()
    },
    updateVehicle: async (id, v) => {
      await resources.updateVehicle(id, v)
      await reloadVehicles()
    },
    deleteVehicle: async (id) => {
      await resources.deleteVehicle(id)
      await reloadVehicles()
    },

    // Drivers
    addDriver: async (d) => {
      await resources.createDriver(d)
      await reloadDrivers()
    },
    updateDriver: async (id, d) => {
      await resources.updateDriver(id, d)
      await reloadDrivers()
    },
    deleteDriver: async (id) => {
      await resources.deleteDriver(id)
      await reloadDrivers()
    },

    // Trips (status transitions cascade to vehicles + drivers)
    addTrip: async (t) => {
      await resources.createTrip(t)
      await reloadTrips()
    },
    deleteTrip: async (id) => {
      await resources.deleteTrip(id)
      await reloadTrips()
    },
    dispatchTrip: async (id) => {
      await resources.dispatchTrip(id)
      await Promise.all([reloadTrips(), reloadVehicles(), reloadDrivers()])
    },
    completeTrip: async (id, payload) => {
      await resources.completeTrip(id, payload)
      await Promise.all([reloadTrips(), reloadVehicles(), reloadDrivers(), reloadFuel()])
    },
    cancelTrip: async (id) => {
      await resources.cancelTrip(id)
      await Promise.all([reloadTrips(), reloadVehicles(), reloadDrivers()])
    },

    // Maintenance (cascades to vehicles)
    addMaintenance: async (m) => {
      await resources.createMaintenance(m)
      await Promise.all([reloadMaintenance(), reloadVehicles()])
    },
    closeMaintenance: async (id) => {
      await resources.closeMaintenance(id)
      await Promise.all([reloadMaintenance(), reloadVehicles()])
    },
    deleteMaintenance: async (id) => {
      await resources.deleteMaintenance(id)
      await reloadMaintenance()
    },

    // Fuel & expenses
    addFuel: async (f) => {
      await resources.createFuel(f)
      await reloadFuel()
    },
    deleteFuel: async (id) => {
      await resources.deleteFuel(id)
      await reloadFuel()
    },
    addExpense: async (e) => {
      await resources.createExpense(e)
      await reloadExpenses()
    },
    deleteExpense: async (id) => {
      await resources.deleteExpense(id)
      await reloadExpenses()
    },
  }

  return (
    <AppContext.Provider value={{ state, loading, error, reloadAll, ...actions }}>
      {children}
    </AppContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
