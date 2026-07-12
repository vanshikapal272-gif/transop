import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Truck, Users, Route, Wrench,
  Fuel, BarChart3, LogOut
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
  const { user, logout } = useAuth();

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Truck size={16} />
        </div>
        {!collapsed && <span className="sidebar-logo-text">Transit<span>Ops</span></span>}
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Menu</div>
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={18} />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {!collapsed && user && (
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{user.name?.charAt(0)}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.name}</div>
              <div className="sidebar-user-role">{user.role}</div>
            </div>
          </div>
        )}
        <div className="sidebar-item" onClick={logout} style={{ cursor: 'pointer', marginTop: 8 }}>
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </div>
      </div>
    </aside>
  );
}
