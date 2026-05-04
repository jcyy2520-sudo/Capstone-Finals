import RoleSidebarShell from '../../../shared/components/RoleSidebarShell';

export default function ProcurementOfficerSidebar() {
  const menuItems = [
    { label: 'Dashboard', path: '/procurement/dashboard', icon: 'home' },
    { label: 'Annual Plan', path: '/procurement/app', icon: 'calendar' },
    { label: 'Purchase Requisitions', path: '/procurement/purchase-requisitions', icon: 'shopping-cart' },
    { label: 'Contracts', path: '/procurement/contracts', icon: 'file-text' },
  ];

  return <RoleSidebarShell roleLabel="procurement officer" menuItems={menuItems} />;
}