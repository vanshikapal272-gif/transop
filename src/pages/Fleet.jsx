import { useState, useEffect } from 'react';
import api from '../utils/api';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

const TYPES = ['Van', 'Truck', 'Bus', 'Sedan'];
const STATUSES = ['Available', 'On Trip', 'In Shop', 'Retired'];

export default function Fleet() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ registration_number: '', name: '', type: 'Van', max_load_capacity: '', odometer: '', acquisition_cost: '', region: '' });
  const { addToast } = useToast();

  const fetch = () => {
    setLoading(true);
    api.get('/api/vehicles').then(r => setVehicles(r.data.vehicles)).catch(() => addToast('Failed to load vehicles', 'error')).finally(() => setLoading(false));
  };
  useEffect(fetch, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modal === 'edit') {
        await api.put(`/api/vehicles/${selected.id}`, form);
        addToast('Vehicle updated', 'success');
      } else {
        await api.post('/api/vehicles', form);
        addToast('Vehicle added', 'success');
      }
      setModal(null);
      fetch();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed', 'error');
    }
  };

  const handleDelete = async (v) => {
    if (!confirm(`Retire vehicle ${v.registration_number}?`)) return;
    try {
      await api.delete(`/api/vehicles/${v.id}`);
      addToast('Vehicle retired', 'success');
      fetch();
    } catch (err) { addToast(err.response?.data?.error || 'Failed', 'error'); }
  };

  const openEdit = (v) => {
    setSelected(v);
    setForm({ registration_number: v.registration_number, name: v.name, type: v.type, max_load_capacity: v.max_load_capacity, odometer: v.odometer, acquisition_cost: v.acquisition_cost, region: v.region || '' });
    setModal('edit');
  };

  const columns = [
    { header: 'Reg. Number', accessor: 'registration_number', render: r => <span className="font-mono">{r.registration_number}</span> },
    { header: 'Name', accessor: 'name' },
    { header: 'Type', accessor: 'type', render: r => <span className="badge badge-neutral">{r.type}</span> },
    { header: 'Max Load (kg)', accessor: 'max_load_capacity', render: r => r.max_load_capacity.toLocaleString() },
    { header: 'Odometer (km)', accessor: 'odometer', render: r => r.odometer.toLocaleString() },
    { header: 'Cost', accessor: 'acquisition_cost', render: r => formatCurrency(r.acquisition_cost) },
    { header: 'Status', accessor: 'status', render: r => <span className={`badge badge-${r.status === 'Available' ? 'success' : r.status === 'On Trip' ? 'info' : r.status === 'In Shop' ? 'warning' : 'neutral'}`}>{r.status}</span> },
    { header: 'Actions', key: 'actions', sortable: false, render: r => (
      <div className="table-actions">
        <button className="icon-btn" onClick={(e) => { e.stopPropagation(); openEdit(r); }}><Edit2 size={14} /></button>
        <button className="icon-btn icon-btn-danger" onClick={(e) => { e.stopPropagation(); handleDelete(r); }}><Trash2 size={14} /></button>
      </div>
    )},
  ];

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div className="page-enter">
      <div className="page-header">
        <div>
          <h2>Vehicle Registry</h2>
          <p className="text-muted">{vehicles.length} vehicles registered</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm({ registration_number: '', name: '', type: 'Van', max_load_capacity: '', odometer: '', acquisition_cost: '', region: '' }); setModal('add'); }}>
          <Plus size={16} /> Add Vehicle
        </button>
      </div>

      <Table columns={columns} data={vehicles} />

      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal === 'edit' ? 'Edit Vehicle' : 'Add Vehicle'}>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid">
            <div className="form-group"><label>Registration Number</label><input required value={form.registration_number} onChange={e => setForm(f => ({ ...f, registration_number: e.target.value }))} placeholder="MH-12-AB-1234" /></div>
            <div className="form-group"><label>Name / Model</label><input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Tata Ace Gold" /></div>
            <div className="form-group"><label>Type</label><select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>{TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
            <div className="form-group"><label>Max Load Capacity (kg)</label><input type="number" required min="0" value={form.max_load_capacity} onChange={e => setForm(f => ({ ...f, max_load_capacity: e.target.value }))} /></div>
            <div className="form-group"><label>Odometer (km)</label><input type="number" min="0" value={form.odometer} onChange={e => setForm(f => ({ ...f, odometer: e.target.value }))} /></div>
            <div className="form-group"><label>Acquisition Cost (₹)</label><input type="number" min="0" value={form.acquisition_cost} onChange={e => setForm(f => ({ ...f, acquisition_cost: e.target.value }))} /></div>
            <div className="form-group"><label>Region</label><input value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} placeholder="West" /></div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{modal === 'edit' ? 'Update' : 'Add Vehicle'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
