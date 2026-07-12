// Role-Based Access Control configuration.
// Each role maps to the set of route paths it can access.

export const ROLE_ACCESS = {
  'Fleet Manager': ['/dashboard', '/vehicles', '/trips', '/maintenance', '/reports'],
  Driver: ['/dashboard', '/trips'],
  'Safety Officer': ['/dashboard', '/drivers'],
  'Financial Analyst': ['/dashboard', '/expenses', '/reports'],
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
