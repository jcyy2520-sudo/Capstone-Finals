import RoleSidebarShell from '../../../shared/components/RoleSidebarShell';

export default function DepartmentRequesterSidebar() {
  const menuItems = [
    { label: 'Dashboard', path: '/requester/dashboard', icon: 'home' },
    { label: 'Annual Plan', path: '/requester/app', icon: 'calendar' },
    { label: 'Purchase Requisitions', path: '/requester/purchase-requisitions', icon: 'shopping-cart' },
    { label: 'Inspections', path: '/requester/inspections', icon: 'check-square' },
  ];

  return <RoleSidebarShell roleLabel="department requester" menuItems={menuItems} />;
}
