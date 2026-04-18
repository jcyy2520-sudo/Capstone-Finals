import { Routes, Route, Navigate } from 'react-router-dom';
import GenericLayout from '../../shared/layouts/GenericLayout';
import DepartmentRequesterSidebar from './components/DepartmentRequesterSidebar';
import DashboardPage from './pages/DashboardPage';
import AppEntriesPage from './pages/AppEntriesPage';
import PurchaseRequisitionsPage from './pages/PurchaseRequisitionsPage';
import InspectionsPage from './pages/InspectionsPage';

export default function DepartmentRequesterRoutes() {
  return (
    <Routes>
      <Route path="/requester" element={<GenericLayout Sidebar={DepartmentRequesterSidebar} />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="app" element={<AppEntriesPage />} />
        <Route path="purchase-requisitions" element={<PurchaseRequisitionsPage />} />
        <Route path="inspections" element={<InspectionsPage />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}
