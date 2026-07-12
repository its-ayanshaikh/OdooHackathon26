import { useMemo, useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { useToast } from '../components/Toast.jsx'
import {
  Button,
  Panel,
  PanelHeader,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  EmptyRow,
  StatGrid,
  Stat,
} from '../components/ui.jsx'
import { Plus, Download, Trash2, Fuel, Wrench, Receipt } from 'lucide-react'
import { EXPENSE_CATEGORIES } from '../data/seed.js'
import { getVehicle, vehicleCosts } from '../store/selectors.js'
import { inr } from '../utils/format.js'
import { exportToCsv } from '../utils/csv.js'

function Expenses() {
  const { state, dispatch } = useApp()
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

  const addFuel = (e) => {
    e.preventDefault()
    if (!fuelForm.vehicleId) return toast.error('Select a vehicle.')
    dispatch({
      type: 'ADD_FUEL',
      log: {
        ...fuelForm,
        liters: Number(fuelForm.liters),
        cost: Number(fuelForm.cost),
        odometer: Number(fuelForm.odometer),
      },
    })
    toast.success('Fuel log added.')
    setFuelModal(false)
    setFuelForm((f) => ({ ...f, liters: '', cost: '', odometer: '' }))
  }

  const addExpense = (e) => {
    e.preventDefault()
    if (!expForm.vehicleId) return toast.error('Select a vehicle.')
    dispatch({
      type: 'ADD_EXPENSE',
      expense: { ...expForm, amount: Number(expForm.amount) },
    })
    toast.success('Expense added.')
    setExpModal(false)
    setExpForm((f) => ({ ...f, amount: '', note: '' }))
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
      <Panel className="mb-5 overflow-x-auto">
        <PanelHeader title="Operational Cost per Vehicle" />
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Fuel</th>
              <th className="px-4 py-3">Maintenance</th>
              <th className="px-4 py-3">Other</th>
              <th className="px-4 py-3">Total Operational</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {costSummary.map((c) => (
              <tr key={c.vehicle.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-4 py-3 font-medium">{c.vehicle.regNumber}</td>
                <td className="px-4 py-3">{inr(c.fuel)}</td>
                <td className="px-4 py-3">{inr(c.maintenance)}</td>
                <td className="px-4 py-3">{inr(c.otherExpenses)}</td>
                <td className="px-4 py-3 font-semibold">{inr(c.operational)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

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
        <Panel className="overflow-x-auto">
          <PanelHeader
            title="Fuel Logs"
            action={
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
            }
          />
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Liters</th>
                <th className="px-4 py-3">Cost</th>
                <th className="px-4 py-3">Odometer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {state.fuelLogs.length === 0 ? (
                <EmptyRow colSpan={6} message="No fuel logs." />
              ) : (
                state.fuelLogs
                  .slice()
                  .reverse()
                  .map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-medium">
                        {getVehicle(state.vehicles, f.vehicleId)?.regNumber || '—'}
                      </td>
                      <td className="px-4 py-3">{f.liters} L</td>
                      <td className="px-4 py-3">{inr(f.cost)}</td>
                      <td className="px-4 py-3">{f.odometer} km</td>
                      <td className="px-4 py-3">{f.date}</td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          onClick={() => dispatch({ type: 'DELETE_FUEL', id: f.id })}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </Panel>
      ) : (
        <Panel className="overflow-x-auto">
          <PanelHeader
            title="Other Expenses"
            action={
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
            }
          />
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Note</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {state.expenses.length === 0 ? (
                <EmptyRow colSpan={6} message="No expenses." />
              ) : (
                state.expenses
                  .slice()
                  .reverse()
                  .map((x) => (
                    <tr key={x.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-medium">
                        {getVehicle(state.vehicles, x.vehicleId)?.regNumber || '—'}
                      </td>
                      <td className="px-4 py-3">{x.category}</td>
                      <td className="px-4 py-3">{inr(x.amount)}</td>
                      <td className="px-4 py-3">{x.date}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                        {x.note}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          onClick={() => dispatch({ type: 'DELETE_EXPENSE', id: x.id })}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </Panel>
      )}

      {/* Fuel modal */}
      <Modal open={fuelModal} onClose={() => setFuelModal(false)} title="Add Fuel Log">
        <form onSubmit={addFuel} className="grid grid-cols-2 gap-4">
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
        <form onSubmit={addExpense} className="grid grid-cols-2 gap-4">
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
