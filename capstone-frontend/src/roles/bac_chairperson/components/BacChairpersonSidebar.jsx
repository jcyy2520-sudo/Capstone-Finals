import RoleSidebarShell from '../../../shared/components/RoleSidebarShell';

export default function BacChairpersonSidebar() {
  const menuItems = [
    { label: 'Dashboard', path: '/chairperson/dashboard', icon: 'home' },
    { label: 'Mode Confirmation', path: '/chairperson/mode-confirmation', icon: 'check-circle' },
    { label: 'Pre-Proc Conferences', path: '/chairperson/pre-procurement-conferences', icon: 'users' },
    { label: 'Invitations', path: '/chairperson/invitations', icon: 'send' },
    { label: 'Bid Openings', path: '/chairperson/bid-openings', icon: 'box' },
    { label: 'Evaluations', path: '/chairperson/evaluations', icon: 'clipboard' },
    { label: 'Post-Qualification', path: '/chairperson/post-qualification', icon: 'check-square' },
    { label: 'Resolutions', path: '/chairperson/resolutions', icon: 'file-text' },
    { label: 'Reports', path: '/chairperson/reports', icon: 'bar-chart' },
  ];

  return <RoleSidebarShell roleLabel="bac chairperson" menuItems={menuItems} />;
}
