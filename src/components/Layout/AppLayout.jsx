import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <Topbar sidebarCollapsed={collapsed} onToggleSidebar={() => setCollapsed(!collapsed)} />
      <main className={`app-main ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="app-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
