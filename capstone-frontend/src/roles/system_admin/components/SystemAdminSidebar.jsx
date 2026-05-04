import RoleSidebarShell from '../../../shared/components/RoleSidebarShell';

export default function SystemAdminSidebar() {
  const menuItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: 'home' },
    { label: 'User Management', path: '/admin/users', icon: 'users' },
    { label: 'Audit Logs', path: '/admin/audit', icon: 'shield' },
    { label: 'Blockchain Monitor', path: '/admin/blockchain', icon: 'link' },
    { label: 'Immutable History', path: '/admin/immutable-history', icon: 'database' },
    { label: 'System Config', path: '/admin/config', icon: 'settings' },
  ];

  return <RoleSidebarShell roleLabel="system admin" menuItems={menuItems} />;
}
