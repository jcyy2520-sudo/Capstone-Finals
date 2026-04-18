import { Routes, Route, Navigate } from 'react-router-dom';
import GenericLayout from '../../shared/layouts/GenericLayout';
import BudgetOfficerSidebar from './components/BudgetOfficerSidebar';
import DashboardPage from './pages/DashboardPage';
import CertificationPage from './pages/CertificationPage';
import ReportsPage from './pages/ReportsPage';

export default function BudgetOfficerRoutes() {
  return (
    <Routes>
      <Route path="/budget" element={<GenericLayout Sidebar={BudgetOfficerSidebar} />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="certification" element={<CertificationPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}
