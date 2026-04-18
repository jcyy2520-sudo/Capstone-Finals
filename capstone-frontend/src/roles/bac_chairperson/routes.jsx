import { Routes, Route, Navigate } from 'react-router-dom';
import GenericLayout from '../../shared/layouts/GenericLayout';
import BacChairpersonSidebar from './components/BacChairpersonSidebar';
import DashboardPage from './pages/DashboardPage';
import ModeConfirmationPage from './pages/ModeConfirmationPage';
import PreProcurementConferencesPage from './pages/PreProcurementConferencesPage';
import InvitationsPage from './pages/InvitationsPage';
import BidOpeningsPage from './pages/BidOpeningsPage';
import EvaluationsPage from './pages/EvaluationsPage';
import PostQualificationPage from './pages/PostQualificationPage';
import ResolutionsPage from './pages/ResolutionsPage';
import ReportsPage from './pages/ReportsPage';

export default function BacChairpersonRoutes() {
  return (
    <Routes>
      <Route path="/chairperson" element={<GenericLayout Sidebar={BacChairpersonSidebar} />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="mode-confirmation" element={<ModeConfirmationPage />} />
        <Route path="pre-procurement-conferences" element={<PreProcurementConferencesPage />} />
        <Route path="invitations" element={<InvitationsPage />} />
        <Route path="bid-openings" element={<BidOpeningsPage />} />
        <Route path="evaluations" element={<EvaluationsPage />} />
        <Route path="post-qualification" element={<PostQualificationPage />} />
        <Route path="resolutions" element={<ResolutionsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}
