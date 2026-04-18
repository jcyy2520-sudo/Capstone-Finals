import RoleSidebarShell from '../../../shared/components/RoleSidebarShell';

export default function BudgetOfficerSidebar() {
  const menuItems = [
    { label: 'Dashboard', path: '/budget/dashboard', icon: 'home' },
    { label: 'Budget Certification', path: '/budget/certification', icon: 'dollar-sign' },
    { label: 'Reports', path: '/budget/reports', icon: 'bar-chart' },
  ];

  return <RoleSidebarShell roleLabel="budget officer" menuItems={menuItems} />;
}
