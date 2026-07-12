import {
  LayoutDashboard,
  Truck,
  Users,
  Route,
  Wrench,
  Fuel,
  BarChart3,
  Settings,
} from 'lucide-react'

export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/vehicles', label: 'Fleet', icon: Truck },
  { to: '/drivers', label: 'Drivers', icon: Users },
  { to: '/trips', label: 'Trips', icon: Route },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench },
  { to: '/expenses', label: 'Fuel & Expenses', icon: Fuel },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
]
