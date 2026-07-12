import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../utils/api';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { Plus, Play, CheckCircle, XCircle } from 'lucide-react';
import { formatDate } from '../utils/helpers';

export default function Trips() {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'add' | 'complete'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ source: '', destination: '', vehicle_id: '', driver_id: '', cargo_weight: '', planned_distance: '' });
  const [completeForm, setCompleteForm] = useState({ actual_distance: '', fuel_consumed: '' });
  const { addToast } = useToast();
  const location = useLocation();

  const fetch = () => {
    setLoading(true);
    Promise.all([
      api.get('/api/trips'),
      api.get('/api/vehicles/available'),
      api.get('/api/drivers/available'),
    ]).then(([t, v, d]) => {
      setTrips(t.data.trips);
      setVehicles(v.data.vehicles);
      setDrivers(d.data.drivers);
    }).catch(() => addToast('Failed to load', 'error')).finally(() => setLoading(false));
  };
  useEffect(() => {
    fetch();
    if (location.state?.openModal === 'add') {
      setForm({ source: '', destination: '', vehicle_id: '', driver_id: '', cargo_weight: '', planned_distance: '' });
      setModal('add');
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/trips', { ...form, cargo_weight: Number(form.cargo_weight), planned_distance: Number(form.planned_distance) });
      addToast('Trip created', 'success'); setModal(null); fetch();
    } catch (err) { addToast(err.response?.data?.error || 'Failed', 'error'); }
  };

  const handleDispatch = async (trip) => {
    try {
      await api.put(`/api/trips/${trip.id}/dispatch`);
      addToast('Trip dispatched!', 'success'); fetch();
    } catch (err) { addToast(err.response?.data?.error || 'Failed', 'error'); }
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/trips/${selected.id}/complete`, completeForm);
      addToast('Trip completed!', 'success'); setModal(null); fetch();
    } catch (err) { addToast(err.response?.data?.error || 'Failed', 'error'); }
  };

  const handleCancel = async (trip) => {
    if (!confirm('Cancel this trip?')) return;
    try {
      await api.put(`/api/trips/${trip.id}/cancel`);
      addToast('Trip cancelled', 'warning'); fetch();
    } catch (err) { addToast(err.response?.data?.error || 'Failed', 'error'); }
  };

  const columns = [
    { header: 'ID', accessor: 'id', render: r => <span className="font-mono">TRP-{String(r.id).padStart(3, '0')}</span> },
    { header: 'Route', key: 'route', render: r => <span>{r.source} → {r.destination}</span> },
    { header: 'Vehicle', accessor: 'vehicle_reg', render: r => <span className="font-mono">{r.vehicle_reg}</span> },
    { header: 'Driver', accessor: 'driver_name' },
    { header: 'Cargo (kg)', accessor: 'cargo_weight', render: r => r.cargo_weight?.toLocaleString() || '—' },
    { header: 'Distance (km)', accessor: 'planned_distance', render: r => r.planned_distance?.toLocaleString() || '—' },
    { header: 'Status', accessor: 'status', render: r => <span className={`badge badge-${r.status === 'Completed' ? 'success' : r.status === 'Dispatched' ? 'info' : r.status === 'Draft' ? 'warning' : 'error'}`}>{r.status}</span> },
    { header: 'Actions', key: 'actions', sortable: false, render: r => (
      <div className="table-actions">
        {r.status === 'Draft' && <button className="icon-btn icon-btn-success" onClick={e => { e.stopPropagation(); handleDispatch(r); }} title="Dispatch"><Play size={14} /></button>}
        {r.status === 'Dispatched' && <button className="icon-btn icon-btn-success" onClick={e => { e.stopPropagation(); setSelected(r); setCompleteForm({ actual_distance: r.planned_distance, fuel_consumed: '' }); setModal('complete'); }} title="Complete"><CheckCircle size={14} /></button>}
        {(r.status === 'Draft' || r.status === 'Dispatched') && <button className="icon-btn icon-btn-danger" onClick={e => { e.stopPropagation(); handleCancel(r); }} title="Cancel"><XCircle size={14} /></button>}
      </div>
    )},
  ];

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div className="page-enter">
      <div className="page-header">
        <div><h2>Trip Management</h2><p className="text-muted">{trips.length} trips total</p></div>
        <button className="btn btn-primary" onClick={() => { setForm({ source: '', destination: '', vehicle_id: '', driver_id: '', cargo_weight: '', planned_distance: '' }); setModal('add'); }}>
          <Plus size={16} /> Create Trip
        </button>
      </div>

      <div className="trip-status-pills">
        {['All', 'Draft', 'Dispatched', 'Completed', 'Cancelled'].map(s => {
          const count = s === 'All' ? trips.length : trips.filter(t => t.status === s).length;
          return <span key={s} className="status-pill">{s} ({count})</span>;
        })}
      </div>

      <Table columns={columns} data={trips} />

      {/* Create Trip Modal */}
      <Modal isOpen={modal === 'add'} onClose={() => setModal(null)} title="Create New Trip">
        <form onSubmit={handleCreate} className="modal-form">
          <div className="form-grid">
            <div className="form-group"><label>Source</label><input required value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} placeholder="Mumbai" /></div>
            <div className="form-group"><label>Destination</label><input required value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} placeholder="Pune" /></div>
            <div className="form-group">
              <label>Vehicle (Available only)</label>
              <select required value={form.vehicle_id} onChange={e => setForm(f => ({ ...f, vehicle_id: e.target.value }))}>
                <option value="">Select vehicle</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number} — {v.name} (Max: {v.max_load_capacity}kg)</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Driver (Available only)</label>
              <select required value={form.driver_id} onChange={e => setForm(f => ({ ...f, driver_id: e.target.value }))}>
                <option value="">Select driver</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name} — {d.license_category}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Cargo Weight (kg)</label><input type="number" min="0" value={form.cargo_weight} onChange={e => setForm(f => ({ ...f, cargo_weight: e.target.value }))} /></div>
            <div className="form-group"><label>Planned Distance (km)</label><input type="number" min="0" value={form.planned_distance} onChange={e => setForm(f => ({ ...f, planned_distance: e.target.value }))} /></div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Trip</button>
          </div>
        </form>
      </Modal>

      {/* Complete Trip Modal */}
      <Modal isOpen={modal === 'complete'} onClose={() => setModal(null)} title="Complete Trip">
        <form onSubmit={handleComplete} className="modal-form">
          <p className="text-muted" style={{ marginBottom: 16 }}>Enter final trip details for {selected?.source} → {selected?.destination}</p>
          <div className="form-grid">
            <div className="form-group"><label>Actual Distance (km)</label><input type="number" min="0" value={completeForm.actual_distance} onChange={e => setCompleteForm(f => ({ ...f, actual_distance: e.target.value }))} /></div>
            <div className="form-group"><label>Fuel Consumed (liters)</label><input type="number" min="0" step="0.1" value={completeForm.fuel_consumed} onChange={e => setCompleteForm(f => ({ ...f, fuel_consumed: e.target.value }))} /></div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Complete Trip</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
