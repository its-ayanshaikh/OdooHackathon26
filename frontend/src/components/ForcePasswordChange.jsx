import { useState } from 'react'
import { KeyRound, Loader2, ShieldAlert } from 'lucide-react'
import { useAuth } from '../store/AuthContext.jsx'
import { useToast } from './Toast.jsx'
import { Field, Input, Button } from './ui.jsx'

// Mandatory password change on first login. Cannot be dismissed and reappears
// on refresh until the user changes their initial password.
function ForcePasswordChange() {
  const { user, changePassword } = useAuth()
  const toast = useToast()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)

  if (!user?.first_time_login) return null

  const submit = async (e) => {
    e.preventDefault()
    if (newPassword.length < 6) return toast.error('New password must be at least 6 characters.')
    if (newPassword !== confirm) return toast.error('Passwords do not match.')
    setBusy(true)
    try {
      await changePassword(oldPassword, newPassword)
      toast.success('Password updated. Welcome aboard!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <div className="animate-sheet relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-amber-500 dark:bg-amber-500/10">
            <ShieldAlert size={22} />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Set a new password</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              For your security, please change your initial password.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <Field label="Current password" hint="This is the password you just logged in with.">
            <Input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              autoFocus
            />
          </Field>
          <Field label="New password">
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </Field>
          <Field label="Confirm new password">
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </Field>
          <Button type="submit" icon={busy ? undefined : KeyRound} disabled={busy} className="w-full">
            {busy && <Loader2 size={16} className="animate-spin" />}
            Update password
          </Button>
        </form>
      </div>
    </div>
  )
}

export default ForcePasswordChange
