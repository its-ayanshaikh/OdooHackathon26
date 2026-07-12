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
  Textarea,
  FilterBar,
  FilterSelect,
  ResponsiveTable,
} from '../components/ui.jsx'
import { Plus, CircleCheck, Wrench } from 'lucide-react'
import { getVehicle } from '../store/selectors.js'
import { inr } from '../utils/format.js'

const MAINT_TYPES = [
  'Oil Change',
  'Tyre Replacement',
  'Brake Service',
  'Engine Overhaul',
  'Electrical',
  'Bodywork',
  'General Service',
]

function Maintenance() {
  const { state, dispatch } = useApp()
  const toast = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [form, setForm] = useState({
    vehicleId: '',
    type: 'Oil Change',
    description: '',
    cost: '',
    date: new Date().toISOString().slice(0, 10),
    status: 'Active',
  })

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  // Cannot put an on-trip or retired vehicle into maintenance
  const eligibleVehicles = state.vehicles.filter(
    (v) => v.status === 'Available' || v.status === 'In Shop',
  )

  const create = (e) => {
    e.preventDefault()
    if (!form.vehicleId) return toast.error('Select a vehicle.')
    dispatch({
      type: 'ADD_MAINTENANCE',
      record: { ...form, cost: Number(form.cost) },
    })
    toast.success(
      form.status === 'Active'
        ? 'Maintenance logged. Vehicle set to In Shop.'
        : 'Maintenance record added.',
    )
    setModalOpen(false)
    setForm((f) => ({ ...f, description: '', cost: '' }))
  }

  const close = (m) => {
    dispatch({ type: 'CLOSE_MAINTENANCE', id: m.id })
    toast.success('Maintenance closed. Vehicle restored to Available.')
  }

  const rows = useMemo(
    () =>
      state.maintenance
        .filter((m) => statusFilter === 'all' || m.status === statusFilter)
        .slice()
        .reverse(),
    [state.maintenance, statusFilter],
  )

  return (
    <div>
      <PageHeader
        title="Maintenance"
        subtitle="Service records — active logs move vehicles to In Shop"
        actions={
          <Button icon={Plus} onClick={() => setModalOpen(true)}>
            Log Maintenance
          </Button>
        }
      />

      <FilterBar>
        <FilterSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All records</option>
          <option value="Active">Active</option>
          <option value="Closed">Closed</option>
        </FilterSelect>
      </FilterBar>

      <ResponsiveTable
        rows={rows}
        rowKey={(m) => m.id}
        empty="No maintenance records."
        emptyIcon={Wrench}
        columns={[
          {
            header: 'Vehicle',
            primary: true,
            cell: (m) => getVehicle(state.vehicles, m.vehicleId)?.regNumber || '—',
          },
          { header: 'Status', headerRight: true, cell: (m) => <Badge status={m.status} /> },
          { header: 'Type', secondary: true, cell: (m) => m.type },
          { header: 'Description', cell: (m) => m.description },
          { header: 'Date', cell: (m) => m.date },
          { header: 'Cost', cell: (m) => inr(m.cost) },
        ]}
        actions={(m) =>
          m.status === 'Active' ? (
            <Button icon={CircleCheck} onClick={() => close(m)}>
              Close
            </Button>
          ) : (
            <span className="px-2 text-xs text-slate-400">No actions</span>
          )
        }
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Log Maintenance">
        <form onSubmit={create} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field
              label="Vehicle"
              hint="Only available / in-shop vehicles can be serviced. On-trip vehicles are excluded."
            >
              <Select
                value={form.vehicleId}
                onChange={(e) => setField('vehicleId', e.target.value)}
                required
              >
                <option value="">Select vehicle…</option>
                {eligibleVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.regNumber} — {v.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Type">
            <Select
              value={form.type}
              onChange={(e) => setField('type', e.target.value)}
            >
              {MAINT_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <Field label="Cost (₹)">
            <Input
              type="number"
              value={form.cost}
              onChange={(e) => setField('cost', e.target.value)}
              required
            />
          </Field>
          <Field label="Date">
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setField('date', e.target.value)}
            />
          </Field>
          <Field label="Status">
            <Select
              value={form.status}
              onChange={(e) => setField('status', e.target.value)}
            >
              <option value="Active">Active (moves to In Shop)</option>
              <option value="Closed">Closed (historical)</option>
            </Select>
          </Field>
          <div className="col-span-2">
            <Field label="Description">
              <Textarea
                rows={2}
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
              />
            </Field>
          </div>
          <div className="col-span-2 mt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save Record</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Maintenance
