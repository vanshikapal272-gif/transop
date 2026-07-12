import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Sun, Moon, Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/fleet': 'Fleet Registry',
  '/drivers': 'Driver Management',
  '/trips': 'Trip Management',
  '/maintenance': 'Maintenance',
  '/fuel-expenses': 'Fuel & Expenses',
  '/analytics': 'Reports & Analytics',
};

export default function Topbar({ collapsed, onMenuClick }) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'TransitOps';

  return (
    <header className={`topbar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="topbar-left">
        <button className="topbar-hamburger" onClick={onMenuClick} style={{ display: 'flex' }}>
          <Menu size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: 'var(--fs-lg)', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>{title}</h1>
        </div>
      </div>
      <div className="topbar-right">
        <button className="topbar-icon-btn" onClick={toggleTheme} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <div className="sidebar-user-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
          {user?.name?.charAt(0)}
        </div>
      </div>
    </header>
  );
}
