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
    { label: 'Post-Qualification', path: '/chairperson/post-qualification', icon: 'search' },
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
    { label: 'Post-Qualification', path: '/secretariat/post-qualification', icon: 'search' },
    { label: 'Reports', path: '/secretariat/reports', icon: 'bar-chart' },
  ],
  bac_member: [
    { label: 'Dashboard', path: '/bac-member/dashboard', icon: 'home' },
    { label: 'Bid Openings', path: '/bac-member/bid-openings', icon: 'box' },
    { label: 'Evaluations', path: '/bac-member/evaluations', icon: 'clipboard' },
    { label: 'Post-Qualification', path: '/bac-member/post-qualification', icon: 'search' },
    { label: 'Resolutions', path: '/bac-member/resolutions', icon: 'file-text' },
  ],
  twg_member: [
    { label: 'Dashboard', path: '/twg/dashboard', icon: 'home' },
    { label: 'Evaluations', path: '/twg/evaluations', icon: 'clipboard' },
    { label: 'Post-Qualification', path: '/twg/post-qualification', icon: 'search' },
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

const COMPONENT_MAP = {
  'Dashboard': 'DashboardPage',
  'Annual Plan': 'AppEntriesPage',
  'Purchase Requisitions': 'PurchaseRequisitionsPage',
  'Invitations': 'InvitationsPage',
  'Bid Openings': 'BidOpeningsPage',
  'Evaluations': 'EvaluationsPage',
  'Post-Qualification': 'PostQualificationPage',
  'Awards': 'AwardsPage',
  'Contracts': 'ContractsPage',
};

Object.keys(menuConfig).forEach(roleKey => {
  const items = menuConfig[roleKey];
  const componentName = roleKey.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
  const basepath = items[0].path.split('/')[1];

  let imports = [
    `import React from 'react';`,
    `import { Routes, Route, Navigate } from 'react-router-dom';`,
    `import GenericLayout from '../../shared/layouts/GenericLayout';`,
    `import PlaceholderPage from '../../shared/pages/PlaceholderPage';`,
    `import ${componentName}Sidebar from './components/${componentName}Sidebar';`
  ];

  let addedImports = new Set();
  
  let routeElements = items.map(i => {
    let compFile = COMPONENT_MAP[i.label];
    let compCall = '';

    if (compFile) {
        if (!addedImports.has(compFile)) {
            imports.push(`import ${compFile} from './pages/${compFile}';`);
            addedImports.add(compFile);
        }
        compCall = `<${compFile} />`;
    } else {
        compCall = `<PlaceholderPage title="${i.label}" />`;
    }

    return `        <Route path="${i.path.replace(`/${basepath}/`, '')}" element={${compCall}} />`;
  });

  const routesContent = `${imports.join('\n')}

export default function ${componentName}Routes() {
  return (
    <Routes>
      <Route element={<GenericLayout Sidebar={${componentName}Sidebar} />}>
${routeElements.join('\n')}
        <Route path="*" element={<Navigate to="${items[0].path}" replace />} />
      </Route>
    </Routes>
  );
}
`;

  fs.writeFileSync(path.join(__dirname, 'src', 'roles', roleKey, 'routes.jsx'), routesContent);
});

console.log("Rewrote routes successfully.");
