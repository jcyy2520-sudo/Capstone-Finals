import { Routes, Route, Navigate } from 'react-router-dom';
import GenericLayout from '../../shared/layouts/GenericLayout';
import HopeSidebar from './components/HopeSidebar';
import DashboardPage from './pages/DashboardPage';
import ApprovalsPage from './pages/ApprovalsPage';
import ResolutionApprovalsPage from './pages/ResolutionApprovalsPage';
import AwardManagementPage from './pages/AwardManagementPage';
import AlternativeModeApprovalsPage from './pages/AlternativeModeApprovalsPage';
import ReportsPage from './pages/ReportsPage';

export default function HopeRoutes() {
  return (
    <Routes>
      <Route path="/hope" element={<GenericLayout Sidebar={HopeSidebar} />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="approvals" element={<ApprovalsPage />} />
        <Route path="alternative-modes" element={<AlternativeModeApprovalsPage />} />
        <Route path="resolutions" element={<ResolutionApprovalsPage />} />
        <Route path="awards" element={<AwardManagementPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}
