import RoleSidebarShell from '../../../shared/components/RoleSidebarShell';

export default function BacMemberSidebar() {
  const menuItems = [
    { label: 'Dashboard', path: '/bac-member/dashboard', icon: 'home' },
    { label: 'Bid Openings', path: '/bac-member/bid-openings', icon: 'box' },
    { label: 'Evaluations', path: '/bac-member/evaluations', icon: 'clipboard' },
    { label: 'Post-Qualification', path: '/bac-member/post-qualification', icon: 'check-square' },
    { label: 'Resolutions', path: '/bac-member/resolutions', icon: 'file-text' },
  ];

  return <RoleSidebarShell roleLabel="bac member" menuItems={menuItems} />;
}
