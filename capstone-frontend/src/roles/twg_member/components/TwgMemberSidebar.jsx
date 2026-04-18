import RoleSidebarShell from '../../../shared/components/RoleSidebarShell';

export default function TwgMemberSidebar() {
  const menuItems = [
    { label: 'Dashboard', path: '/twg/dashboard', icon: 'home' },
    { label: 'Evaluations', path: '/twg/evaluations', icon: 'clipboard' },
    { label: 'Post-Qualification', path: '/twg/post-qualification', icon: 'check-square' },
  ];

  return <RoleSidebarShell roleLabel="twg member" menuItems={menuItems} />;
}
