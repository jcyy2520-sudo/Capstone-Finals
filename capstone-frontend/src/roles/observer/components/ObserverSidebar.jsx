import RoleSidebarShell from '../../../shared/components/RoleSidebarShell';

export default function ObserverSidebar() {
  const menuItems = [
    { label: 'Dashboard', path: '/observer/dashboard', icon: 'home' },
    { label: 'Procurement Records', path: '/observer/records', icon: 'database' },
    { label: 'Blockchain Audit', path: '/observer/blockchain', icon: 'link' },
    { label: 'Analytics', path: '/observer/analytics', icon: 'bar-chart' },
  ];

  return <RoleSidebarShell roleLabel="observer" menuItems={menuItems} />;
}
