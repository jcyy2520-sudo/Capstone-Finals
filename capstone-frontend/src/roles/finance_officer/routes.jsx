import { Routes, Route, Navigate } from 'react-router-dom';
import GenericLayout from '../../shared/layouts/GenericLayout';
import FinanceOfficerSidebar from './components/FinanceOfficerSidebar';
import DashboardPage from './pages/DashboardPage';
import InvoicesPage from './pages/InvoicesPage';
import PaymentsPage from './pages/PaymentsPage';
import ReportsPage from './pages/ReportsPage';

export default function FinanceOfficerRoutes() {
  return (
    <Routes>
      <Route path="/finance" element={<GenericLayout Sidebar={FinanceOfficerSidebar} />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}
