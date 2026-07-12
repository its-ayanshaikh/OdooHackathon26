import { useMemo, useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { useToast } from '../components/Toast.jsx'
import {
  Button,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  StatGrid,
  Stat,
  ResponsiveTable,
} from '../components/ui.jsx'
import { Plus, Download, Trash2, Fuel, Wrench, Receipt } from 'lucide-react'
import { EXPENSE_CATEGORIES } from '../data/seed.js'
import { getVehicle, vehicleCosts } from '../store/selectors.js'
import { inr } from '../utils/format.js'
import { exportToCsv } from '../utils/csv.js'

function Expenses() {
  const { state, addFuel, deleteFuel, addExpense, deleteExpense } = useApp()
  const toast = useToast()
  const [tab, setTab] = useState('fuel')
  const [fuelModal, setFuelModal] = useState(false)
  const [expModal, setExpModal] = useState(false)

  const [fuelForm, setFuelForm] = useState({
    vehicleId: '',
    liters: '',
    cost: '',
    date: new Date().toISOString().slice(0, 10),
    odometer: '',
  })
  const [expForm, setExpForm] = useState({
    vehicleId: '',
    category: 'Toll',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    note: '',
  })

  const handleAddFuel = async (e) => {
    e.preventDefault()
    if (!fuelForm.vehicleId) return toast.error('Select a vehicle.')
    try {
      await addFuel({
        ...fuelForm,
        liters: Number(fuelForm.liters),
        cost: Number(fuelForm.cost),
        odometer: Number(fuelForm.odometer),
      })
      toast.success('Fuel log added.')
      setFuelModal(false)
      setFuelForm((f) => ({ ...f, liters: '', cost: '', odometer: '' }))
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleAddExpense = async (e) => {
    e.preventDefault()
    if (!expForm.vehicleId) return toast.error('Select a vehicle.')
    try {
      await addExpense({ ...expForm, amount: Number(expForm.amount) })
      toast.success('Expense added.')
      setExpModal(false)
      setExpForm((f) => ({ ...f, amount: '', note: '' }))
    } catch (err) {
      toast.error(err.message)
    }
  }

  const removeFuel = async (id) => {
    try {
      await deleteFuel(id)
      toast.info('Fuel log deleted.')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const removeExpense = async (id) => {
    try {
      await deleteExpense(id)
      toast.info('Expense deleted.')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const costSummary = useMemo(
    () =>
      state.vehicles.map((v) => ({
        vehicle: v,
        ...vehicleCosts(state, v.id),
      })),
    [state],
  )

  const totals = useMemo(
    () =>
      costSummary.reduce(
        (acc, c) => ({
          fuel: acc.fuel + c.fuel,
          maintenance: acc.maintenance + c.maintenance,
          other: acc.other + c.otherExpenses,
        }),
        { fuel: 0, maintenance: 0, other: 0 },
      ),
    [costSummary],
  )

  return (
    <div>
      <PageHeader
        title="Fuel & Expenses"
        subtitle="Fuel logs, other expenses, and total operational cost per vehicle"
        actions={
          <>
            <Button variant="secondary" icon={Fuel} onClick={() => setFuelModal(true)}>
              <span className="hidden sm:inline">Fuel Log</span>
            </Button>
            <Button icon={Plus} onClick={() => setExpModal(true)}>
              Expense
            </Button>
          </>
        }
      />

      {/* Totals */}
      <div className="mb-5">
        <StatGrid>
          <Stat label="Total Fuel" value={inr(totals.fuel)} accent="blue" icon={Fuel} />
          <Stat label="Total Maintenance" value={inr(totals.maintenance)} accent="amber" icon={Wrench} />
          <Stat label="Other Expenses" value={inr(totals.other)} accent="slate" icon={Receipt} />
          <Stat
            label="Grand Total"
            value={inr(totals.fuel + totals.maintenance + totals.other)}
            accent="emerald"
            icon={Receipt}
          />
        </StatGrid>
      </div>

      {/* Operational cost per vehicle */}
      <div className="mb-5">
        <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
          Operational Cost per Vehicle
        </h3>
        <ResponsiveTable
          rows={costSummary}
          rowKey={(c) => c.vehicle.id}
          empty="No vehicles."
          columns={[
            { header: 'Vehicle', primary: true, cell: (c) => c.vehicle.regNumber },
            { header: 'Fuel', cell: (c) => inr(c.fuel) },
            { header: 'Maintenance', cell: (c) => inr(c.maintenance) },
            { header: 'Other', cell: (c) => inr(c.otherExpenses) },
            {
              header: 'Total Operational',
              headerRight: true,
              cell: (c) => (
                <span className="font-semibold text-slate-900 dark:text-white">
                  {inr(c.operational)}
                </span>
              ),
            },
          ]}
        />
      </div>

      {/* Segmented control */}
      <div className="mb-4 inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-700 dark:bg-slate-800">
        {[
          { key: 'fuel', label: 'Fuel Logs' },
          { key: 'expenses', label: 'Other Expenses' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
              tab === t.key
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'fuel' ? (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Fuel Logs
            </h3>
            <Button
              variant="ghost"
              icon={Download}
              onClick={() =>
                exportToCsv(
                  'fuel-logs.csv',
                  state.fuelLogs.map((f) => ({
                    Vehicle: getVehicle(state.vehicles, f.vehicleId)?.regNumber,
                    Liters: f.liters,
                    Cost: f.cost,
                    Odometer: f.odometer,
                    Date: f.date,
                  })),
                )
              }
            >
              Export
            </Button>
          </div>
          <ResponsiveTable
            rows={state.fuelLogs.slice().reverse()}
            rowKey={(f) => f.id}
            empty="No fuel logs."
            emptyIcon={Fuel}
            columns={[
              {
                header: 'Vehicle',
                primary: true,
                cell: (f) => getVehicle(state.vehicles, f.vehicleId)?.regNumber || '—',
              },
              { header: 'Liters', cell: (f) => `${f.liters} L` },
              { header: 'Cost', cell: (f) => inr(f.cost) },
              { header: 'Odometer', cell: (f) => `${f.odometer} km` },
              { header: 'Date', cell: (f) => f.date },
            ]}
            actions={(f) => (
              <Button variant="ghost" onClick={() => removeFuel(f.id)} title="Delete">
                <Trash2 size={16} />
              </Button>
            )}
          />
        </div>
      ) : (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Other Expenses
            </h3>
            <Button
              variant="ghost"
              icon={Download}
              onClick={() =>
                exportToCsv(
                  'expenses.csv',
                  state.expenses.map((x) => ({
                    Vehicle: getVehicle(state.vehicles, x.vehicleId)?.regNumber,
                    Category: x.category,
                    Amount: x.amount,
                    Date: x.date,
                    Note: x.note,
                  })),
                )
              }
            >
              Export
            </Button>
          </div>
          <ResponsiveTable
            rows={state.expenses.slice().reverse()}
            rowKey={(x) => x.id}
            empty="No expenses."
            emptyIcon={Receipt}
            columns={[
              {
                header: 'Vehicle',
                primary: true,
                cell: (x) => getVehicle(state.vehicles, x.vehicleId)?.regNumber || '—',
              },
              { header: 'Category', cell: (x) => x.category },
              { header: 'Amount', cell: (x) => inr(x.amount) },
              { header: 'Date', cell: (x) => x.date },
              { header: 'Note', cell: (x) => x.note },
            ]}
            actions={(x) => (
              <Button variant="ghost" onClick={() => removeExpense(x.id)} title="Delete">
                <Trash2 size={16} />
              </Button>
            )}
          />
        </div>
      )}

      {/* Fuel modal */}
      <Modal open={fuelModal} onClose={() => setFuelModal(false)} title="Add Fuel Log">
        <form onSubmit={handleAddFuel} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field label="Vehicle">
              <Select
                value={fuelForm.vehicleId}
                onChange={(e) =>
                  setFuelForm((f) => ({ ...f, vehicleId: e.target.value }))
                }
                required
              >
                <option value="">Select vehicle…</option>
                {state.vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.regNumber} — {v.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Liters">
            <Input
              type="number"
              value={fuelForm.liters}
              onChange={(e) => setFuelForm((f) => ({ ...f, liters: e.target.value }))}
              required
            />
          </Field>
          <Field label="Cost (₹)">
            <Input
              type="number"
              value={fuelForm.cost}
              onChange={(e) => setFuelForm((f) => ({ ...f, cost: e.target.value }))}
              required
            />
          </Field>
          <Field label="Odometer (km)">
            <Input
              type="number"
              value={fuelForm.odometer}
              onChange={(e) =>
                setFuelForm((f) => ({ ...f, odometer: e.target.value }))
              }
            />
          </Field>
          <Field label="Date">
            <Input
              type="date"
              value={fuelForm.date}
              onChange={(e) => setFuelForm((f) => ({ ...f, date: e.target.value }))}
            />
          </Field>
          <div className="col-span-2 mt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setFuelModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Log</Button>
          </div>
        </form>
      </Modal>

      {/* Expense modal */}
      <Modal open={expModal} onClose={() => setExpModal(false)} title="Add Expense">
        <form onSubmit={handleAddExpense} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field label="Vehicle">
              <Select
                value={expForm.vehicleId}
                onChange={(e) =>
                  setExpForm((f) => ({ ...f, vehicleId: e.target.value }))
                }
                required
              >
                <option value="">Select vehicle…</option>
                {state.vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.regNumber} — {v.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Category">
            <Select
              value={expForm.category}
              onChange={(e) => setExpForm((f) => ({ ...f, category: e.target.value }))}
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Amount (₹)">
            <Input
              type="number"
              value={expForm.amount}
              onChange={(e) => setExpForm((f) => ({ ...f, amount: e.target.value }))}
              required
            />
          </Field>
          <Field label="Date">
            <Input
              type="date"
              value={expForm.date}
              onChange={(e) => setExpForm((f) => ({ ...f, date: e.target.value }))}
            />
          </Field>
          <div className="col-span-2">
            <Field label="Note">
              <Input
                value={expForm.note}
                onChange={(e) => setExpForm((f) => ({ ...f, note: e.target.value }))}
              />
            </Field>
          </div>
          <div className="col-span-2 mt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setExpModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Expense</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Expenses
