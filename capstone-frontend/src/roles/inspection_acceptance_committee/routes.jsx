import { Routes, Route, Navigate } from 'react-router-dom';
import GenericLayout from '../../shared/layouts/GenericLayout';
import InspectionAcceptanceCommitteeSidebar from './components/InspectionAcceptanceCommitteeSidebar';
import DashboardPage from './pages/DashboardPage';
import InspectionsPage from './pages/InspectionsPage';

export default function InspectionAcceptanceCommitteeRoutes() {
  return (
    <Routes>
      <Route path="/iac" element={<GenericLayout Sidebar={InspectionAcceptanceCommitteeSidebar} />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="inspections" element={<InspectionsPage />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}