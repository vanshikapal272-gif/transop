import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div className={`app-main ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <Topbar collapsed={collapsed} onMenuClick={() => setCollapsed(c => !c)} />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
