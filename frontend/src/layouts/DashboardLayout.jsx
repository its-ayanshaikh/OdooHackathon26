import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import {
  Sun,
  Moon,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
} from 'lucide-react'
import { useAuth } from '../store/AuthContext.jsx'
import { NAV_ITEMS } from '../lib/navItems.js'
import { ROLE_ACCESS } from '../lib/rbac.js'
import { Logo, LogoMark } from '../components/Logo.jsx'
import ForcePasswordChange from '../components/ForcePasswordChange.jsx'

function useTheme() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])
  return [dark, setDark]
}

function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [dark, setDark] = useTheme()
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('sidebar') === 'collapsed',
  )
  const [userMenu, setUserMenu] = useState(false)

  const navItems = useMemo(() => {
    const allowed = ROLE_ACCESS[user?.role] || []
    return NAV_ITEMS.filter((i) => allowed.includes(i.to))
  }, [user?.role])

  const toggleCollapse = () => {
    setCollapsed((c) => {
      localStorage.setItem('sidebar', !c ? 'collapsed' : 'expanded')
      return !c
    })
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const linkClass = ({ isActive }) =>
    `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
      isActive
        ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/25'
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
    }`

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* ============ Desktop sidebar ============ */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-slate-200 bg-white transition-all duration-200 dark:border-slate-800 dark:bg-slate-900 md:flex ${
          collapsed ? 'w-[76px]' : 'w-64'
        }`}
      >
        <div
          className={`flex h-16 items-center border-b border-slate-200 px-4 dark:border-slate-800 ${
            collapsed ? 'justify-center' : 'justify-between'
          }`}
        >
          {collapsed ? <LogoMark size={30} /> : <Logo size={30} />}
          <button
            onClick={toggleCollapse}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={linkClass} title={label}>
              <Icon size={20} strokeWidth={2} className="shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
              {collapsed && (
                <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition group-hover:opacity-100 dark:bg-slate-700">
                  {label}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-3 dark:border-slate-800">
          <button
            onClick={handleLogout}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 ${
              collapsed ? 'justify-center' : ''
            }`}
            title="Sign out"
          >
            <LogOut size={20} className="shrink-0" />
            {!collapsed && 'Sign out'}
          </button>
        </div>
      </aside>

      {/* ============ Main column ============ */}
      <div
        className={`flex min-h-screen flex-col transition-all duration-200 ${
          collapsed ? 'md:pl-[76px]' : 'md:pl-64'
        }`}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 sm:px-6">
          {/* Mobile brand */}
          <Logo size={30} className="md:hidden" />
          {/* Desktop role label */}
          <div className="hidden md:block">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {user?.role}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDark((v) => !v)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
              title="Toggle theme"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenu((v) => !v)}
                className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <div className="grid h-8 w-8 place-items-center rounded-full bg-amber-500 text-sm font-semibold text-white">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <span className="hidden text-sm font-medium sm:block">
                  {user?.name}
                </span>
                <ChevronDown size={16} className="text-slate-400" />
              </button>
              {userMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setUserMenu(false)}
                  />
                  <div className="absolute right-0 z-20 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                    <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                      <p className="text-sm font-medium">{user?.name}</p>
                      <p className="text-xs text-slate-400">{user?.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <LogOut size={16} /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 pb-24 sm:p-6 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* ============ Mobile bottom navigation ============ */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90 md:hidden">
        <div
          className="mx-auto grid max-w-lg"
          style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}
        >
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition ${
                  isActive
                    ? 'text-amber-500'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`grid h-8 w-12 place-items-center rounded-full transition ${
                      isActive ? 'bg-amber-50 dark:bg-amber-500/10' : ''
                    }`}
                  >
                    <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
                  </span>
                  <span className="max-w-[60px] truncate">{label.split(' ')[0]}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Mandatory first-login password change */}
      <ForcePasswordChange />
    </div>
  )
}

export default DashboardLayout
