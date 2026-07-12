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
  Map as MapIcon,
} from 'lucide-react'
import PlacesAutocomplete from '../components/PlacesAutocomplete.jsx'
import RouteMap from '../components/RouteMap.jsx'
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
  const { state, addTrip, deleteTrip, dispatchTrip, completeTrip, cancelTrip } = useApp()
  const toast = useToast()
  const [statusFilter, setStatusFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyTrip)

  // Complete-trip modal
  const [completing, setCompleting] = useState(null)
  const [completeForm, setCompleteForm] = useState({ endOdometer: '', fuelConsumed: '' })

  // Route map modal
  const [routeTrip, setRouteTrip] = useState(null)

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

  const create = async (e) => {
    e.preventDefault()
    const { source, destination, vehicleId, driverId, cargoWeight } = form
    if (!source || !destination) return toast.error('Source and destination required.')
    if (!vehicleId) return toast.error('Select an available vehicle.')
    if (!driverId) return toast.error('Select an available driver.')

    const vehicle = getVehicle(state.vehicles, vehicleId)
    if (vehicle && Number(cargoWeight) > vehicle.maxCapacity)
      return toast.error(
        `Cargo (${num(cargoWeight)} kg) exceeds capacity (${num(vehicle.maxCapacity)} kg).`,
      )

    try {
      await addTrip({
        source,
        destination,
        vehicleId,
        driverId,
        cargoWeight: Number(cargoWeight),
        plannedDistance: Number(form.plannedDistance),
        revenue: Number(form.revenue || 0),
      })
      toast.success('Trip created as Draft.')
      setModalOpen(false)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const doDispatch = async (trip) => {
    try {
      await dispatchTrip(trip.id)
      toast.success('Trip dispatched. Vehicle & driver set to On Trip.')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const openComplete = (trip) => {
    const vehicle = getVehicle(state.vehicles, trip.vehicleId)
    setCompleting(trip)
    setCompleteForm({
      endOdometer: vehicle ? vehicle.odometer + trip.plannedDistance : '',
      fuelConsumed: '',
    })
  }

  const confirmComplete = async (e) => {
    e.preventDefault()
    try {
      await completeTrip(completing.id, {
        endOdometer: Number(completeForm.endOdometer),
        fuelConsumed: Number(completeForm.fuelConsumed),
      })
      toast.success('Trip completed. Vehicle & driver back to Available.')
      setCompleting(null)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const doCancel = async (trip) => {
    if (!window.confirm('Cancel this trip?')) return
    try {
      await cancelTrip(trip.id)
      toast.info('Trip cancelled.')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const doDelete = async (trip) => {
    if (!window.confirm('Delete this draft trip?')) return
    try {
      await deleteTrip(trip.id)
      toast.info('Trip deleted.')
    } catch (err) {
      toast.error(err.message)
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
            <Button
              variant="secondary"
              icon={MapIcon}
              onClick={() => setRouteTrip(t)}
              title="View route on map"
            >
              <span className="hidden sm:inline">Route</span>
            </Button>
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
            <PlacesAutocomplete
              value={form.source}
              onChange={(v) => setField('source', v)}
              placeholder="Search source location…"
            />
          </Field>
          <Field label="Destination">
            <PlacesAutocomplete
              value={form.destination}
              onChange={(v) => setField('destination', v)}
              placeholder="Search destination…"
            />
          </Field>
          {form.source && form.destination && (
            <div className="col-span-2">
              <RouteMap
                origin={form.source}
                destination={form.destination}
                height={200}
                onRoute={(info) => setField('plannedDistance', String(info.km))}
              />
            </div>
          )}
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
          <Field label="Planned Distance (km)" hint="Auto-filled from the map route — editable.">
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

      {/* Route map modal */}
      <Modal
        open={!!routeTrip}
        onClose={() => setRouteTrip(null)}
        title={routeTrip ? `${routeTrip.source} → ${routeTrip.destination}` : 'Route'}
        wide
      >
        {routeTrip && (
          <RouteMap
            origin={routeTrip.source}
            destination={routeTrip.destination}
            height={440}
          />
        )}
      </Modal>
    </div>
  )
}

export default Trips
