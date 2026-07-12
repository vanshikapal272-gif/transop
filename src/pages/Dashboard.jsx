import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  Truck, Users, Route, TrendingUp, ArrowUpRight,
  Wrench, Fuel, BarChart3, AlertTriangle, Plus, MapPin
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom colored markers
function createMarkerIcon(color) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 14px; height: 14px; border-radius: 50%;
      background: ${color}; border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

const statusColors = { 'Available': '#10b981', 'On Trip': '#f59e0b', 'In Shop': '#ef4444', 'Retired': '#78716c' };

const cityCoords = {
  'West': [[19.076, 72.8777, 'Mumbai'], [18.5204, 73.8567, 'Pune'], [23.0225, 72.5714, 'Ahmedabad'], [21.1702, 72.8311, 'Surat']],
  'North': [[28.7041, 77.1025, 'Delhi'], [26.9124, 75.7873, 'Jaipur'], [26.8467, 80.9462, 'Lucknow'], [30.7333, 76.7794, 'Chandigarh']],
  'South': [[12.9716, 77.5946, 'Bangalore'], [13.0827, 80.2707, 'Chennai'], [17.385, 78.4867, 'Hyderabad'], [11.0168, 76.9558, 'Coimbatore']],
  'Central': [[22.5726, 88.3639, 'Kolkata'], [23.2599, 77.4126, 'Bhopal']],
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [vRes, dRes, tRes] = await Promise.all([
          api.get('/api/vehicles'),
          api.get('/api/drivers'),
          api.get('/api/trips'),
        ]);
        setData({
          vehicles: vRes.data.vehicles || [],
          drivers: dRes.data.drivers || [],
          trips: tRes.data.trips || [],
        });
      } catch (err) { console.error(err); }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!data) return <div className="page-loader"><p>Failed to load</p></div>;

  const { vehicles, drivers, trips } = data;
  const available = vehicles.filter(v => v.status === 'Available').length;
  const onTrip = vehicles.filter(v => v.status === 'On Trip').length;
  const inShop = vehicles.filter(v => v.status === 'In Shop').length;
  const retired = vehicles.filter(v => v.status === 'Retired').length;
  const activeTrips = trips.filter(t => t.status === 'Dispatched').length;
  const availDrivers = drivers.filter(d => d.status === 'Available').length;
  const completedTrips = trips.filter(t => t.status === 'Completed');
  const revenue = completedTrips.reduce((s, t) => s + (t.cargo_weight || 0) * 12, 0);

  // Map vehicle locations
  const vehicleMarkers = vehicles.map((v, i) => {
    const regionCities = cityCoords[v.region] || cityCoords['West'];
    const city = regionCities[i % regionCities.length];
    return { ...v, lat: city[0] + (Math.random() - 0.5) * 0.5, lng: city[1] + (Math.random() - 0.5) * 0.5, city: city[2] };
  });

  // SVG Donut
  const total = vehicles.length || 1;
  const segments = [
    { count: available, color: '#10b981', label: 'Available' },
    { count: onTrip, color: '#f59e0b', label: 'On Trip' },
    { count: inShop, color: '#ef4444', label: 'In Shop' },
    { count: retired, color: '#78716c', label: 'Retired' },
  ];
  let offset = 0;
  const donutSegments = segments.map(s => {
    const pct = (s.count / total) * 100;
    const seg = { ...s, pct, offset };
    offset += pct;
    return seg;
  });

  const recentTrips = [...trips].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6);

  const expiringDrivers = drivers.filter(d => {
    const exp = new Date(d.license_expiry);
    const now = new Date();
    return exp < new Date(now.getTime() + 30 * 86400000);
  });

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const isFleetManager = user?.role === 'Fleet Manager';
  const isDispatcher = user?.role === 'Dispatcher';
  const isSafetyOfficer = user?.role === 'Safety Officer';
  const isFinancialAnalyst = user?.role === 'Financial Analyst';

  return (
    <div>
      {/* Greeting */}
      <div className="dashboard-greeting">
        <h1>Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p>{today}</p>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        {(isFleetManager || isDispatcher || isSafetyOfficer) && (
          <div className="stat-card stat-card--1">
            <div className="stat-icon"><Truck size={20} /></div>
            <span className="stat-value">{vehicles.length}</span>
            <span className="stat-label">Total Vehicles</span>
            <div className="stat-trend"><ArrowUpRight size={12} /> {available} available</div>
          </div>
        )}
        {(isFleetManager || isDispatcher) && (
          <div className="stat-card stat-card--2">
            <div className="stat-icon"><Route size={20} /></div>
            <span className="stat-value">{activeTrips}</span>
            <span className="stat-label">Active Trips</span>
            <div className="stat-trend"><ArrowUpRight size={12} /> {trips.length} total</div>
          </div>
        )}
        {(isFleetManager || isDispatcher || isSafetyOfficer) && (
          <div className="stat-card stat-card--3">
            <div className="stat-icon"><Users size={20} /></div>
            <span className="stat-value">{availDrivers}</span>
            <span className="stat-label">Available Drivers</span>
            <div className="stat-trend"><ArrowUpRight size={12} /> {drivers.length} total</div>
          </div>
        )}
        {(isFleetManager || isFinancialAnalyst) && (
          <div className="stat-card stat-card--4">
            <div className="stat-icon"><TrendingUp size={20} /></div>
            <span className="stat-value">₹{(revenue / 100000).toFixed(1)}L</span>
            <span className="stat-label">Monthly Revenue</span>
            <div className="stat-trend"><ArrowUpRight size={12} /> +18% vs last</div>
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div className="dashboard-grid" style={(!isFleetManager && !isDispatcher && !isFinancialAnalyst) ? { gridTemplateColumns: '1fr' } : {}}>
        {/* Left Column */}
        {(isFleetManager || isDispatcher || isFinancialAnalyst) && (
          <div className="flex-col gap-4" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Map (Fleet Manager & Dispatcher) */}
            {(isFleetManager || isDispatcher) && (
              <div className="card">
                <div className="card-header">
                  <h3><MapPin size={16} style={{ display: 'inline', marginRight: 8, color: '#f59e0b' }} />Live Fleet Tracking</h3>
                  <span className="badge badge-success">{onTrip} on road</span>
                </div>
                <div style={{ height: '400px', borderRadius: '0 0 20px 20px', overflow: 'hidden' }}>
                  <MapContainer center={[22.5, 78.9]} zoom={5} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                      url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    />
                    {vehicleMarkers.map(v => (
                      <Marker key={v.id} position={[v.lat, v.lng]} icon={createMarkerIcon(statusColors[v.status] || '#78716c')}>
                        <Popup>
                          <div style={{ fontFamily: 'Inter', minWidth: 160 }}>
                            <strong style={{ fontSize: 14 }}>{v.name}</strong><br />
                            <span style={{ fontSize: 12, color: '#78716c' }}>{v.registration_number}</span><br />
                            <span style={{
                              display: 'inline-block', marginTop: 4, padding: '2px 8px',
                              borderRadius: 99, fontSize: 11, fontWeight: 600,
                              background: statusColors[v.status] + '20', color: statusColors[v.status]
                            }}>{v.status}</span><br />
                            <span style={{ fontSize: 11, color: '#a8a29e' }}>{v.city} · {v.region}</span>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </div>
            )}

            {/* Recent Trips (Dispatcher & Financial Analyst) */}
            {(isDispatcher || isFinancialAnalyst) && (
              <div className="card">
                <div className="card-header">
                  <h3>Recent Trips</h3>
                  <button className="btn btn-sm btn-secondary" onClick={() => navigate('/app/trips')}>View All</button>
                </div>
                <div className="data-table-wrapper" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
                  <table className="data-table">
                    <thead>
                      <tr><th>Route</th><th>Vehicle</th><th>Driver</th><th>Status</th><th>Date</th></tr>
                    </thead>
                    <tbody>
                      {recentTrips.map(t => (
                        <tr key={t.id}>
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.source} → {t.destination}</td>
                          <td>{t.vehicle_reg || '—'}</td>
                          <td>{t.driver_name || '—'}</td>
                          <td>
                            <span className={`badge badge-${t.status === 'Completed' ? 'success' : t.status === 'Dispatched' ? 'warning' : t.status === 'Cancelled' ? 'danger' : 'secondary'}`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="text-xs text-muted">{new Date(t.created_at).toLocaleDateString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Fleet Status Donut (Fleet Manager & Safety Officer) */}
          {(isFleetManager || isSafetyOfficer) && (
            <div className="card">
              <div className="card-header"><h3>Fleet Status</h3></div>
              <div className="fleet-donut">
                <svg width="140" height="140" viewBox="0 0 42 42">
                  <circle cx="21" cy="21" r="15.915" fill="none" stroke="var(--bg-tertiary)" strokeWidth="4" />
                  {donutSegments.map((s, i) => (
                    <circle key={i} cx="21" cy="21" r="15.915" fill="none"
                      stroke={s.color} strokeWidth="4"
                      strokeDasharray={`${s.pct} ${100 - s.pct}`}
                      strokeDashoffset={-s.offset + 25}
                      strokeLinecap="round"
                    />
                  ))}
                  <text x="21" y="20" textAnchor="middle" fontSize="6" fontWeight="800" fill="var(--text-primary)">{vehicles.length}</text>
                  <text x="21" y="25" textAnchor="middle" fontSize="3" fill="var(--text-muted)">vehicles</text>
                </svg>
                <div className="fleet-legend">
                  {segments.map(s => (
                    <div key={s.label} className="fleet-legend-item">
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span className="fleet-legend-dot" style={{ background: s.color }} />
                        <span>{s.label}</span>
                      </div>
                      <strong>{s.count}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header"><h3>Quick Actions</h3></div>
            <div className="card-body">
              <div className="quick-actions">
                {(isDispatcher || isFleetManager) && (
                  <button className="quick-action-btn" onClick={() => navigate('/app/trips', { state: { openModal: 'add' } })}>
                    <Plus size={18} /><span>New Trip</span>
                  </button>
                )}
                {isFleetManager && (
                  <button className="quick-action-btn" onClick={() => navigate('/app/fleet', { state: { openModal: 'add' } })}>
                    <Truck size={18} /><span>Add Vehicle</span>
                  </button>
                )}
                {(isSafetyOfficer || isFleetManager) && (
                  <button className="quick-action-btn" onClick={() => navigate('/app/drivers', { state: { openModal: 'add' } })}>
                    <Users size={18} /><span>Add Driver</span>
                  </button>
                )}
                {isFinancialAnalyst && (
                  <>
                    <button className="quick-action-btn" onClick={() => navigate('/app/fuel-expenses', { state: { openModal: 'add' } })}>
                      <Plus size={18} /><span>Add Logs</span>
                    </button>
                    <button className="quick-action-btn" onClick={() => navigate('/app/analytics')}>
                      <BarChart3 size={18} /><span>Analytics</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className="card">
            <div className="card-header">
              <h3><AlertTriangle size={16} style={{ display: 'inline', marginRight: 6, color: '#f59e0b' }} />Alerts</h3>
              <span className="badge badge-warning">{expiringDrivers.length}</span>
            </div>
            <div className="card-body">
              {expiringDrivers.length === 0 && <p className="text-sm text-muted">No active alerts</p>}
              {(isFleetManager || isSafetyOfficer || isDispatcher) && expiringDrivers.slice(0, 4).map(d => (
                <div key={d.id} className={`alert-item ${new Date(d.license_expiry) < new Date() ? 'critical' : ''}`}>
                  <strong>{d.name}</strong>
                  License {new Date(d.license_expiry) < new Date() ? 'expired' : 'expiring'} on {new Date(d.license_expiry).toLocaleDateString('en-IN')}
                </div>
              ))}
              {(isFleetManager || isDispatcher) && vehicles.filter(v => v.status === 'In Shop').map(v => (
                <div key={v.id} className="alert-item">
                  <strong>{v.name}</strong>
                  Currently in maintenance ({v.registration_number})
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
