import { useMemo, useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { useToast } from '../components/Toast.jsx'
import {
  Badge,
  Button,
  Panel,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  EmptyRow,
  FilterBar,
  FilterSelect,
  SearchInput,
} from '../components/ui.jsx'
import { Plus, Download, Search, Pencil, Trash2 } from 'lucide-react'
import { DRIVER_STATUS, LICENSE_CATEGORIES } from '../data/seed.js'
import { isLicenseExpired, daysUntilExpiry } from '../store/selectors.js'
import { exportToCsv } from '../utils/csv.js'

const emptyDriver = {
  name: '',
  licenseNumber: '',
  licenseCategory: 'LMV',
  licenseExpiry: '',
  contact: '',
  safetyScore: 80,
  status: 'Available',
}

function ScoreBar({ score }) {
  const color =
    score >= 85 ? 'bg-emerald-500' : score >= 70 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div className={`h-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-medium">{score}</span>
    </div>
  )
}

function Drivers() {
  const { state, dispatch } = useApp()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyDriver)

  const openAdd = () => {
    setEditing(null)
    setForm(emptyDriver)
    setModalOpen(true)
  }
  const openEdit = (d) => {
    setEditing(d)
    setForm(d)
    setModalOpen(true)
  }
  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const save = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Driver name is required.')
    if (!form.licenseExpiry) return toast.error('License expiry date is required.')
    const dup = state.drivers.some(
      (d) =>
        d.licenseNumber.toLowerCase() === form.licenseNumber.trim().toLowerCase() &&
        d.id !== editing?.id,
    )
    if (dup) return toast.error('License number already exists.')

    const payload = { ...form, safetyScore: Number(form.safetyScore) }
    if (editing) {
      dispatch({ type: 'UPDATE_DRIVER', driver: { ...payload, id: editing.id } })
      toast.success('Driver updated.')
    } else {
      dispatch({ type: 'ADD_DRIVER', driver: payload })
      toast.success('Driver added.')
    }
    setModalOpen(false)
  }

  const remove = (d) => {
    if (d.status === 'On Trip')
      return toast.error('Cannot delete a driver who is on a trip.')
    if (window.confirm(`Delete driver ${d.name}?`)) {
      dispatch({ type: 'DELETE_DRIVER', id: d.id })
      toast.info('Driver deleted.')
    }
  }

  const rows = useMemo(
    () =>
      state.drivers.filter(
        (d) =>
          (statusFilter === 'all' || d.status === statusFilter) &&
          (d.name.toLowerCase().includes(search.toLowerCase()) ||
            d.licenseNumber.toLowerCase().includes(search.toLowerCase())),
      ),
    [state.drivers, search, statusFilter],
  )

  const doExport = () =>
    exportToCsv(
      'drivers.csv',
      rows.map((d) => ({
        Name: d.name,
        License: d.licenseNumber,
        Category: d.licenseCategory,
        Expiry: d.licenseExpiry,
        Contact: d.contact,
        Safety_Score: d.safetyScore,
        Status: d.status,
      })),
    )

  return (
    <div>
      <PageHeader
        title="Driver Management"
        subtitle="Driver profiles, license validity, and safety scores"
        actions={
          <>
            <Button variant="secondary" icon={Download} onClick={doExport}>
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button icon={Plus} onClick={openAdd}>
              Add Driver
            </Button>
          </>
        }
      />

      <FilterBar>
        <SearchInput
          icon={Search}
          placeholder="Search name or license…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64"
        />
        <FilterSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          {DRIVER_STATUS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </FilterSelect>
      </FilterBar>

      <Panel className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">License</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Expiry</th>
              <th className="px-4 py-3">Safety</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.length === 0 ? (
              <EmptyRow colSpan={7} message="No drivers match your filters." />
            ) : (
              rows.map((d) => {
                const expired = isLicenseExpired(d)
                const days = daysUntilExpiry(d)
                return (
                  <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{d.name}</div>
                      <div className="text-xs text-slate-400">{d.contact}</div>
                    </td>
                    <td className="px-4 py-3">{d.licenseNumber}</td>
                    <td className="px-4 py-3">{d.licenseCategory}</td>
                    <td className="px-4 py-3">
                      <div>{d.licenseExpiry}</div>
                      {expired ? (
                        <span className="text-xs font-medium text-red-500">
                          Expired
                        </span>
                      ) : days <= 60 ? (
                        <span className="text-xs font-medium text-amber-500">
                          {days} days left
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <ScoreBar score={d.safetyScore} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge status={d.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" onClick={() => openEdit(d)} title="Edit">
                          <Pencil size={16} />
                        </Button>
                        <Button variant="ghost" onClick={() => remove(d)} title="Delete">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </Panel>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Driver' : 'Add Driver'}
      >
        <form onSubmit={save} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field label="Full Name">
              <Input
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                required
              />
            </Field>
          </div>
          <Field label="License Number">
            <Input
              value={form.licenseNumber}
              onChange={(e) => setField('licenseNumber', e.target.value)}
              required
            />
          </Field>
          <Field label="License Category">
            <Select
              value={form.licenseCategory}
              onChange={(e) => setField('licenseCategory', e.target.value)}
            >
              {LICENSE_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="License Expiry">
            <Input
              type="date"
              value={form.licenseExpiry}
              onChange={(e) => setField('licenseExpiry', e.target.value)}
              required
            />
          </Field>
          <Field label="Contact Number">
            <Input
              value={form.contact}
              onChange={(e) => setField('contact', e.target.value)}
            />
          </Field>
          <Field label={`Safety Score: ${form.safetyScore}`}>
            <input
              type="range"
              min="0"
              max="100"
              value={form.safetyScore}
              onChange={(e) => setField('safetyScore', e.target.value)}
              className="w-full accent-amber-500"
            />
          </Field>
          <Field label="Status">
            <Select
              value={form.status}
              onChange={(e) => setField('status', e.target.value)}
            >
              {DRIVER_STATUS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </Field>
          <div className="col-span-2 mt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">{editing ? 'Save Changes' : 'Add Driver'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Drivers
