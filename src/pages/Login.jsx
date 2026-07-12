import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Truck, Eye, EyeOff, Sun, Moon, AlertCircle, Shield, Navigation, Wrench, BarChart3 } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    { value: 'fleet@transitops.in', label: 'Fleet Manager', desc: 'Full vehicle & fleet control', icon: Truck, color: '#3b82f6' },
    { value: 'dispatch@transitops.in', label: 'Dispatcher', desc: 'Trip dispatch & tracking', icon: Navigation, color: '#10b981' },
    { value: 'safety@transitops.in', label: 'Safety Officer', desc: 'Driver compliance & safety', icon: Shield, color: '#f59e0b' },
    { value: 'finance@transitops.in', label: 'Financial Analyst', desc: 'Costs, fuel & analytics', icon: BarChart3, color: '#8b5cf6' },
  ];

  const quickLogin = (email) => {
    setForm({ email, password: 'Transit@2026' });
  };

  return (
    <div className="login-page">
      {/* Left Brand Panel */}
      <div className="login-brand">
        <div className="login-brand-logo">
          <div className="login-brand-logo-icon">
            <Truck size={20} />
          </div>
          <span className="login-brand-logo-text">Transit<span>Ops</span></span>
        </div>

        <h1>Smart Transport Operations Platform</h1>
        <p>End-to-end fleet management with real-time dispatch, driver compliance, and operational analytics.</p>

        <div className="login-roles">
          {roles.map(r => (
            <div key={r.value} className="login-role" onClick={() => quickLogin(r.value)} style={{ cursor: 'pointer' }}>
              <div className="login-role-icon" style={{ background: `${r.color}20`, color: r.color }}>
                <r.icon size={16} />
              </div>
              <div>
                <div className="login-role-name">{r.label}</div>
                <div className="login-role-desc">{r.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="login-form-side">
        <div className="login-form-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-4)' }}>
            <div>
              <h2 className="login-form-title">Welcome back</h2>
              <p className="login-form-subtitle">Sign in to your account</p>
            </div>
            <button className="theme-toggle" onClick={toggleTheme} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </div>

          {error && (
            <div className="login-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-wrapper">
              <label className="input-label">EMAIL</label>
              <input
                className="input-field"
                type="email"
                placeholder="fleet@transitops.in"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>

            <div className="input-wrapper">
              <label className="input-label">PASSWORD</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input-field"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  style={{ paddingRight: 40 }}
                />
                <button type="button" onClick={() => setShowPassword(s => !s)}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="login-form-options">
              <label className="login-remember">
                <input type="checkbox" defaultChecked />
                Remember me
              </label>
              <a href="#" className="login-forgot">Forgot password?</a>
            </div>

            <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
              {loading ? <span className="btn-spinner" /> : 'Sign In'}
            </button>
          </form>

          <div className="login-divider"><span>Quick access</span></div>
          <div className="quick-login-grid">
            {roles.map(r => (
              <button key={r.value} className="quick-login-btn" onClick={() => quickLogin(r.value)} type="button">
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
