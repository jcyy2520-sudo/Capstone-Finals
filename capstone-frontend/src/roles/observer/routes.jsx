import { Routes, Route, Navigate } from 'react-router-dom';
import GenericLayout from '../../shared/layouts/GenericLayout';
import ObserverSidebar from './components/ObserverSidebar';
import DashboardPage from './pages/DashboardPage';
import RecordsPage from './pages/RecordsPage';
import BlockchainPage from './pages/BlockchainPage';
import AnalyticsPage from './pages/AnalyticsPage';

export default function ObserverRoutes() {
  return (
    <Routes>
      <Route path="/observer" element={<GenericLayout Sidebar={ObserverSidebar} />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="records" element={<RecordsPage />} />
        <Route path="blockchain" element={<BlockchainPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}
