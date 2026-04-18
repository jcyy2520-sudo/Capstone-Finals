const fs = require('fs');
const path = require('path');

const menuConfig = {
  system_admin: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: 'home' },
    { label: 'User Management', path: '/admin/users', icon: 'users' },
    { label: 'Audit Logs', path: '/admin/audit', icon: 'shield' },
    { label: 'Blockchain Monitor', path: '/admin/blockchain', icon: 'link' },
    { label: 'System Config', path: '/admin/config', icon: 'settings' },
  ],
  hope: [
    { label: 'Dashboard', path: '/hope/dashboard', icon: 'home' },
    { label: 'Pending Approvals', path: '/hope/approvals', icon: 'check-circle' },
    { label: 'Annual Plan', path: '/hope/app', icon: 'calendar' },
    { label: 'Awards', path: '/hope/awards', icon: 'award' },
    { label: 'Contracts', path: '/hope/contracts', icon: 'file-text' },
    { label: 'Reports', path: '/hope/reports', icon: 'bar-chart' },
  ],
  bac_chairperson: [
    { label: 'Dashboard', path: '/chairperson/dashboard', icon: 'home' },
    { label: 'Invitations', path: '/chairperson/invitations', icon: 'send' },
    { label: 'Bid Openings', path: '/chairperson/bid-openings', icon: 'box' },
    { label: 'Evaluations', path: '/chairperson/evaluations', icon: 'clipboard' },
    { label: 'Resolutions', path: '/chairperson/resolutions', icon: 'file-text' },
    { label: 'Reports', path: '/chairperson/reports', icon: 'bar-chart' },
  ],
  bac_secretariat: [
    { label: 'Dashboard', path: '/secretariat/dashboard', icon: 'home' },
    { label: 'Purchase Requisitions', path: '/secretariat/purchase-requisitions', icon: 'shopping-cart' },
    { label: 'Annual Plan', path: '/secretariat/app', icon: 'calendar' },
    { label: 'Invitations', path: '/secretariat/invitations', icon: 'send' },
    { label: 'Pre-screening', path: '/secretariat/pre-screening', icon: 'search' },
    { label: 'Bid Openings', path: '/secretariat/bid-openings', icon: 'box' },
    { label: 'Awards', path: '/secretariat/awards', icon: 'award' },
    { label: 'Contracts', path: '/secretariat/contracts', icon: 'file-text' },
    { label: 'Reports', path: '/secretariat/reports', icon: 'bar-chart' },
  ],
  bac_member: [
    { label: 'Dashboard', path: '/bac-member/dashboard', icon: 'home' },
    { label: 'Bid Openings', path: '/bac-member/bid-openings', icon: 'box' },
    { label: 'Evaluations', path: '/bac-member/evaluations', icon: 'clipboard' },
    { label: 'Resolutions', path: '/bac-member/resolutions', icon: 'file-text' },
  ],
  twg_member: [
    { label: 'Dashboard', path: '/twg/dashboard', icon: 'home' },
    { label: 'Evaluations', path: '/twg/evaluations', icon: 'clipboard' },
  ],
  department_requester: [
    { label: 'Dashboard', path: '/requester/dashboard', icon: 'home' },
    { label: 'Annual Plan', path: '/requester/app', icon: 'calendar' },
    { label: 'Purchase Requisitions', path: '/requester/purchase-requisitions', icon: 'shopping-cart' },
    { label: 'Inspections', path: '/requester/inspections', icon: 'check-square' },
  ],
  budget_officer: [
    { label: 'Dashboard', path: '/budget/dashboard', icon: 'home' },
    { label: 'Budget Certification', path: '/budget/certification', icon: 'dollar-sign' },
    { label: 'Annual Plan', path: '/budget/app', icon: 'calendar' },
    { label: 'Reports', path: '/budget/reports', icon: 'bar-chart' },
  ],
  finance_officer: [
    { label: 'Dashboard', path: '/finance/dashboard', icon: 'home' },
    { label: 'Invoices', path: '/finance/invoices', icon: 'file-text' },
    { label: 'Payments', path: '/finance/payments', icon: 'credit-card' },
    { label: 'Reports', path: '/finance/reports', icon: 'bar-chart' },
  ],
  vendor: [
    { label: 'Dashboard', path: '/vendor/dashboard', icon: 'home' },
    { label: 'My Profile', path: '/vendor/profile', icon: 'user' },
    { label: 'Opportunities', path: '/vendor/opportunities', icon: 'search' },
    { label: 'My Bids', path: '/vendor/bids', icon: 'send' },
    { label: 'My Contracts', path: '/vendor/contracts', icon: 'file-text' },
  ],
  observer: [
    { label: 'Dashboard', path: '/observer/dashboard', icon: 'home' },
    { label: 'Procurement Records', path: '/observer/records', icon: 'database' },
    { label: 'Blockchain Audit', path: '/observer/blockchain', icon: 'link' },
    { label: 'Analytics', path: '/observer/analytics', icon: 'bar-chart' },
  ],
  internal_auditor: [
    { label: 'Dashboard', path: '/auditor/dashboard', icon: 'home' },
    { label: 'Audit Trail', path: '/auditor/audit', icon: 'shield' },
    { label: 'Blockchain', path: '/auditor/blockchain', icon: 'link' },
    { label: 'Reports', path: '/auditor/reports', icon: 'bar-chart' },
  ],
};

// Returns a component string defining the sidebar for specific role.
function buildSidebarContent(roleKey, items) {
  return `import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import Icon from '../../shared/components/Icon';

export default function ${roleKey.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = ${JSON.stringify(items, null, 2)};

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className={\`\${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white flex flex-col transition-all duration-300 flex-shrink-0\`}>
      <div className="p-4 border-b border-white/10 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        {sidebarOpen && (
          <div className="overflow-hidden">
            <h1 className="text-lg font-bold leading-tight">ProcureSeal</h1>
            <p className="text-xs text-blue-300/50 truncate">RA 12009 Procurement</p>
            <p className="text-[10px] uppercase mt-0.5 text-blue-400 font-bold">${roleKey.replace('_', ' ')}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) =>
            \`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 \${
              isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }\`
          }>
            <Icon name={item.icon} className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10">
        <button onClick={handleLogout} className="mt-2 w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition">
          <Icon name="logout" className="w-5 h-5 flex-shrink-0" />
          {sidebarOpen && <span>Sign Out</span>}
        </button>
      </div>

      <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-3 border-t border-white/10 text-slate-400 hover:text-white transition flex items-center justify-center">
        <svg className={\`w-5 h-5 transition-transform \${sidebarOpen ? '' : 'rotate-180'}\`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
      </button>
    </aside>
  );
}
`;
}

function buildRoutesContent(roleKey, items) {
  const componentName = roleKey.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
  const imports = [
    `import React from 'react';`,
    `import { Routes, Route, Navigate } from 'react-router-dom';`,
    `import GenericLayout from '../../shared/layouts/GenericLayout';`,
    `import ${componentName}Sidebar from './components/${componentName}Sidebar';`,
    `import DashboardPage from './pages/DashboardPage';`,
  ].join('\n');

  const basepath = items[0].path.split('/')[1];

  let routes = items.map(i => {
    // Determine the component name
    const compName = i.label.replace(/[^a-zA-Z]/g, '') + 'Page';
    if(compName === 'DashboardPage') return `<Route path="${i.path.replace(`/${basepath}/`, '')}" element={<DashboardPage />} />`;
    return `        {/* <Route path="${i.path.replace(`/${basepath}/`, '')}" element={<${compName} />} /> */}`;
  }).join('\n');

  return `${imports}

export default function ${componentName}Routes() {
  return (
    <Routes>
      <Route element={<GenericLayout Sidebar={${componentName}Sidebar} />}>
        ${routes}
        <Route path="*" element={<Navigate to="${items[0].path}" replace />} />
      </Route>
    </Routes>
  );
}
`;
}

function buildDashboardPageContent(roleKey) {
  return `import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Welcome, {user?.name}</h1>
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <p className="text-gray-600">This is the securely isolated dashboard for the <strong>${roleKey}</strong> role.</p>
        <p className="mt-4 text-sm text-gray-500">Your specific metrics and widgets will be loaded here without sharing unauthorized backend logic.</p>
      </div>
    </div>
  );
}
`;
}

Object.keys(menuConfig).forEach(role => {
  const roleBase = path.join(__dirname, 'src', 'roles', role);
  const items = menuConfig[role];
  
  // Write Sidebar
  const sidebarContent = buildSidebarContent(role, items);
  const componentName = role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
  fs.writeFileSync(path.join(roleBase, 'components', `${componentName}Sidebar.jsx`), sidebarContent);

  // Write Dashboard
  fs.writeFileSync(path.join(roleBase, 'pages', 'DashboardPage.jsx'), buildDashboardPageContent(role));

  // Write Routes
  fs.writeFileSync(path.join(roleBase, 'routes.jsx'), buildRoutesContent(role, items));
});

console.log("Boostrapped 12 role folders successfully.");
