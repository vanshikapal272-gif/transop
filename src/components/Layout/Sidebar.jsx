import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Truck, Users, Route, Wrench, Fuel,
  BarChart3, ChevronLeft, ChevronRight
} from 'lucide-react';

const navItems = [
  { path: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/app/fleet', label: 'Fleet', icon: Truck },
  { path: '/app/drivers', label: 'Drivers', icon: Users },
  { path: '/app/trips', label: 'Trips', icon: Route },
  { path: '/app/maintenance', label: 'Maintenance', icon: Wrench },
  { path: '/app/fuel-expenses', label: 'Fuel & Expenses', icon: Fuel },
  { path: '/app/analytics', label: 'Analytics', icon: BarChart3 },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { user } = useAuth();

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Truck size={18} />
        </div>
        <div className="sidebar-brand-text">
          Transit<span>Ops</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Toggle Button */}
      <div style={{ padding: '8px 12px' }}>
        <button
          onClick={onToggle}
          className="sidebar-item"
          style={{ width: '100%', justifyContent: collapsed ? 'center' : 'flex-start' }}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>

      {/* User Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name || 'User'}</div>
            <div className="sidebar-user-role">{user?.role || 'Role'}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
