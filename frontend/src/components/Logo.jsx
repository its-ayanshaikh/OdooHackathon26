// TransitOps logo — a route/waypoint mark + wordmark.

export function LogoMark({ size = 32, className = '' }) {
  const id = 'to-grad'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="TransitOps"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fbbf24" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#${id})`} />
      {/* dotted route */}
      <path
        d="M9 22.5C9 16 23 17 23 9.5"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeDasharray="0.2 5"
      />
      {/* origin node */}
      <circle cx="9" cy="22.5" r="3.1" fill="white" />
      {/* destination pin */}
      <circle cx="23" cy="9.5" r="3.6" fill="white" />
      <circle cx="23" cy="9.5" r="1.5" fill="#f59e0b" />
    </svg>
  )
}

export function Logo({ size = 32, showText = true, className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      {showText && (
        <span className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
          Transit<span className="text-amber-500">Ops</span>
        </span>
      )}
    </div>
  )
}
