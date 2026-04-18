import RoleSidebarShell from '../../../shared/components/RoleSidebarShell';

export default function FinanceOfficerSidebar() {
  const menuItems = [
    { label: 'Dashboard', path: '/finance/dashboard', icon: 'home' },
    { label: 'Invoices', path: '/finance/invoices', icon: 'file-text' },
    { label: 'Payments', path: '/finance/payments', icon: 'credit-card' },
    { label: 'Reports', path: '/finance/reports', icon: 'bar-chart' },
  ];

  return <RoleSidebarShell roleLabel="finance officer" menuItems={menuItems} />;
}
