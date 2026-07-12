// API client for the TransitOps backend.
// Uses cookie-based JWT auth. Access token expiry is handled transparently
// by retrying the request once after hitting the /auth/refresh/ endpoint.

const API_BASE =
  import.meta.env.VITE_API_URL ||
  `http://${window.location.hostname}:8000/api`

let refreshing = null // de-dupe concurrent refreshes

async function tryRefresh() {
  if (!refreshing) {
    refreshing = fetch(`${API_BASE}/auth/refresh/`, {
      method: 'POST',
      credentials: 'include',
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshing = null
      })
  }
  return refreshing
}

async function request(path, { method = 'GET', body, retry = true } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })

  // Access token likely expired -> refresh once, then retry.
  const isAuthEndpoint =
    path.startsWith('/auth/login') || path.startsWith('/auth/refresh')
  if (res.status === 401 && retry && !isAuthEndpoint) {
    const ok = await tryRefresh()
    if (ok) return request(path, { method, body, retry: false })
  }
  return res
}

async function parse(res) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.detail || 'Request failed')
  }
  return data
}

export const api = {
  base: API_BASE,

  async login(email, password) {
    const res = await request('/auth/login/', {
      method: 'POST',
      body: { email, password },
    })
    return parse(res)
  },

  async logout() {
    await request('/auth/logout/', { method: 'POST', retry: false })
  },

  async me() {
    const res = await request('/auth/me/')
    return parse(res)
  },

  async changePassword(oldPassword, newPassword) {
    const res = await request('/auth/change-password/', {
      method: 'POST',
      body: { old_password: oldPassword, new_password: newPassword },
    })
    return parse(res)
  },

  // Admin only
  async listUsers() {
    const res = await request('/users/')
    return parse(res)
  },

  async createUser({ email, name, role, password }) {
    const res = await request('/users/', {
      method: 'POST',
      body: { email, name, role, password },
    })
    return parse(res)
  },

  async resetUserPassword(userId, newPassword, forceChange = true) {
    const res = await request('/users/reset-password/', {
      method: 'POST',
      body: { user_id: userId, new_password: newPassword, force_change: forceChange },
    })
    return parse(res)
  },
}
