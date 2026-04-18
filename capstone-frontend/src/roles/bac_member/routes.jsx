import { Routes, Route, Navigate } from 'react-router-dom';
import GenericLayout from '../../shared/layouts/GenericLayout';
import BacMemberSidebar from './components/BacMemberSidebar';
import DashboardPage from './pages/DashboardPage';
import BidOpeningsPage from './pages/BidOpeningsPage';
import EvaluationsPage from './pages/EvaluationsPage';
import PostQualificationPage from './pages/PostQualificationPage';
import ResolutionsPage from './pages/ResolutionsPage';

export default function BacMemberRoutes() {
  return (
    <Routes>
      <Route path="/bac-member" element={<GenericLayout Sidebar={BacMemberSidebar} />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="bid-openings" element={<BidOpeningsPage />} />
        <Route path="evaluations" element={<EvaluationsPage />} />
        <Route path="post-qualification" element={<PostQualificationPage />} />
        <Route path="resolutions" element={<ResolutionsPage />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}
