import RoleSidebarShell from '../../../shared/components/RoleSidebarShell';

export default function InspectionAcceptanceCommitteeSidebar() {
  const menuItems = [
    { label: 'Dashboard', path: '/iac/dashboard', icon: 'home' },
    { label: 'Inspections', path: '/iac/inspections', icon: 'check-square' },
  ];

  return <RoleSidebarShell roleLabel="inspection acceptance committee" menuItems={menuItems} />;
}