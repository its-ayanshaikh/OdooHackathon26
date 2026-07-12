import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import DashboardLayout from './layouts/DashboardLayout.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Vehicles from './pages/Vehicles.jsx'
import Drivers from './pages/Drivers.jsx'
import Trips from './pages/Trips.jsx'
import Maintenance from './pages/Maintenance.jsx'
import Expenses from './pages/Expenses.jsx'
import Reports from './pages/Reports.jsx'
import { useApp } from './store/AppContext.jsx'
import { canAccess, landingRoute } from './lib/rbac.js'

function RequireAuth({ children }) {
  const { state } = useApp()
  if (!state.currentUser) return <Navigate to="/login" replace />
  return children
}

// Guards a route by the current user's role.
function RoleRoute({ children }) {
  const { state } = useApp()
  const location = useLocation()
  const role = state.currentUser?.role
  if (!canAccess(role, location.pathname)) {
    return <Navigate to={landingRoute(role)} replace />
  }
  return children
}

function App() {
  const { state } = useApp()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <RequireAuth>
              <DashboardLayout />
            </RequireAuth>
          }
        >
          <Route
            path="/"
            element={
              <Navigate to={landingRoute(state.currentUser?.role)} replace />
            }
          />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route
            path="/vehicles"
            element={
              <RoleRoute>
                <Vehicles />
              </RoleRoute>
            }
          />
          <Route
            path="/drivers"
            element={
              <RoleRoute>
                <Drivers />
              </RoleRoute>
            }
          />
          <Route
            path="/trips"
            element={
              <RoleRoute>
                <Trips />
              </RoleRoute>
            }
          />
          <Route
            path="/maintenance"
            element={
              <RoleRoute>
                <Maintenance />
              </RoleRoute>
            }
          />
          <Route
            path="/expenses"
            element={
              <RoleRoute>
                <Expenses />
              </RoleRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <RoleRoute>
                <Reports />
              </RoleRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
