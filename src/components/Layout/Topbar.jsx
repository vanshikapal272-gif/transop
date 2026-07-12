import { useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Menu, Sun, Moon, Bell, Search, LogOut } from 'lucide-react';

const pageNames = {
  dashboard: 'Dashboard',
  fleet: 'Fleet Registry',
  drivers: 'Driver Management',
  trips: 'Trip Dispatch',
  maintenance: 'Maintenance',
  'fuel-expenses': 'Fuel & Expenses',
  analytics: 'Analytics',
};

export default function Topbar({ sidebarCollapsed, onToggleSidebar }) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();

  const pathSegment = location.pathname.split('/').filter(Boolean).pop() || 'dashboard';
  const pageName = pageNames[pathSegment] || 'Dashboard';

  return (
    <header className={`topbar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="topbar-left">
        <button className="topbar-hamburger" onClick={onToggleSidebar}>
          <Menu size={18} />
        </button>

        <span className="topbar-page-title">{pageName}</span>

        <div className="topbar-search">
          <Search size={14} />
          <input type="text" placeholder="Search anything..." className="form-input" />
        </div>
      </div>

      <div className="topbar-right">
        <button className="topbar-icon-btn" title="Notifications">
          <Bell size={18} />
          <span className="notification-dot" />
        </button>

        <button className="topbar-theme-toggle" onClick={toggleTheme}>
          {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
          <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
        </button>

        <div className="topbar-user-avatar" title={user?.name}>
          {user?.name?.charAt(0) || 'U'}
        </div>

        <button className="topbar-icon-btn" onClick={logout} title="Sign out">
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
