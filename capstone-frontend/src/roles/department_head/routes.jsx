import { Routes, Route, Navigate } from 'react-router-dom';
import GenericLayout from '../../shared/layouts/GenericLayout';
import DepartmentHeadSidebar from './components/DepartmentHeadSidebar';
import DashboardPage from './pages/DashboardPage';
import AppEntriesPage from './pages/AppEntriesPage';
import PurchaseRequisitionsPage from './pages/PurchaseRequisitionsPage';

export default function DepartmentHeadRoutes() {
  return (
    <Routes>
      <Route path="/department-head" element={<GenericLayout Sidebar={DepartmentHeadSidebar} />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="app" element={<AppEntriesPage />} />
        <Route path="purchase-requisitions" element={<PurchaseRequisitionsPage />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}