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
import { useAuth } from './store/AuthContext.jsx'
import { canAccess, landingRoute } from './lib/rbac.js'
import { LogoMark } from './components/Logo.jsx'

function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-950">
      <LogoMark size={44} className="animate-pulse" />
      <p className="text-sm text-slate-400">Loading TransitOps…</p>
    </div>
  )
}

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return children
}

// Guards a route by the current user's role.
function RoleRoute({ children }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!canAccess(user?.role, location.pathname)) {
    return <Navigate to={landingRoute(user?.role)} replace />
  }
  return children
}

function LandingRedirect() {
  const { user } = useAuth()
  return <Navigate to={landingRoute(user?.role)} replace />
}

function App() {
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
          <Route path="/" element={<LandingRedirect />} />
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
