import RoleSidebarShell from '../../../shared/components/RoleSidebarShell';

export default function InternalAuditorSidebar() {
  const menuItems = [
    { label: 'Dashboard', path: '/auditor/dashboard', icon: 'home' },
    { label: 'Audit Trail', path: '/auditor/audit', icon: 'shield' },
    { label: 'Blockchain', path: '/auditor/blockchain', icon: 'link' },
    { label: 'Reports', path: '/auditor/reports', icon: 'bar-chart' },
  ];

  return <RoleSidebarShell roleLabel="internal auditor" menuItems={menuItems} />;
}
