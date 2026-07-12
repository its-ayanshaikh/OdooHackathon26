import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/AuthContext.jsx'
import { useToast } from '../components/Toast.jsx'
import { LogoMark } from '../components/Logo.jsx'
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../lib/demoAccounts.js'
import { Loader2 } from 'lucide-react'

function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const toast = useToast()
  const [email, setEmail] = useState('admin@transitops.com')
  const [password, setPassword] = useState(DEMO_PASSWORD)
  const [busy, setBusy] = useState(false)

  const doLogin = async (mail, pass) => {
    setBusy(true)
    try {
      const user = await login(mail, pass)
      toast.success(`Welcome, ${user.name || user.email}`)
      navigate('/')
    } catch (err) {
      toast.error(err.message || 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    doLogin(email.trim(), password)
  }

  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-slate-900 p-12 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="relative flex items-center gap-2.5">
          <LogoMark size={36} />
          <span className="text-xl font-semibold text-white">
            Transit<span className="text-amber-400">Ops</span>
          </span>
        </div>
        <div className="relative">
          <h2 className="text-4xl font-semibold leading-tight">
            Smart Transport
            <br />
            Operations Platform
          </h2>
          <p className="mt-4 max-w-md text-slate-300">
            Manage vehicles, drivers, trips, maintenance, and expenses from one
            centralized dashboard — with automatic status transitions and
            business-rule enforcement.
          </p>
          <div className="mt-8 flex gap-8">
            <div>
              <p className="text-3xl font-bold text-amber-400">8</p>
              <p className="text-sm text-slate-400">Vehicles</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-400">7</p>
              <p className="text-sm text-slate-400">Drivers</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-400">6</p>
              <p className="text-sm text-slate-400">Trips</p>
            </div>
          </div>
        </div>
        <p className="relative text-sm text-slate-400">© 2026 TransitOps</p>
      </div>

      {/* Form */}
      <div className="flex w-full items-center justify-center bg-slate-50 p-8 dark:bg-slate-950 lg:w-1/2">
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <div className="mb-6 flex items-center justify-center gap-2.5 lg:hidden">
            <LogoMark size={34} />
            <span className="text-xl font-semibold text-slate-900 dark:text-white">
              Transit<span className="text-amber-500">Ops</span>
            </span>
          </div>
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <h1 className="mb-1 text-2xl font-semibold text-slate-900 dark:text-white">
              Sign in
            </h1>
            <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
              Enter your credentials to continue
            </p>

            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="mb-4 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />

            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mb-6 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60"
            >
              {busy && <Loader2 size={16} className="animate-spin" />}
              Sign in
            </button>
          </form>

          <div className="mt-5">
            <p className="mb-2 text-center text-xs uppercase tracking-wide text-slate-400">
              Quick demo login (RBAC)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((u) => (
                <button
                  key={u.email}
                  disabled={busy}
                  onClick={() => doLogin(u.email, DEMO_PASSWORD)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs transition hover:border-amber-400 hover:bg-amber-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                >
                  <span className="block font-semibold text-slate-800 dark:text-slate-100">
                    {u.role}
                  </span>
                  <span className="text-slate-400">{u.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
