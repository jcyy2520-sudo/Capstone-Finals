import { Routes, Route, Navigate } from 'react-router-dom';
import GenericLayout from '../../shared/layouts/GenericLayout';
import InternalAuditorSidebar from './components/InternalAuditorSidebar';
import DashboardPage from './pages/DashboardPage';
import AuditPage from './pages/AuditPage';
import BlockchainPage from './pages/BlockchainPage';
import ReportsPage from './pages/ReportsPage';

export default function InternalAuditorRoutes() {
  return (
    <Routes>
      <Route path="/auditor" element={<GenericLayout Sidebar={InternalAuditorSidebar} />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="blockchain" element={<BlockchainPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}
