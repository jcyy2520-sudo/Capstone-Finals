import { Routes, Route, Navigate } from 'react-router-dom';
import GenericLayout from '../../shared/layouts/GenericLayout';
import BacSecretariatSidebar from './components/BacSecretariatSidebar';
import DashboardPage from './pages/DashboardPage';
import PurchaseRequisitionsPage from './pages/PurchaseRequisitionsPage';
import AppEntriesPage from './pages/AppEntriesPage';
import PreProcurementConferencePage from './pages/PreProcurementConferencePage';
import InvitationsPage from './pages/InvitationsPage';
import BidOpeningsPage from './pages/BidOpeningsPage';
import AwardsPage from './pages/AwardsPage';
import ContractsPage from './pages/ContractsPage';
import PostQualificationPage from './pages/PostQualificationPage';
import BiddersPage from './pages/BiddersPage';
import EvaluationsPage from './pages/EvaluationsPage';
import PreScreeningPage from './pages/PreScreeningPage';
import ReportsPage from './pages/ReportsPage';
import InvitationBuilderPage from './pages/InvitationBuilderPage';

export default function BacSecretariatRoutes() {
  return (
    <Routes>
      <Route path="/secretariat" element={<GenericLayout Sidebar={BacSecretariatSidebar} />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="purchase-requisitions" element={<PurchaseRequisitionsPage />} />
        <Route path="app" element={<AppEntriesPage />} />
        <Route path="pre-procurement-conferences" element={<PreProcurementConferencePage />} />
        <Route path="invitations" element={<InvitationsPage />} />
        <Route path="invitations/create" element={<InvitationBuilderPage />} />
        <Route path="pre-screening" element={<PreScreeningPage />} />
        <Route path="bid-openings" element={<BidOpeningsPage />} />
        <Route path="evaluations" element={<EvaluationsPage />} />
        <Route path="awards" element={<AwardsPage />} />
        <Route path="contracts" element={<ContractsPage />} />
        <Route path="post-qualification" element={<PostQualificationPage />} />
        <Route path="bidders" element={<BiddersPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}
