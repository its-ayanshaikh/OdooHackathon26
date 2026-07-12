import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { useApp } from '../store/AppContext.jsx'
import { Panel, PanelHeader, PageHeader, Button, StatGrid, Stat } from '../components/ui.jsx'
import { Download, Gauge, TrendingUp, Wallet, PiggyBank } from 'lucide-react'
import {
  computeKpis,
  vehicleCosts,
  vehicleFuelEfficiency,
  vehicleROI,
} from '../store/selectors.js'
import { inr } from '../utils/format.js'
import { exportToCsv } from '../utils/csv.js'

function Reports() {
  const { state } = useApp()
  const kpis = useMemo(() => computeKpis(state), [state])

  const report = useMemo(
    () =>
      state.vehicles.map((v) => {
        const costs = vehicleCosts(state, v.id)
        return {
          vehicle: v,
          name: v.regNumber.split('-').slice(-1)[0],
          efficiency: vehicleFuelEfficiency(state, v.id),
          roi: vehicleROI(state, v),
          ...costs,
        }
      }),
    [state],
  )

  const totalRevenue = report.reduce((s, r) => s + r.revenue, 0)
  const totalOperational = report.reduce((s, r) => s + r.operational, 0)
  const netProfit = totalRevenue - totalOperational

  const efficiencyData = report.filter((r) => r.efficiency > 0)
  const roiData = report.filter((r) => r.revenue > 0 || r.operational > 0)

  const exportReport = () =>
    exportToCsv(
      'fleet-report.csv',
      report.map((r) => ({
        Vehicle: r.vehicle.regNumber,
        Model: r.vehicle.name,
        Fuel_Efficiency_km_per_L: r.efficiency,
        Fuel_Cost: r.fuel,
        Maintenance_Cost: r.maintenance,
        Other_Expenses: r.otherExpenses,
        Operational_Cost: r.operational,
        Revenue: r.revenue,
        ROI_Percent: r.roi,
      })),
    )

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Fuel efficiency, utilization, operational cost, and ROI"
        actions={
          <Button icon={Download} onClick={exportReport}>
            Export CSV
          </Button>
        }
      />

      <div className="mb-5">
        <StatGrid>
          <Stat label="Fleet Utilization" value={`${kpis.utilization}%`} accent="amber" icon={Gauge} />
          <Stat label="Total Revenue" value={inr(totalRevenue)} accent="emerald" icon={TrendingUp} />
          <Stat label="Operational Cost" value={inr(totalOperational)} accent="blue" icon={Wallet} />
          <Stat
            label="Net Profit"
            value={inr(netProfit)}
            accent={netProfit >= 0 ? 'emerald' : 'red'}
            icon={PiggyBank}
          />
        </StatGrid>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Fuel Efficiency (km / L)" />
          <div className="p-4">
            {efficiencyData.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={efficiencyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.4} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="efficiency" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-16 text-center text-sm text-slate-400">
                Complete trips with fuel data to see efficiency.
              </p>
            )}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Vehicle ROI (%)" />
          <div className="p-4">
            {roiData.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={roiData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.4} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Bar dataKey="roi" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-16 text-center text-sm text-slate-400">No ROI data yet.</p>
            )}
          </div>
        </Panel>
      </div>

      <Panel className="mt-5">
        <PanelHeader title="Revenue vs Operational Cost" />
        <div className="p-4">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={roiData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.4} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => inr(v)} />
              <Legend />
              <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="operational" name="Operational Cost" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel className="mt-5 overflow-x-auto">
        <PanelHeader title="Detailed Fleet Report" />
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Efficiency</th>
              <th className="px-4 py-3">Fuel</th>
              <th className="px-4 py-3">Maintenance</th>
              <th className="px-4 py-3">Operational</th>
              <th className="px-4 py-3">Revenue</th>
              <th className="px-4 py-3">ROI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {report.map((r) => (
              <tr key={r.vehicle.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-4 py-3 font-medium">{r.vehicle.regNumber}</td>
                <td className="px-4 py-3">{r.efficiency ? `${r.efficiency} km/L` : '—'}</td>
                <td className="px-4 py-3">{inr(r.fuel)}</td>
                <td className="px-4 py-3">{inr(r.maintenance)}</td>
                <td className="px-4 py-3">{inr(r.operational)}</td>
                <td className="px-4 py-3">{inr(r.revenue)}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      r.roi >= 0
                        ? 'font-medium text-emerald-600 dark:text-emerald-400'
                        : 'font-medium text-red-600 dark:text-red-400'
                    }
                  >
                    {r.roi}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  )
}

export default Reports
