import RoleSidebarShell from '../../../shared/components/RoleSidebarShell';

export default function DepartmentHeadSidebar() {
  const menuItems = [
    { label: 'Dashboard', path: '/department-head/dashboard', icon: 'home' },
    { label: 'APP Endorsements', path: '/department-head/app', icon: 'calendar' },
    { label: 'PR Endorsements', path: '/department-head/purchase-requisitions', icon: 'shopping-cart' },
  ];

  return <RoleSidebarShell roleLabel="department head" menuItems={menuItems} />;
}