import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Truck, Shield, BarChart3, Route, Sun, Moon, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email: form.email, password: form.password });
      navigate('/app/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { email: 'fleet@transitops.in', role: 'Fleet Manager' },
    { email: 'dispatch@transitops.in', role: 'Dispatcher' },
    { email: 'safety@transitops.in', role: 'Safety Officer' },
    { email: 'finance@transitops.in', role: 'Financial Analyst' },
  ];

  return (
    <div className="login-page">
      {/* Left Brand Panel */}
      <div className="login-brand">
        <div className="login-brand-logo">
          <Truck size={32} color="#451a03" />
        </div>
        <h1>TransitOps</h1>
        <p>Smart Transport Operations Platform — digitize your fleet, enforce business rules, gain insights.</p>
        <div className="login-features">
          <div className="login-feature-item"><Shield size={18} /> 10 business rules auto-enforced</div>
          <div className="login-feature-item"><Route size={18} /> Complete trip lifecycle management</div>
          <div className="login-feature-item"><BarChart3 size={18} /> Real-time fleet analytics & ROI</div>
          <div className="login-feature-item"><Truck size={18} /> Live vehicle tracking on map</div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="login-form-side">
        <div className="login-form-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <h2>Welcome back</h2>
              <p>Sign in to your account to continue</p>
            </div>
            <button className="topbar-theme-toggle" onClick={toggleTheme} style={{ marginTop: 4 }}>
              {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
            </button>
          </div>

          {error && <div className="login-error">{error}</div>}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@transitops.in"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}
              style={{ marginTop: 8 }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="login-roles">
            <h4>Demo Accounts</h4>
            {roles.map(r => (
              <div key={r.email} className="login-role-item">
                <span>{r.role}</span>
                <code>{r.email}</code>
              </div>
            ))}
            <div className="login-role-item" style={{ marginTop: 4, borderTop: '1px solid var(--border-light)', paddingTop: 4 }}>
              <span>Password (all)</span>
              <code>Transit@2026</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
