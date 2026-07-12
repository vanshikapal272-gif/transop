import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../utils/api';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { Plus, Fuel, Receipt } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';

export default function FuelExpenses() {
  const [tab, setTab] = useState('fuel');
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [fuelForm, setFuelForm] = useState({ vehicle_id: '', liters: '', cost: '', date: '' });
  const [expenseForm, setExpenseForm] = useState({ vehicle_id: '', category: 'Toll', amount: '', date: '', description: '' });
  const { addToast } = useToast();
  const location = useLocation();

  const fetch = () => {
    setLoading(true);
    Promise.all([api.get('/api/fuel'), api.get('/api/expenses'), api.get('/api/vehicles')])
      .then(([f, e, v]) => { setFuelLogs(f.data.fuel_logs); setExpenses(e.data.expenses); setVehicles(v.data.vehicles); })
      .catch(() => addToast('Failed to load', 'error')).finally(() => setLoading(false));
  };
  
  useEffect(() => {
    fetch();
    if (location.state?.openModal === 'add') {
      setFuelForm({ vehicle_id: '', liters: '', cost: '', date: '' });
      setModal('fuel');
    }
  }, [location.state]);

  const handleFuelSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/fuel', fuelForm);
      addToast('Fuel log added', 'success'); setModal(null); fetch();
    } catch (err) { addToast(err.response?.data?.error || 'Failed', 'error'); }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/expenses', expenseForm);
      addToast('Expense added', 'success'); setModal(null); fetch();
    } catch (err) { addToast(err.response?.data?.error || 'Failed', 'error'); }
  };

  const fuelColumns = [
    { header: 'Vehicle', accessor: 'vehicle_reg', render: r => <span className="font-mono">{r.vehicle_reg}</span> },
    { header: 'Liters', accessor: 'liters', render: r => `${r.liters} L` },
    { header: 'Cost', accessor: 'cost', render: r => formatCurrency(r.cost) },
    { header: 'Date', accessor: 'date', render: r => formatDate(r.date) },
    { header: 'Trip', accessor: 'trip_id', render: r => r.trip_id ? <span className="font-mono">TRP-{String(r.trip_id).padStart(3,'0')}</span> : '—' },
  ];

  const expenseColumns = [
    { header: 'Vehicle', accessor: 'vehicle_reg', render: r => <span className="font-mono">{r.vehicle_reg}</span> },
    { header: 'Category', accessor: 'category', render: r => <span className="badge badge-neutral">{r.category}</span> },
    { header: 'Amount', accessor: 'amount', render: r => formatCurrency(r.amount) },
    { header: 'Date', accessor: 'date', render: r => formatDate(r.date) },
    { header: 'Description', accessor: 'description', render: r => <span className="text-truncate">{r.description || '—'}</span> },
  ];

  const totalFuel = fuelLogs.reduce((s, f) => s + f.cost, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div className="page-enter">
      <div className="page-header">
        <div>
          <h2>Fuel & Expenses</h2>
          <p className="text-muted">Total Fuel: {formatCurrency(totalFuel)} · Total Expenses: {formatCurrency(totalExpenses)}</p>
        </div>
        <button className="btn btn-primary" onClick={() => { tab === 'fuel' ? setFuelForm({ vehicle_id: '', liters: '', cost: '', date: '' }) : setExpenseForm({ vehicle_id: '', category: 'Toll', amount: '', date: '', description: '' }); setModal(tab); }}>
          <Plus size={16} /> Add {tab === 'fuel' ? 'Fuel Log' : 'Expense'}
        </button>
      </div>

      <div className="tab-bar">
        <button className={`tab-btn ${tab === 'fuel' ? 'active' : ''}`} onClick={() => setTab('fuel')}>
          <Fuel size={16} /> Fuel Logs ({fuelLogs.length})
        </button>
        <button className={`tab-btn ${tab === 'expenses' ? 'active' : ''}`} onClick={() => setTab('expenses')}>
          <Receipt size={16} /> Expenses ({expenses.length})
        </button>
      </div>

      {tab === 'fuel' ? <Table columns={fuelColumns} data={fuelLogs} /> : <Table columns={expenseColumns} data={expenses} />}

      <Modal isOpen={modal === 'fuel'} onClose={() => setModal(null)} title="Add Fuel Log">
        <form onSubmit={handleFuelSubmit} className="modal-form">
          <div className="form-grid">
            <div className="form-group"><label>Vehicle</label><select required value={fuelForm.vehicle_id} onChange={e => setFuelForm(f => ({...f, vehicle_id: e.target.value}))}><option value="">Select</option>{vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number}</option>)}</select></div>
            <div className="form-group"><label>Liters</label><input type="number" step="0.1" required min="0.1" value={fuelForm.liters} onChange={e => setFuelForm(f => ({...f, liters: e.target.value}))} /></div>
            <div className="form-group"><label>Cost (₹)</label><input type="number" required min="1" value={fuelForm.cost} onChange={e => setFuelForm(f => ({...f, cost: e.target.value}))} /></div>
            <div className="form-group"><label>Date</label><input type="date" required value={fuelForm.date} onChange={e => setFuelForm(f => ({...f, date: e.target.value}))} /></div>
          </div>
          <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button><button type="submit" className="btn btn-primary">Add Log</button></div>
        </form>
      </Modal>

      <Modal isOpen={modal === 'expenses'} onClose={() => setModal(null)} title="Add Expense">
        <form onSubmit={handleExpenseSubmit} className="modal-form">
          <div className="form-grid">
            <div className="form-group"><label>Vehicle</label><select required value={expenseForm.vehicle_id} onChange={e => setExpenseForm(f => ({...f, vehicle_id: e.target.value}))}><option value="">Select</option>{vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number}</option>)}</select></div>
            <div className="form-group"><label>Category</label><select value={expenseForm.category} onChange={e => setExpenseForm(f => ({...f, category: e.target.value}))}><option>Toll</option><option>Insurance</option><option>Repair</option><option>Other</option></select></div>
            <div className="form-group"><label>Amount (₹)</label><input type="number" required min="1" value={expenseForm.amount} onChange={e => setExpenseForm(f => ({...f, amount: e.target.value}))} /></div>
            <div className="form-group"><label>Date</label><input type="date" required value={expenseForm.date} onChange={e => setExpenseForm(f => ({...f, date: e.target.value}))} /></div>
            <div className="form-group full-width"><label>Description</label><input value={expenseForm.description} onChange={e => setExpenseForm(f => ({...f, description: e.target.value}))} /></div>
          </div>
          <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button><button type="submit" className="btn btn-primary">Add Expense</button></div>
        </form>
      </Modal>
    </div>
  );
}
