import { createContext, useContext, useCallback, useState } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

const CONFIG = {
  success: {
    icon: CheckCircle2,
    ring: 'text-emerald-500',
    bar: 'bg-emerald-500',
  },
  error: {
    icon: XCircle,
    ring: 'text-red-500',
    bar: 'bg-red-500',
  },
  info: {
    icon: Info,
    ring: 'text-amber-500',
    bar: 'bg-amber-500',
  },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const push = useCallback(
    (message, type = 'info') => {
      const id = Date.now() + Math.random()
      setToasts((t) => [...t, { id, message, type }])
      setTimeout(() => remove(id), 3500)
    },
    [remove],
  )

  const toast = {
    success: (m) => push(m, 'success'),
    error: (m) => push(m, 'error'),
    info: (m) => push(m, 'info'),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:bottom-4 sm:right-4 sm:left-auto sm:items-end sm:p-0">
        {toasts.map((t) => {
          const cfg = CONFIG[t.type]
          const Icon = cfg.icon
          return (
            <div
              key={t.id}
              className="animate-sheet pointer-events-auto flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white pr-3 shadow-lg shadow-slate-900/5 dark:border-slate-700 dark:bg-slate-800"
            >
              <div className={`w-1 self-stretch ${cfg.bar}`} />
              <Icon size={20} className={`mt-3 shrink-0 ${cfg.ring}`} />
              <p className="flex-1 py-3 text-sm font-medium text-slate-700 dark:text-slate-100">
                {t.message}
              </p>
              <button
                onClick={() => remove(t.id)}
                className="mt-3 shrink-0 rounded p-0.5 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={15} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
