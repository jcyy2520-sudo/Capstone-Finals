import RoleSidebarShell from '../../../shared/components/RoleSidebarShell';

export default function HopeSidebar() {
  const menuItems = [
    { label: 'Dashboard', path: '/hope/dashboard', icon: 'home' },
    { label: 'My Approval Queue', path: '/hope/approvals', icon: 'check-circle' },
    { label: 'Alternative Modes', path: '/hope/alternative-modes', icon: 'shield' },
    { label: 'BAC Resolutions', path: '/hope/resolutions', icon: 'file-text' },
    { label: 'Awards & NOA', path: '/hope/awards', icon: 'award' },
    { label: 'Reports', path: '/hope/reports', icon: 'bar-chart' },
  ];

  return <RoleSidebarShell roleLabel="hope" menuItems={menuItems} />;
}
