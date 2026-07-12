import { useState, useEffect } from 'react';
import api from '../utils/api';
import { formatCurrency, formatPercentage } from '../utils/helpers';
import { Download, FileText, TrendingUp } from 'lucide-react';
import { BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6'];

export default function Analytics() {
  const [efficiency, setEfficiency] = useState([]);
  const [costs, setCosts] = useState(null);
  const [roi, setRoi] = useState([]);
  const [utilization, setUtilization] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/analytics/fuel-efficiency'),
      api.get('/api/analytics/costs'),
      api.get('/api/analytics/roi'),
      api.get('/api/analytics/fleet-utilization'),
    ]).then(([eff, cost, roiRes, util]) => {
      setEfficiency(eff.data.data.filter(d => d.total_fuel > 0));
      setCosts(cost.data);
      setRoi(roiRes.data.data);
      setUtilization(util.data.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleCSVExport = async () => {
    try {
      const res = await api.get('/api/analytics/export/csv', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = 'transitops_report.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch { alert('Export failed'); }
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div className="page-enter">
      <div className="page-header">
        <div><h2>Reports & Analytics</h2><p className="text-muted">Operational insights and data exports</p></div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={handleCSVExport}><Download size={16} /> Export CSV</button>
        </div>
      </div>

      <div className="charts-grid">
        {/* Fuel Efficiency */}
        <div className="chart-card">
          <h3 className="chart-title">Fuel Efficiency (km/L)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={efficiency.slice(0, 10)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis dataKey="registration_number" type="category" width={120} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="efficiency" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Fleet Utilization Over Time */}
        <div className="chart-card">
          <h3 className="chart-title">Fleet Utilization Over Time</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={utilization}>
              <defs>
                <linearGradient id="utilGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="trips" stroke="#f59e0b" fill="url(#utilGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Cost Breakdown */}
        <div className="chart-card">
          <h3 className="chart-title">Cost Breakdown by Category</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={costs?.expensesByCategory || []} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="total" nameKey="category">
                {(costs?.expensesByCategory || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} formatter={(val) => formatCurrency(val)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="chart-legend">
            {(costs?.expensesByCategory || []).map((item, i) => (
              <span key={i} className="legend-item"><span className="legend-dot" style={{ background: COLORS[i % COLORS.length] }} /> {item.category}: {formatCurrency(item.total)}</span>
            ))}
          </div>
        </div>

        {/* ROI Table */}
        <div className="chart-card chart-card-wide">
          <h3 className="chart-title"><TrendingUp size={16} /> Vehicle ROI</h3>
          <div className="roi-table-wrapper">
            <table className="roi-table">
              <thead>
                <tr><th>Vehicle</th><th>Acquisition</th><th>Revenue</th><th>Total Cost</th><th>ROI</th></tr>
              </thead>
              <tbody>
                {roi.filter(v => v.acquisition_cost > 0).map(v => (
                  <tr key={v.id}>
                    <td><span className="font-mono">{v.registration_number}</span><br /><span className="text-muted text-xs">{v.name}</span></td>
                    <td>{formatCurrency(v.acquisition_cost)}</td>
                    <td>{formatCurrency(v.revenue)}</td>
                    <td>{formatCurrency(v.total_cost)}</td>
                    <td><span className={`badge badge-${v.roi > 0 ? 'success' : v.roi > -10 ? 'warning' : 'error'}`}>{v.roi > 0 ? '+' : ''}{v.roi}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
