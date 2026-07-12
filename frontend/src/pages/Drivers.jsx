import { useMemo, useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { useToast } from '../components/Toast.jsx'
import {
  Badge,
  Button,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  FilterBar,
  FilterSelect,
  SearchInput,
  ResponsiveTable,
} from '../components/ui.jsx'
import { Plus, Download, Search, Pencil, Trash2, Users } from 'lucide-react'
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
  const { state, addDriver, updateDriver, deleteDriver } = useApp()
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

  const save = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Driver name is required.')
    if (!form.licenseExpiry) return toast.error('License expiry date is required.')

    const payload = { ...form, safetyScore: Number(form.safetyScore) }
    try {
      if (editing) {
        await updateDriver(editing.id, payload)
        toast.success('Driver updated.')
      } else {
        await addDriver(payload)
        toast.success('Driver added.')
      }
      setModalOpen(false)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const remove = async (d) => {
    if (!window.confirm(`Delete driver ${d.name}?`)) return
    try {
      await deleteDriver(d.id)
      toast.info('Driver deleted.')
    } catch (err) {
      toast.error(err.message)
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

      <ResponsiveTable
        rows={rows}
        rowKey={(d) => d.id}
        empty="No drivers match your filters."
        emptyIcon={Users}
        columns={[
          { header: 'Name', primary: true, cell: (d) => d.name },
          { header: 'Status', headerRight: true, cell: (d) => <Badge status={d.status} /> },
          { header: 'License', secondary: true, cell: (d) => d.licenseNumber },
          { header: 'Contact', cell: (d) => d.contact },
          { header: 'Category', cell: (d) => d.licenseCategory },
          {
            header: 'Expiry',
            cell: (d) => {
              const expired = isLicenseExpired(d)
              const days = daysUntilExpiry(d)
              return (
                <div>
                  <div>{d.licenseExpiry}</div>
                  {expired ? (
                    <span className="text-xs font-medium text-red-500">Expired</span>
                  ) : days <= 60 ? (
                    <span className="text-xs font-medium text-amber-500">
                      {days} days left
                    </span>
                  ) : null}
                </div>
              )
            },
          },
          { header: 'Safety', cell: (d) => <ScoreBar score={d.safetyScore} /> },
        ]}
        actions={(d) => (
          <>
            <Button variant="ghost" onClick={() => openEdit(d)} title="Edit">
              <Pencil size={16} />
            </Button>
            <Button variant="ghost" onClick={() => remove(d)} title="Delete">
              <Trash2 size={16} />
            </Button>
          </>
        )}
      />

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
