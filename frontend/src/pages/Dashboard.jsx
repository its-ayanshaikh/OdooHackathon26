import { useMemo, useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts'
import {
  Truck,
  CircleCheck,
  Navigation,
  Wrench,
  Route as RouteIcon,
  Clock,
  UserCheck,
  Gauge,
  TriangleAlert,
  ShieldCheck,
} from 'lucide-react'
import { useApp } from '../store/AppContext.jsx'
import {
  computeKpis,
  isLicenseExpired,
  daysUntilExpiry,
} from '../store/selectors.js'
import { Panel, PanelHeader, PageHeader, Badge, FilterBar, FilterSelect, StatGrid, Stat } from '../components/ui.jsx'
import { VEHICLE_TYPES, REGIONS, VEHICLE_STATUS } from '../data/seed.js'
import { inr } from '../utils/format.js'

const STATUS_COLORS = {
  Available: '#10b981',
  'On Trip': '#3b82f6',
  'In Shop': '#f59e0b',
  Retired: '#94a3b8',
}

function Dashboard() {
  const { state } = useApp()
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [regionFilter, setRegionFilter] = useState('all')

  const filteredVehicles = useMemo(
    () =>
      state.vehicles.filter(
        (v) =>
          (typeFilter === 'all' || v.type === typeFilter) &&
          (statusFilter === 'all' || v.status === statusFilter) &&
          (regionFilter === 'all' || v.region === regionFilter),
      ),
    [state.vehicles, typeFilter, statusFilter, regionFilter],
  )

  const kpis = useMemo(() => computeKpis(state), [state])

  const statusData = useMemo(() => {
    const counts = {}
    filteredVehicles.forEach((v) => {
      counts[v.status] = (counts[v.status] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [filteredVehicles])

  const costByVehicle = useMemo(() => {
    return state.vehicles
      .map((v) => {
        const fuel = state.fuelLogs
          .filter((f) => f.vehicleId === v.id)
          .reduce((s, f) => s + f.cost, 0)
        const maint = state.maintenance
          .filter((m) => m.vehicleId === v.id)
          .reduce((s, m) => s + m.cost, 0)
        return {
          name: v.regNumber.split('-').slice(-1)[0],
          Fuel: fuel,
          Maintenance: maint,
        }
      })
      .filter((d) => d.Fuel || d.Maintenance)
  }, [state])

  const expiringLicenses = useMemo(
    () =>
      state.drivers
        .map((d) => ({ ...d, days: daysUntilExpiry(d) }))
        .filter((d) => d.days <= 60)
        .sort((a, b) => a.days - b.days),
    [state.drivers],
  )

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Real-time overview of your fleet operations"
      />

      {/* Filters */}
      <FilterBar>
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
        <FilterSelect value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}>
          <option value="all">All regions</option>
          {REGIONS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </FilterSelect>
      </FilterBar>

      {/* KPIs */}
      <StatGrid>
        <Stat label="Total Vehicles" value={kpis.total} accent="slate" icon={Truck} />
        <Stat label="Available" value={kpis.available} accent="emerald" icon={CircleCheck} />
        <Stat label="On Trip" value={kpis.onTrip} accent="blue" icon={Navigation} />
        <Stat label="In Maintenance" value={kpis.inShop} accent="amber" icon={Wrench} />
        <Stat label="Active Trips" value={kpis.activeTrips} accent="blue" icon={RouteIcon} />
        <Stat label="Pending Trips" value={kpis.pendingTrips} accent="slate" icon={Clock} />
        <Stat label="Drivers On Duty" value={kpis.driversOnDuty} accent="emerald" icon={UserCheck} />
        <Stat label="Fleet Utilization" value={`${kpis.utilization}%`} accent="amber" icon={Gauge} />
      </StatGrid>

      {/* Charts */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Fleet Status Distribution" />
          <div className="p-4">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Cost per Vehicle (Fuel vs Maintenance)" />
          <div className="p-4">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={costByVehicle}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.4} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => inr(v)} />
                <Legend />
                <Bar dataKey="Fuel" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Maintenance" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* License alerts */}
      <Panel className="mt-5">
        <PanelHeader
          title={
            <span className="flex items-center gap-2">
              License Compliance Alerts
              {expiringLicenses.length > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700 dark:bg-red-500/15 dark:text-red-400">
                  {expiringLicenses.length}
                </span>
              )}
            </span>
          }
        />
        <div className="p-4">
          {expiringLicenses.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <ShieldCheck size={18} className="text-emerald-500" />
              All driver licenses are valid for the next 60 days.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {expiringLicenses.map((d) => (
                <li key={d.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div className="flex items-center gap-2">
                    <TriangleAlert size={16} className="text-amber-500" />
                    <span className="font-medium">{d.name}</span>
                    <span className="text-slate-400">{d.licenseNumber}</span>
                  </div>
                  {isLicenseExpired(d) ? (
                    <Badge status="Suspended">Expired</Badge>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400">
                      Expires in {d.days} days
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>
    </div>
  )
}

export default Dashboard
