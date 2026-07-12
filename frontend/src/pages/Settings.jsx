import { useEffect, useState, useCallback } from 'react'
import { KeyRound, UserPlus, Users, RotateCcw, Loader2 } from 'lucide-react'
import { useAuth } from '../store/AuthContext.jsx'
import { useToast } from '../components/Toast.jsx'
import { api } from '../lib/api.js'
import {
  PageHeader,
  Panel,
  PanelHeader,
  Field,
  Input,
  Select,
  Button,
  Badge,
  Modal,
  ResponsiveTable,
} from '../components/ui.jsx'

// Drivers are created from the Drivers section (which provisions their login),
// so 'Driver' is intentionally not offered here.
const ROLES = ['Admin', 'Fleet Manager', 'Safety Officer', 'Financial Analyst']

function ChangePasswordCard() {
  const { changePassword } = useAuth()
  const toast = useToast()
  const [form, setForm] = useState({ old: '', next: '', confirm: '' })
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    if (form.next.length < 6) return toast.error('New password must be at least 6 characters.')
    if (form.next !== form.confirm) return toast.error('Passwords do not match.')
    setBusy(true)
    try {
      await changePassword(form.old, form.next)
      toast.success('Password changed.')
      setForm({ old: '', next: '', confirm: '' })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel>
      <PanelHeader title="Change Password" />
      <form onSubmit={submit} className="grid gap-4 p-5 sm:max-w-md">
        <Field label="Current password">
          <Input type="password" value={form.old} onChange={(e) => set('old', e.target.value)} required />
        </Field>
        <Field label="New password">
          <Input type="password" value={form.next} onChange={(e) => set('next', e.target.value)} required />
        </Field>
        <Field label="Confirm new password">
          <Input type="password" value={form.confirm} onChange={(e) => set('confirm', e.target.value)} required />
        </Field>
        <div>
          <Button type="submit" icon={busy ? undefined : KeyRound} disabled={busy}>
            {busy && <Loader2 size={16} className="animate-spin" />}
            Update password
          </Button>
        </div>
      </form>
    </Panel>
  )
}

function UserManagement() {
  const toast = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [resetting, setResetting] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', role: 'Driver', password: '' })
  const [resetPw, setResetPw] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.listUsers()
      setUsers(data.users)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const createUser = async (e) => {
    e.preventDefault()
    try {
      await api.createUser(form)
      toast.success('User created. They must change their password on first login.')
      setCreateOpen(false)
      setForm({ name: '', email: '', role: 'Driver', password: '' })
      load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const doReset = async (e) => {
    e.preventDefault()
    if (resetPw.length < 6) return toast.error('Password must be at least 6 characters.')
    try {
      await api.resetUserPassword(resetting.id, resetPw, true)
      toast.success(`Password reset for ${resetting.email}.`)
      setResetting(null)
      setResetPw('')
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
          <Users size={16} /> User Management
        </h3>
        <Button icon={UserPlus} onClick={() => setCreateOpen(true)}>
          Add User
        </Button>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-400">Loading users…</p>
      ) : (
        <ResponsiveTable
          rows={users}
          rowKey={(u) => u.id}
          empty="No users found."
          emptyIcon={Users}
          columns={[
            { header: 'Name', primary: true, cell: (u) => u.name || '—' },
            { header: 'Role', headerRight: true, cell: (u) => <Badge status="Available">{u.role}</Badge> },
            { header: 'Email', secondary: true, cell: (u) => u.email },
            {
              header: 'Status',
              cell: (u) =>
                u.first_time_login ? (
                  <span className="text-xs text-amber-500">Pending password change</span>
                ) : (
                  <span className="text-xs text-emerald-500">Active</span>
                ),
            },
          ]}
          actions={(u) => (
            <Button variant="secondary" icon={RotateCcw} onClick={() => setResetting(u)}>
              Reset Password
            </Button>
          )}
        />
      )}

      {/* Create user modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add User">
        <form onSubmit={createUser} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field label="Full Name">
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
            </Field>
          </div>
          <Field label="Role">
            <Select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
              {ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </Select>
          </Field>
          <Field label="Temp. Password" hint="User changes it on first login.">
            <Input value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required />
          </Field>
          <div className="col-span-2 mt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create User</Button>
          </div>
        </form>
      </Modal>

      {/* Reset password modal */}
      <Modal
        open={!!resetting}
        onClose={() => setResetting(null)}
        title={resetting ? `Reset password — ${resetting.email}` : 'Reset password'}
      >
        <form onSubmit={doReset} className="grid gap-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Set a new password for this user. They'll be asked to change it on next login.
          </p>
          <Field label="New password">
            <Input value={resetPw} onChange={(e) => setResetPw(e.target.value)} required />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setResetting(null)}>
              Cancel
            </Button>
            <Button type="submit">Reset Password</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function Settings() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'Admin' || user?.is_superuser

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your account and, if you're an admin, other users" />
      <ChangePasswordCard />
      {isAdmin && <UserManagement />}
    </div>
  )
}

export default Settings
