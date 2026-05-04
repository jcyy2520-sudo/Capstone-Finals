import { Routes, Route, Navigate } from 'react-router-dom';
import GenericLayout from '../../shared/layouts/GenericLayout';
import ProcurementOfficerSidebar from './components/ProcurementOfficerSidebar';
import DashboardPage from './pages/DashboardPage';
import AppEntriesPage from './pages/AppEntriesPage';
import PurchaseRequisitionsPage from './pages/PurchaseRequisitionsPage';
import ContractsPage from './pages/ContractsPage';

export default function ProcurementOfficerRoutes() {
  return (
    <Routes>
      <Route path="/procurement" element={<GenericLayout Sidebar={ProcurementOfficerSidebar} />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="app" element={<AppEntriesPage />} />
        <Route path="purchase-requisitions" element={<PurchaseRequisitionsPage />} />
        <Route path="contracts" element={<ContractsPage />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}