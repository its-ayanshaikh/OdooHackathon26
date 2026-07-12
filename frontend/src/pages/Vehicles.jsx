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
import { Plus, Download, Search, Pencil, Trash2, Truck } from 'lucide-react'
import { VEHICLE_TYPES, REGIONS, VEHICLE_STATUS } from '../data/seed.js'
import { num } from '../utils/format.js'
import { exportToCsv } from '../utils/csv.js'

const emptyVehicle = {
  regNumber: '',
  name: '',
  type: 'Van',
  maxCapacity: '',
  odometer: '',
  acquisitionCost: '',
  status: 'Available',
  region: 'West',
}

function Vehicles() {
  const { state, dispatch } = useApp()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('regNumber')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyVehicle)

  const openAdd = () => {
    setEditing(null)
    setForm(emptyVehicle)
    setModalOpen(true)
  }

  const openEdit = (v) => {
    setEditing(v)
    setForm(v)
    setModalOpen(true)
  }

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const save = (e) => {
    e.preventDefault()
    const reg = form.regNumber.trim()
    if (!reg) return toast.error('Registration number is required.')

    // Unique registration number rule
    const duplicate = state.vehicles.some(
      (v) => v.regNumber.toLowerCase() === reg.toLowerCase() && v.id !== editing?.id,
    )
    if (duplicate) return toast.error('Registration number must be unique.')

    const payload = {
      ...form,
      regNumber: reg,
      maxCapacity: Number(form.maxCapacity),
      odometer: Number(form.odometer),
      acquisitionCost: Number(form.acquisitionCost),
    }

    if (editing) {
      dispatch({ type: 'UPDATE_VEHICLE', vehicle: { ...payload, id: editing.id } })
      toast.success('Vehicle updated.')
    } else {
      dispatch({ type: 'ADD_VEHICLE', vehicle: payload })
      toast.success('Vehicle added.')
    }
    setModalOpen(false)
  }

  const remove = (v) => {
    if (v.status === 'On Trip')
      return toast.error('Cannot delete a vehicle that is on a trip.')
    if (window.confirm(`Delete vehicle ${v.regNumber}?`)) {
      dispatch({ type: 'DELETE_VEHICLE', id: v.id })
      toast.info('Vehicle deleted.')
    }
  }

  const rows = useMemo(() => {
    let list = state.vehicles.filter(
      (v) =>
        (typeFilter === 'all' || v.type === typeFilter) &&
        (statusFilter === 'all' || v.status === statusFilter) &&
        (v.regNumber.toLowerCase().includes(search.toLowerCase()) ||
          v.name.toLowerCase().includes(search.toLowerCase())),
    )
    list = [...list].sort((a, b) => {
      if (sortBy === 'odometer' || sortBy === 'acquisitionCost')
        return b[sortBy] - a[sortBy]
      return String(a[sortBy]).localeCompare(String(b[sortBy]))
    })
    return list
  }, [state.vehicles, search, typeFilter, statusFilter, sortBy])

  const doExport = () =>
    exportToCsv(
      'vehicles.csv',
      rows.map((v) => ({
        Registration: v.regNumber,
        Model: v.name,
        Type: v.type,
        Capacity_kg: v.maxCapacity,
        Odometer: v.odometer,
        Acquisition_Cost: v.acquisitionCost,
        Region: v.region,
        Status: v.status,
      })),
    )

  return (
    <div>
      <PageHeader
        title="Vehicle Registry"
        subtitle="Master list of all fleet vehicles"
        actions={
          <>
            <Button variant="secondary" icon={Download} onClick={doExport}>
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button icon={Plus} onClick={openAdd}>
              Add Vehicle
            </Button>
          </>
        }
      />

      {/* Toolbar */}
      <FilterBar>
        <SearchInput
          icon={Search}
          placeholder="Search reg. number or model…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64"
        />
        <FilterSelect value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">All types</option>
          {VEHICLE_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </FilterSelect>
        <FilterSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          {VEHICLE_STATUS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </FilterSelect>
        <FilterSelect value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="regNumber">Sort: Reg. No.</option>
          <option value="name">Sort: Model</option>
          <option value="odometer">Sort: Odometer</option>
          <option value="acquisitionCost">Sort: Cost</option>
        </FilterSelect>
      </FilterBar>

      <ResponsiveTable
        rows={rows}
        rowKey={(v) => v.id}
        empty="No vehicles match your filters."
        emptyIcon={Truck}
        columns={[
          { header: 'Registration', primary: true, cell: (v) => v.regNumber },
          { header: 'Status', headerRight: true, cell: (v) => <Badge status={v.status} /> },
          { header: 'Model', secondary: true, cell: (v) => v.name },
          { header: 'Type', cell: (v) => v.type },
          { header: 'Capacity', cell: (v) => `${num(v.maxCapacity)} kg` },
          { header: 'Odometer', cell: (v) => `${num(v.odometer)} km` },
          { header: 'Region', cell: (v) => v.region },
        ]}
        actions={(v) => (
          <>
            <Button variant="ghost" onClick={() => openEdit(v)} title="Edit">
              <Pencil size={16} />
            </Button>
            <Button variant="ghost" onClick={() => remove(v)} title="Delete">
              <Trash2 size={16} />
            </Button>
          </>
        )}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Vehicle' : 'Add Vehicle'}
      >
        <form onSubmit={save} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field label="Registration Number">
              <Input
                value={form.regNumber}
                onChange={(e) => setField('regNumber', e.target.value)}
                placeholder="MH-01-AB-1234"
                required
              />
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="Vehicle Name / Model">
              <Input
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                required
              />
            </Field>
          </div>
          <Field label="Type">
            <Select
              value={form.type}
              onChange={(e) => setField('type', e.target.value)}
            >
              {VEHICLE_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <Field label="Region">
            <Select
              value={form.region}
              onChange={(e) => setField('region', e.target.value)}
            >
              {REGIONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </Select>
          </Field>
          <Field label="Max Load Capacity (kg)">
            <Input
              type="number"
              value={form.maxCapacity}
              onChange={(e) => setField('maxCapacity', e.target.value)}
              required
            />
          </Field>
          <Field label="Odometer (km)">
            <Input
              type="number"
              value={form.odometer}
              onChange={(e) => setField('odometer', e.target.value)}
              required
            />
          </Field>
          <Field label="Acquisition Cost (₹)">
            <Input
              type="number"
              value={form.acquisitionCost}
              onChange={(e) => setField('acquisitionCost', e.target.value)}
              required
            />
          </Field>
          <Field label="Status">
            <Select
              value={form.status}
              onChange={(e) => setField('status', e.target.value)}
            >
              {VEHICLE_STATUS.map((s) => (
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
            <Button type="submit">{editing ? 'Save Changes' : 'Add Vehicle'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Vehicles
