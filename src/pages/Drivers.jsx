import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../utils/api';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { Plus, Edit2, ShieldOff, AlertTriangle } from 'lucide-react';
import { formatDate } from '../utils/helpers';

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: '', license_number: '', license_category: 'HMV', license_expiry: '', contact_number: '', safety_score: 80 });
  const [selected, setSelected] = useState(null);
  const { addToast } = useToast();
  const location = useLocation();

  const fetch = () => {
    setLoading(true);
    api.get('/api/drivers').then(r => setDrivers(r.data.drivers)).catch(() => addToast('Failed to load drivers', 'error')).finally(() => setLoading(false));
  };
  
  useEffect(() => {
    fetch();
    if (location.state?.openModal === 'add') {
      setForm({ name: '', license_number: '', license_category: 'HMV', license_expiry: '', contact_number: '', safety_score: 80 });
      setModal('add');
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modal === 'edit') {
        await api.put(`/api/drivers/${selected.id}`, form);
        addToast('Driver updated', 'success');
      } else {
        await api.post('/api/drivers', form);
        addToast('Driver added', 'success');
      }
      setModal(null); fetch();
    } catch (err) { addToast(err.response?.data?.error || 'Failed', 'error'); }
  };

  const handleSuspend = async (d) => {
    if (!confirm(`Suspend driver ${d.name}?`)) return;
    try {
      await api.put(`/api/drivers/${d.id}/suspend`);
      addToast('Driver suspended', 'warning'); fetch();
    } catch (err) { addToast(err.response?.data?.error || 'Failed', 'error'); }
  };

  const openEdit = (d) => {
    setSelected(d);
    setForm({ name: d.name, license_number: d.license_number, license_category: d.license_category, license_expiry: d.license_expiry, contact_number: d.contact_number, safety_score: d.safety_score });
    setModal('edit');
  };

  const columns = [
    { header: 'Name', accessor: 'name', render: r => <span className="font-medium">{r.name}</span> },
    { header: 'License #', accessor: 'license_number', render: r => <span className="font-mono text-sm">{r.license_number}</span> },
    { header: 'Category', accessor: 'license_category' },
    { header: 'License Expiry', accessor: 'license_expiry', render: r => (
      <span className={r.license_expired ? 'text-error' : r.license_expiring_soon ? 'text-warning' : ''}>
        {r.license_expired && <AlertTriangle size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />}
        {formatDate(r.license_expiry)}
      </span>
    )},
    { header: 'Contact', accessor: 'contact_number' },
    { header: 'Safety Score', accessor: 'safety_score', render: r => (
      <div className="safety-score">
        <div className="score-bar"><div className="score-fill" style={{ width: `${r.safety_score}%`, background: r.safety_score >= 80 ? '#10b981' : r.safety_score >= 60 ? '#f59e0b' : '#ef4444' }} /></div>
        <span>{r.safety_score}</span>
      </div>
    )},
    { header: 'Status', accessor: 'status', render: r => <span className={`badge badge-${r.status === 'Available' ? 'success' : r.status === 'On Trip' ? 'info' : r.status === 'Off Duty' ? 'neutral' : 'error'}`}>{r.status}</span> },
    { header: 'Actions', key: 'actions', sortable: false, render: r => (
      <div className="table-actions">
        <button className="icon-btn" onClick={(e) => { e.stopPropagation(); openEdit(r); }}><Edit2 size={14} /></button>
        {r.status !== 'Suspended' && r.status !== 'On Trip' && (
          <button className="icon-btn icon-btn-danger" onClick={(e) => { e.stopPropagation(); handleSuspend(r); }} title="Suspend"><ShieldOff size={14} /></button>
        )}
      </div>
    )},
  ];

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div className="page-enter">
      <div className="page-header">
        <div><h2>Driver Management</h2><p className="text-muted">{drivers.length} drivers registered</p></div>
        <button className="btn btn-primary" onClick={() => { setForm({ name: '', license_number: '', license_category: 'HMV', license_expiry: '', contact_number: '', safety_score: 80 }); setModal('add'); }}>
          <Plus size={16} /> Add Driver
        </button>
      </div>
      <Table columns={columns} data={drivers} />
      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal === 'edit' ? 'Edit Driver' : 'Add Driver'}>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid">
            <div className="form-group"><label>Full Name</label><input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="form-group"><label>License Number</label><input required value={form.license_number} onChange={e => setForm(f => ({ ...f, license_number: e.target.value }))} /></div>
            <div className="form-group"><label>Category</label><select value={form.license_category} onChange={e => setForm(f => ({ ...f, license_category: e.target.value }))}><option>HMV</option><option>LMV</option><option>HGMV</option></select></div>
            <div className="form-group"><label>License Expiry</label><input type="date" required value={form.license_expiry} onChange={e => setForm(f => ({ ...f, license_expiry: e.target.value }))} /></div>
            <div className="form-group"><label>Contact Number</label><input required value={form.contact_number} onChange={e => setForm(f => ({ ...f, contact_number: e.target.value }))} /></div>
            <div className="form-group"><label>Safety Score (0-100)</label><input type="number" min="0" max="100" value={form.safety_score} onChange={e => setForm(f => ({ ...f, safety_score: e.target.value }))} /></div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{modal === 'edit' ? 'Update' : 'Add Driver'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
