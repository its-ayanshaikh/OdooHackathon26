// Role-Based Access Control configuration.
// Each role maps to the set of route paths it can access.

export const ROLE_ACCESS = {
  Admin: [
    '/dashboard',
    '/vehicles',
    '/drivers',
    '/trips',
    '/maintenance',
    '/expenses',
    '/reports',
    '/settings',
  ],
  'Fleet Manager': ['/dashboard', '/vehicles', '/trips', '/maintenance', '/reports', '/settings'],
  Driver: ['/dashboard', '/trips', '/settings'],
  'Safety Officer': ['/dashboard', '/drivers', '/settings'],
  'Financial Analyst': ['/dashboard', '/expenses', '/reports', '/settings'],
}

export function canAccess(role, path) {
  const allowed = ROLE_ACCESS[role]
  if (!allowed) return false
  return allowed.includes(path)
}

// The first landing route allowed for a role (used for redirects).
export function landingRoute(role) {
  const allowed = ROLE_ACCESS[role]
  return allowed?.[0] || '/dashboard'
}
