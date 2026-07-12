import { useState, useEffect } from 'react';
import api from '../utils/api';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { Plus, CheckCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';

export default function Maintenance() {
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ vehicle_id: '', type: '', description: '', cost: '' });
  const { addToast } = useToast();

  const fetch = () => {
    setLoading(true);
    Promise.all([api.get('/api/maintenance'), api.get('/api/vehicles')])
      .then(([m, v]) => { setLogs(m.data.maintenance); setVehicles(v.data.vehicles.filter(x => x.status !== 'On Trip')); })
      .catch(() => addToast('Failed to load', 'error')).finally(() => setLoading(false));
  };
  useEffect(fetch, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/maintenance', { ...form, cost: Number(form.cost) || 0 });
      addToast('Maintenance record created — vehicle set to In Shop', 'success');
      setModal(false); fetch();
    } catch (err) { addToast(err.response?.data?.error || 'Failed', 'error'); }
  };

  const handleClose = async (log) => {
    if (!confirm(`Close maintenance for ${log.vehicle_reg}?`)) return;
    try {
      await api.put(`/api/maintenance/${log.id}/close`);
      addToast('Maintenance closed — vehicle restored to Available', 'success'); fetch();
    } catch (err) { addToast(err.response?.data?.error || 'Failed', 'error'); }
  };

  const columns = [
    { header: 'ID', accessor: 'id', render: r => <span className="font-mono">MNT-{String(r.id).padStart(3,'0')}</span> },
    { header: 'Vehicle', accessor: 'vehicle_reg', render: r => <span className="font-mono">{r.vehicle_reg}</span> },
    { header: 'Type', accessor: 'type' },
    { header: 'Description', accessor: 'description', render: r => <span className="text-truncate">{r.description || '—'}</span> },
    { header: 'Cost', accessor: 'cost', render: r => formatCurrency(r.cost) },
    { header: 'Created', accessor: 'created_at', render: r => formatDate(r.created_at) },
    { header: 'Closed', accessor: 'closed_at', render: r => r.closed_at ? formatDate(r.closed_at) : '—' },
    { header: 'Status', accessor: 'status', render: r => <span className={`badge badge-${r.status === 'Active' ? 'warning' : 'success'}`}>{r.status}</span> },
    { header: 'Actions', key: 'actions', sortable: false, render: r => r.status === 'Active' ? (
      <button className="icon-btn icon-btn-success" onClick={e => { e.stopPropagation(); handleClose(r); }} title="Close"><CheckCircle size={14} /></button>
    ) : null },
  ];

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div className="page-enter">
      <div className="page-header">
        <div><h2>Maintenance</h2><p className="text-muted">{logs.filter(l => l.status === 'Active').length} active, {logs.length} total records</p></div>
        <button className="btn btn-primary" onClick={() => { setForm({ vehicle_id: '', type: '', description: '', cost: '' }); setModal(true); }}>
          <Plus size={16} /> New Record
        </button>
      </div>
      <Table columns={columns} data={logs} />
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Create Maintenance Record">
        <form onSubmit={handleCreate} className="modal-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Vehicle</label>
              <select required value={form.vehicle_id} onChange={e => setForm(f => ({ ...f, vehicle_id: e.target.value }))}>
                <option value="">Select vehicle</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number} — {v.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Maintenance Type</label><input required value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} placeholder="Oil Change, Brake Repair..." /></div>
            <div className="form-group full-width"><label>Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} /></div>
            <div className="form-group"><label>Estimated Cost (₹)</label><input type="number" min="0" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} /></div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Record</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
