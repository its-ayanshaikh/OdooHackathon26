import { useEffect } from 'react'
import { X } from 'lucide-react'

/* ---------------- Status Badge ---------------- */
const STATUS_STYLES = {
  Available: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20',
  'On Trip': 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-400/20',
  'In Shop': 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-400/20',
  Retired: 'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-700/40 dark:text-slate-300 dark:ring-slate-400/20',
  'Off Duty': 'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-700/40 dark:text-slate-300 dark:ring-slate-400/20',
  Suspended: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-400/20',
  Draft: 'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-700/40 dark:text-slate-300 dark:ring-slate-400/20',
  Dispatched: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-400/20',
  Completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20',
  Cancelled: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-400/20',
  Active: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-400/20',
  Closed: 'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-700/40 dark:text-slate-300 dark:ring-slate-400/20',
}

export function Badge({ status, children }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.Draft
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {children || status}
    </span>
  )
}

/* ---------------- Buttons ---------------- */
export function Button({ variant = 'primary', className = '', icon: Icon, children, ...props }) {
  const variants = {
    primary: 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm shadow-amber-500/20',
    secondary:
      'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    ghost:
      'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
  }
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon size={16} strokeWidth={2} />}
      {children}
    </button>
  )
}

/* ---------------- Panel (flat surface, not a card) ---------------- */
export function Panel({ className = '', children }) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      {children}
    </div>
  )
}

export function PanelHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800 sm:px-5">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
        {title}
      </h3>
      {action}
    </div>
  )
}

/* ---------------- Stat strip: unified grid with dividers ---------------- */
export function StatGrid({ children }) {
  return (
    <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-4">
      {children}
    </div>
  )
}

const ACCENTS = {
  amber: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10',
  blue: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10',
  emerald: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10',
  red: 'text-red-500 bg-red-50 dark:bg-red-500/10',
  slate: 'text-slate-500 bg-slate-100 dark:bg-slate-700/40',
}

export function Stat({ label, value, sub, accent = 'slate', icon: Icon }) {
  return (
    <div className="flex items-start gap-3 p-4">
      {Icon && (
        <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${ACCENTS[accent]}`}>
          <Icon size={18} strokeWidth={2} />
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <p className="mt-0.5 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
          {value}
        </p>
        {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  )
}

/* ---------------- Modal ---------------- */
export function Modal({ open, onClose, title, children, wide = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative z-10 w-full ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'} max-h-[92vh] overflow-y-auto rounded-t-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:rounded-2xl sm:p-6`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

/* ---------------- Form fields ---------------- */
export function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  )
}

const inputBase =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 dark:border-slate-700 dark:bg-slate-800 dark:text-white'

export function Input({ className = '', ...props }) {
  return <input className={`${inputBase} ${className}`} {...props} />
}

export function Select({ className = '', children, ...props }) {
  return (
    <select className={`${inputBase} ${className}`} {...props}>
      {children}
    </select>
  )
}

export function Textarea({ className = '', ...props }) {
  return <textarea className={`${inputBase} ${className}`} {...props} />
}

/* ---------------- Compact filter controls ---------------- */
export function FilterBar({ children }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">{children}</div>
  )
}

const filterCtl =
  'h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'

export function FilterSelect({ className = '', children, ...props }) {
  return (
    <select className={`${filterCtl} cursor-pointer ${className}`} {...props}>
      {children}
    </select>
  )
}

export function SearchInput({ icon: Icon, className = '', ...props }) {
  return (
    <div className={`relative ${className}`}>
      {Icon && (
        <Icon
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
      )}
      <input className={`${filterCtl} w-full ${Icon ? 'pl-9' : ''}`} {...props} />
    </div>
  )
}

/* ---------------- Page header ---------------- */
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

/* ---------------- Empty state ---------------- */
export function EmptyRow({ colSpan, message = 'No records found.' }) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-4 py-12 text-center text-sm text-slate-400"
      >
        {message}
      </td>
    </tr>
  )
}
