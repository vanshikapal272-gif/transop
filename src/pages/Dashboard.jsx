import { useState, useEffect } from 'react';
import api from '../utils/api';
import { formatCurrency, formatPercentage, formatCompact } from '../utils/helpers';
import { Truck, Users, Route, Wrench, TrendingUp, AlertTriangle, Fuel, DollarSign } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [costs, setCosts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/analytics/kpis'),
      api.get('/api/analytics/alerts'),
      api.get('/api/analytics/costs'),
    ]).then(([kpiRes, alertRes, costRes]) => {
      setKpis(kpiRes.data.kpis);
      setAlerts(alertRes.data);
      setCosts(costRes.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  const kpiCards = [
    { label: 'Active Vehicles', value: kpis?.activeVehicles, icon: Truck, color: '#3b82f6' },
    { label: 'Available', value: kpis?.availableVehicles, icon: Truck, color: '#10b981' },
    { label: 'In Maintenance', value: kpis?.inShopVehicles, icon: Wrench, color: '#f59e0b' },
    { label: 'Active Trips', value: kpis?.activeTrips, icon: Route, color: '#8b5cf6' },
    { label: 'Pending Trips', value: kpis?.pendingTrips, icon: Route, color: '#ec4899' },
    { label: 'Drivers On Duty', value: kpis?.onDutyDrivers, icon: Users, color: '#06b6d4' },
    { label: 'Fleet Utilization', value: `${kpis?.fleetUtilization}%`, icon: TrendingUp, color: '#f59e0b' },
  ];

  const tripStatusData = [
    { name: 'Completed', value: kpis?.completedTrips || 0 },
    { name: 'Active', value: kpis?.activeTrips || 0 },
    { name: 'Pending', value: kpis?.pendingTrips || 0 },
  ];

  const costBreakdown = costs?.expensesByCategory || [];

  return (
    <div className="dashboard-page page-enter">
      {/* KPI Cards with stacking effect */}
      <div className="kpi-grid">
        {kpiCards.map((kpi, i) => (
          <div key={i} className="kpi-card" style={{ '--accent': kpi.color, animationDelay: `${i * 60}ms` }}>
            <div className="kpi-card-icon" style={{ background: `${kpi.color}15`, color: kpi.color }}>
              <kpi.icon size={20} />
            </div>
            <div className="kpi-card-content">
              <span className="kpi-value">{kpi.value ?? '—'}</span>
              <span className="kpi-label">{kpi.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Alerts Carousel */}
      {alerts && (alerts.expiringDrivers?.length > 0 || alerts.activeMaintenance?.length > 0) && (
        <div className="carousel-section">
          <h3 className="section-title"><AlertTriangle size={16} /> Alerts & Notifications</h3>
          <div className="window-carousel">
            {alerts.expiringDrivers?.map(d => (
              <div key={`lic-${d.id}`} className="carousel-card carousel-card-warning">
                <div className="carousel-card-icon"><AlertTriangle size={16} /></div>
                <div>
                  <strong>{d.name}</strong>
                  <p>License expires {d.license_expiry}</p>
                </div>
              </div>
            ))}
            {alerts.activeMaintenance?.map(m => (
              <div key={`mnt-${m.id}`} className="carousel-card carousel-card-info">
                <div className="carousel-card-icon"><Wrench size={16} /></div>
                <div>
                  <strong>{m.registration_number}</strong>
                  <p>{m.type} — In Shop</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3 className="chart-title">Cost Trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={costs?.fuelByMonth || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="total" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Trip Status Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={tripStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                {tripStatusData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="chart-legend">
            {tripStatusData.map((item, i) => (
              <span key={i} className="legend-item">
                <span className="legend-dot" style={{ background: COLORS[i] }} /> {item.name}: {item.value}
              </span>
            ))}
          </div>
        </div>

        <div className="chart-card chart-card-wide">
          <h3 className="chart-title">Operational Cost Summary</h3>
          <div className="cost-summary-grid">
            <div className="cost-item">
              <Fuel size={20} style={{ color: '#f59e0b' }} />
              <div>
                <span className="cost-value">{formatCurrency(kpis?.totalFuelCost)}</span>
                <span className="cost-label">Fuel Costs</span>
              </div>
            </div>
            <div className="cost-item">
              <Wrench size={20} style={{ color: '#3b82f6' }} />
              <div>
                <span className="cost-value">{formatCurrency(kpis?.totalMaintenanceCost)}</span>
                <span className="cost-label">Maintenance</span>
              </div>
            </div>
            <div className="cost-item">
              <DollarSign size={20} style={{ color: '#10b981' }} />
              <div>
                <span className="cost-value">{formatCurrency(kpis?.totalExpenses)}</span>
                <span className="cost-label">Other Expenses</span>
              </div>
            </div>
            <div className="cost-item cost-item-total">
              <TrendingUp size={20} style={{ color: '#ef4444' }} />
              <div>
                <span className="cost-value">{formatCurrency(kpis?.totalOperationalCost)}</span>
                <span className="cost-label">Total Operational Cost</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Trips */}
      {alerts?.recentTrips?.length > 0 && (
        <div className="recent-section">
          <h3 className="section-title">Recent Activity</h3>
          <div className="activity-list">
            {alerts.recentTrips.slice(0, 6).map(trip => (
              <div key={trip.id} className="activity-item">
                <div className={`activity-dot status-${trip.status.toLowerCase()}`} />
                <div className="activity-content">
                  <span className="activity-title">{trip.source} → {trip.destination}</span>
                  <span className="activity-meta">{trip.vehicle_reg} · {trip.driver_name}</span>
                </div>
                <span className={`badge badge-${trip.status === 'Completed' ? 'success' : trip.status === 'Dispatched' ? 'info' : trip.status === 'Draft' ? 'warning' : 'error'}`}>
                  {trip.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
