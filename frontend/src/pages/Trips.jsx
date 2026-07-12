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
  ResponsiveTable,
} from '../components/ui.jsx'
import {
  Plus,
  Send,
  CircleCheck,
  Ban,
  Trash2,
  TriangleAlert,
  Route as RouteIcon,
} from 'lucide-react'
import { TRIP_STATUS } from '../data/seed.js'
import {
  dispatchableVehicles,
  assignableDrivers,
  getVehicle,
  getDriver,
} from '../store/selectors.js'
import { inr, num } from '../utils/format.js'

const emptyTrip = {
  source: '',
  destination: '',
  vehicleId: '',
  driverId: '',
  cargoWeight: '',
  plannedDistance: '',
  revenue: '',
}

function Trips() {
  const { state, dispatch } = useApp()
  const toast = useToast()
  const [statusFilter, setStatusFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyTrip)

  // Complete-trip modal
  const [completing, setCompleting] = useState(null)
  const [completeForm, setCompleteForm] = useState({ endOdometer: '', fuelConsumed: '' })

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const availableVehicles = useMemo(
    () => dispatchableVehicles(state.vehicles),
    [state.vehicles],
  )
  const availableDrivers = useMemo(
    () => assignableDrivers(state.drivers),
    [state.drivers],
  )

  const selectedVehicle = getVehicle(state.vehicles, form.vehicleId)

  const openCreate = () => {
    setForm(emptyTrip)
    setModalOpen(true)
  }

  const create = (e) => {
    e.preventDefault()
    const { source, destination, vehicleId, driverId, cargoWeight } = form
    if (!source || !destination) return toast.error('Source and destination required.')
    if (!vehicleId) return toast.error('Select an available vehicle.')
    if (!driverId) return toast.error('Select an available driver.')

    const vehicle = getVehicle(state.vehicles, vehicleId)
    if (Number(cargoWeight) > vehicle.maxCapacity)
      return toast.error(
        `Cargo (${num(cargoWeight)} kg) exceeds capacity (${num(vehicle.maxCapacity)} kg).`,
      )

    dispatch({
      type: 'ADD_TRIP',
      trip: {
        ...form,
        cargoWeight: Number(cargoWeight),
        plannedDistance: Number(form.plannedDistance),
        revenue: Number(form.revenue || 0),
        createdAt: new Date().toISOString().slice(0, 10),
        startOdometer: null,
        endOdometer: null,
        fuelConsumed: null,
      },
    })
    toast.success('Trip created as Draft.')
    setModalOpen(false)
  }

  const doDispatch = (trip) => {
    const vehicle = getVehicle(state.vehicles, trip.vehicleId)
    const driver = getDriver(state.drivers, trip.driverId)
    if (!vehicle || vehicle.status !== 'Available')
      return toast.error('Vehicle is no longer available for dispatch.')
    if (!driver || driver.status !== 'Available')
      return toast.error('Driver is no longer available for dispatch.')
    dispatch({ type: 'DISPATCH_TRIP', id: trip.id })
    toast.success('Trip dispatched. Vehicle & driver set to On Trip.')
  }

  const openComplete = (trip) => {
    const vehicle = getVehicle(state.vehicles, trip.vehicleId)
    setCompleting(trip)
    setCompleteForm({
      endOdometer: vehicle ? vehicle.odometer + trip.plannedDistance : '',
      fuelConsumed: '',
    })
  }

  const confirmComplete = (e) => {
    e.preventDefault()
    const end = Number(completeForm.endOdometer)
    const vehicle = getVehicle(state.vehicles, completing.vehicleId)
    if (end < vehicle.odometer)
      return toast.error('Final odometer cannot be less than current reading.')
    dispatch({
      type: 'COMPLETE_TRIP',
      id: completing.id,
      payload: {
        endOdometer: end,
        fuelConsumed: Number(completeForm.fuelConsumed),
      },
    })
    toast.success('Trip completed. Vehicle & driver back to Available.')
    setCompleting(null)
  }

  const doCancel = (trip) => {
    if (window.confirm('Cancel this trip?')) {
      dispatch({ type: 'CANCEL_TRIP', id: trip.id })
      toast.info('Trip cancelled.')
    }
  }

  const doDelete = (trip) => {
    if (window.confirm('Delete this draft trip?')) {
      dispatch({ type: 'DELETE_TRIP', id: trip.id })
      toast.info('Trip deleted.')
    }
  }

  const rows = useMemo(
    () =>
      state.trips
        .filter((t) => statusFilter === 'all' || t.status === statusFilter)
        .slice()
        .reverse(),
    [state.trips, statusFilter],
  )

  return (
    <div>
      <PageHeader
        title="Trip Management"
        subtitle="Create, dispatch, and track deliveries"
        actions={
          <Button icon={Plus} onClick={openCreate}>
            Create Trip
          </Button>
        }
      />

      <FilterBar>
        <FilterSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          {TRIP_STATUS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </FilterSelect>
      </FilterBar>

      <ResponsiveTable
        rows={rows}
        rowKey={(t) => t.id}
        empty="No trips yet. Create one to get started."
        emptyIcon={RouteIcon}
        columns={[
          {
            header: 'Route',
            primary: true,
            cell: (t) => (
              <span>
                {t.source} → {t.destination}
              </span>
            ),
          },
          { header: 'Created', cell: (t) => t.createdAt },
          { header: 'Status', headerRight: true, cell: (t) => <Badge status={t.status} /> },
          {
            header: 'Vehicle',
            secondary: true,
            cell: (t) => getVehicle(state.vehicles, t.vehicleId)?.regNumber || '—',
          },
          {
            header: 'Driver',
            cell: (t) => getDriver(state.drivers, t.driverId)?.name || '—',
          },
          { header: 'Cargo', cell: (t) => `${num(t.cargoWeight)} kg` },
          { header: 'Distance', cell: (t) => `${num(t.plannedDistance)} km` },
          { header: 'Revenue', cell: (t) => inr(t.revenue) },
        ]}
        actions={(t) => (
          <>
            {t.status === 'Draft' && (
              <>
                <Button icon={Send} onClick={() => doDispatch(t)}>
                  Dispatch
                </Button>
                <Button variant="ghost" onClick={() => doDelete(t)} title="Delete">
                  <Trash2 size={16} />
                </Button>
              </>
            )}
            {t.status === 'Dispatched' && (
              <>
                <Button icon={CircleCheck} onClick={() => openComplete(t)}>
                  Complete
                </Button>
                <Button variant="ghost" onClick={() => doCancel(t)} title="Cancel">
                  <Ban size={16} />
                </Button>
              </>
            )}
            {(t.status === 'Completed' || t.status === 'Cancelled') && (
              <span className="px-2 text-xs text-slate-400">No actions</span>
            )}
          </>
        )}
      />

      {/* Create trip modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Trip"
      >
        <form onSubmit={create} className="grid grid-cols-2 gap-4">
          <Field label="Source">
            <Input
              value={form.source}
              onChange={(e) => setField('source', e.target.value)}
              required
            />
          </Field>
          <Field label="Destination">
            <Input
              value={form.destination}
              onChange={(e) => setField('destination', e.target.value)}
              required
            />
          </Field>
          <div className="col-span-2">
            <Field
              label="Vehicle (Available only)"
              hint={
                availableVehicles.length === 0
                  ? 'No available vehicles — retired/in-shop/on-trip vehicles are excluded.'
                  : selectedVehicle
                    ? `Max capacity: ${num(selectedVehicle.maxCapacity)} kg`
                    : undefined
              }
            >
              <Select
                value={form.vehicleId}
                onChange={(e) => setField('vehicleId', e.target.value)}
                required
              >
                <option value="">Select vehicle…</option>
                {availableVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.regNumber} — {v.name} ({num(v.maxCapacity)} kg)
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="col-span-2">
            <Field
              label="Driver (Available, valid license only)"
              hint={
                availableDrivers.length === 0
                  ? 'No assignable drivers — suspended/expired/on-trip drivers are excluded.'
                  : undefined
              }
            >
              <Select
                value={form.driverId}
                onChange={(e) => setField('driverId', e.target.value)}
                required
              >
                <option value="">Select driver…</option>
                {availableDrivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.licenseCategory} (score {d.safetyScore})
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Cargo Weight (kg)">
            <Input
              type="number"
              value={form.cargoWeight}
              onChange={(e) => setField('cargoWeight', e.target.value)}
              required
            />
          </Field>
          <Field label="Planned Distance (km)">
            <Input
              type="number"
              value={form.plannedDistance}
              onChange={(e) => setField('plannedDistance', e.target.value)}
              required
            />
          </Field>
          <div className="col-span-2">
            <Field label="Expected Revenue (₹)">
              <Input
                type="number"
                value={form.revenue}
                onChange={(e) => setField('revenue', e.target.value)}
              />
            </Field>
          </div>
          {selectedVehicle &&
            Number(form.cargoWeight) > selectedVehicle.maxCapacity && (
              <p className="col-span-2 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
                <TriangleAlert size={16} className="shrink-0" />
                Cargo weight exceeds the vehicle's maximum load capacity.
              </p>
            )}
          <div className="col-span-2 mt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create Trip</Button>
          </div>
        </form>
      </Modal>

      {/* Complete trip modal */}
      <Modal
        open={!!completing}
        onClose={() => setCompleting(null)}
        title="Complete Trip"
      >
        {completing && (
          <form onSubmit={confirmComplete} className="grid gap-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {completing.source} → {completing.destination}. Enter the final
              odometer reading and fuel consumed. Vehicle and driver will return
              to Available.
            </p>
            <Field label="Final Odometer (km)">
              <Input
                type="number"
                value={completeForm.endOdometer}
                onChange={(e) =>
                  setCompleteForm((f) => ({ ...f, endOdometer: e.target.value }))
                }
                required
              />
            </Field>
            <Field label="Fuel Consumed (liters)">
              <Input
                type="number"
                value={completeForm.fuelConsumed}
                onChange={(e) =>
                  setCompleteForm((f) => ({ ...f, fuelConsumed: e.target.value }))
                }
                required
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setCompleting(null)}
              >
                Cancel
              </Button>
              <Button type="submit">Complete Trip</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

export default Trips
