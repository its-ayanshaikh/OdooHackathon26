import { createContext, useContext, useEffect, useReducer } from 'react'
import {
  seedVehicles,
  seedDrivers,
  seedTrips,
  seedMaintenance,
  seedFuelLogs,
  seedExpenses,
  seedUsers,
} from '../data/seed.js'

const STORAGE_KEY = 'transitops-state-v2'
const AppContext = createContext(null)

const uid = (prefix) => `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`

const initialState = {
  vehicles: seedVehicles,
  drivers: seedDrivers,
  trips: seedTrips,
  maintenance: seedMaintenance,
  fuelLogs: seedFuelLogs,
  expenses: seedExpenses,
  users: seedUsers,
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...initialState, ...JSON.parse(raw) }
  } catch {
    // ignore
  }
  return initialState
}

function reducer(state, action) {
  switch (action.type) {
    case 'RESET':
      return { ...initialState }

    /* ---------------- Vehicles ---------------- */
    case 'ADD_VEHICLE':
      return {
        ...state,
        vehicles: [...state.vehicles, { ...action.vehicle, id: uid('v') }],
      }
    case 'UPDATE_VEHICLE':
      return {
        ...state,
        vehicles: state.vehicles.map((v) =>
          v.id === action.vehicle.id ? { ...v, ...action.vehicle } : v,
        ),
      }
    case 'DELETE_VEHICLE':
      return {
        ...state,
        vehicles: state.vehicles.filter((v) => v.id !== action.id),
      }

    /* ---------------- Drivers ---------------- */
    case 'ADD_DRIVER':
      return {
        ...state,
        drivers: [...state.drivers, { ...action.driver, id: uid('d') }],
      }
    case 'UPDATE_DRIVER':
      return {
        ...state,
        drivers: state.drivers.map((d) =>
          d.id === action.driver.id ? { ...d, ...action.driver } : d,
        ),
      }
    case 'DELETE_DRIVER':
      return {
        ...state,
        drivers: state.drivers.filter((d) => d.id !== action.id),
      }

    /* ---------------- Trips ---------------- */
    case 'ADD_TRIP':
      return {
        ...state,
        trips: [...state.trips, { ...action.trip, id: uid('t'), status: 'Draft' }],
      }
    case 'UPDATE_TRIP':
      return {
        ...state,
        trips: state.trips.map((t) =>
          t.id === action.trip.id ? { ...t, ...action.trip } : t,
        ),
      }
    case 'DELETE_TRIP':
      return { ...state, trips: state.trips.filter((t) => t.id !== action.id) }

    case 'DISPATCH_TRIP': {
      const trip = state.trips.find((t) => t.id === action.id)
      if (!trip) return state
      const vehicle = state.vehicles.find((v) => v.id === trip.vehicleId)
      return {
        ...state,
        trips: state.trips.map((t) =>
          t.id === action.id
            ? { ...t, status: 'Dispatched', startOdometer: vehicle?.odometer ?? null }
            : t,
        ),
        vehicles: state.vehicles.map((v) =>
          v.id === trip.vehicleId ? { ...v, status: 'On Trip' } : v,
        ),
        drivers: state.drivers.map((d) =>
          d.id === trip.driverId ? { ...d, status: 'On Trip' } : d,
        ),
      }
    }

    case 'COMPLETE_TRIP': {
      const trip = state.trips.find((t) => t.id === action.id)
      if (!trip) return state
      const { endOdometer, fuelConsumed } = action.payload
      return {
        ...state,
        trips: state.trips.map((t) =>
          t.id === action.id
            ? { ...t, status: 'Completed', endOdometer, fuelConsumed }
            : t,
        ),
        vehicles: state.vehicles.map((v) =>
          v.id === trip.vehicleId
            ? { ...v, status: 'Available', odometer: endOdometer ?? v.odometer }
            : v,
        ),
        drivers: state.drivers.map((d) =>
          d.id === trip.driverId ? { ...d, status: 'Available' } : d,
        ),
        // Auto-create a fuel log for the completed trip
        fuelLogs: fuelConsumed
          ? [
              ...state.fuelLogs,
              {
                id: uid('f'),
                vehicleId: trip.vehicleId,
                liters: Number(fuelConsumed),
                cost: Math.round(Number(fuelConsumed) * 95),
                date: new Date().toISOString().slice(0, 10),
                odometer: endOdometer,
              },
            ]
          : state.fuelLogs,
      }
    }

    case 'CANCEL_TRIP': {
      const trip = state.trips.find((t) => t.id === action.id)
      if (!trip) return state
      const wasDispatched = trip.status === 'Dispatched'
      return {
        ...state,
        trips: state.trips.map((t) =>
          t.id === action.id ? { ...t, status: 'Cancelled' } : t,
        ),
        vehicles: wasDispatched
          ? state.vehicles.map((v) =>
              v.id === trip.vehicleId && v.status === 'On Trip'
                ? { ...v, status: 'Available' }
                : v,
            )
          : state.vehicles,
        drivers: wasDispatched
          ? state.drivers.map((d) =>
              d.id === trip.driverId && d.status === 'On Trip'
                ? { ...d, status: 'Available' }
                : d,
            )
          : state.drivers,
      }
    }

    /* ---------------- Maintenance ---------------- */
    case 'ADD_MAINTENANCE': {
      const record = { ...action.record, id: uid('m') }
      return {
        ...state,
        maintenance: [...state.maintenance, record],
        // Active maintenance -> vehicle In Shop
        vehicles:
          record.status === 'Active'
            ? state.vehicles.map((v) =>
                v.id === record.vehicleId && v.status !== 'Retired'
                  ? { ...v, status: 'In Shop' }
                  : v,
              )
            : state.vehicles,
      }
    }
    case 'CLOSE_MAINTENANCE': {
      const record = state.maintenance.find((m) => m.id === action.id)
      if (!record) return state
      // Only restore if no other active maintenance remains for the vehicle
      const otherActive = state.maintenance.some(
        (m) =>
          m.id !== action.id &&
          m.vehicleId === record.vehicleId &&
          m.status === 'Active',
      )
      return {
        ...state,
        maintenance: state.maintenance.map((m) =>
          m.id === action.id ? { ...m, status: 'Closed' } : m,
        ),
        vehicles: state.vehicles.map((v) =>
          v.id === record.vehicleId && v.status === 'In Shop' && !otherActive
            ? { ...v, status: 'Available' }
            : v,
        ),
      }
    }
    case 'DELETE_MAINTENANCE':
      return {
        ...state,
        maintenance: state.maintenance.filter((m) => m.id !== action.id),
      }

    /* ---------------- Fuel logs ---------------- */
    case 'ADD_FUEL':
      return {
        ...state,
        fuelLogs: [...state.fuelLogs, { ...action.log, id: uid('f') }],
      }
    case 'DELETE_FUEL':
      return {
        ...state,
        fuelLogs: state.fuelLogs.filter((f) => f.id !== action.id),
      }

    /* ---------------- Expenses ---------------- */
    case 'ADD_EXPENSE':
      return {
        ...state,
        expenses: [...state.expenses, { ...action.expense, id: uid('e') }],
      }
    case 'DELETE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.filter((e) => e.id !== action.id),
      }

    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // ignore
    }
  }, [state])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
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
