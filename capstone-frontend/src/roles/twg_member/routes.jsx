import { Routes, Route, Navigate } from 'react-router-dom';
import GenericLayout from '../../shared/layouts/GenericLayout';
import TwgMemberSidebar from './components/TwgMemberSidebar';
import DashboardPage from './pages/DashboardPage';
import EvaluationsPage from './pages/EvaluationsPage';
import PostQualificationPage from './pages/PostQualificationPage';

export default function TwgMemberRoutes() {
  return (
    <Routes>
      <Route path="/twg" element={<GenericLayout Sidebar={TwgMemberSidebar} />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="evaluations" element={<EvaluationsPage />} />
        <Route path="post-qualification" element={<PostQualificationPage />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}
