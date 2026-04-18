import { Routes, Route, Navigate } from 'react-router-dom';
import GenericLayout from '../../shared/layouts/GenericLayout';
import SystemAdminSidebar from './components/SystemAdminSidebar';
import DashboardPage from './pages/DashboardPage';
import UserManagementPage from './pages/UserManagementPage';
import AuditLogsPage from './pages/AuditLogsPage';
import BlockchainMonitorPage from './pages/BlockchainMonitorPage';
import SystemConfigPage from './pages/SystemConfigPage';

export default function SystemAdminRoutes() {
  return (
    <Routes>
      <Route path="/admin" element={<GenericLayout Sidebar={SystemAdminSidebar} />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="users" element={<UserManagementPage />} />
        <Route path="audit" element={<AuditLogsPage />} />
        <Route path="blockchain" element={<BlockchainMonitorPage />} />
        <Route path="config" element={<SystemConfigPage />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}
