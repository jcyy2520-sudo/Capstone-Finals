import { Routes, Route, Navigate, BrowserRouter, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ErrorBoundary from './shared/components/ErrorBoundary';
import { getRoleBasePath, getRoleDashboardPath } from './utils/rolePaths';

// Shared Public Pages
import LoginPage from './shared/pages/LoginPage';
import ForceChangePasswordPage from './shared/pages/ForceChangePasswordPage';
import UnauthorizedPage from './shared/pages/UnauthorizedPage';

// Public Transparency Pages (no auth required)
import PublicLayout from './public/layouts/PublicLayout';
import TransparencyPage from './public/TransparencyPage';
import TransparencyDetailPage from './public/TransparencyDetailPage';
import ProcurementCalendar from './public/ProcurementCalendar';

// Import Specific Role Route Trees
import SystemAdminRoutes from './roles/system_admin/routes';
import HopeRoutes from './roles/hope/routes';
import BacChairpersonRoutes from './roles/bac_chairperson/routes';
import BacSecretariatRoutes from './roles/bac_secretariat/routes';
import BacMemberRoutes from './roles/bac_member/routes';
import TwgMemberRoutes from './roles/twg_member/routes';
import DepartmentRequesterRoutes from './roles/department_requester/routes';
import BudgetOfficerRoutes from './roles/budget_officer/routes';
import FinanceOfficerRoutes from './roles/finance_officer/routes';
import VendorRoutes from './roles/vendor/routes';
import ObserverRoutes from './roles/observer/routes';
import InternalAuditorRoutes from './roles/internal_auditor/routes';

const RoleRouter = () => {
  const { user, loading, requiresPasswordChange, requires2FA, verify2FA } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen bg-gray-50"><p className="text-gray-500 font-medium tracking-wide">Loading Procurement System...</p></div>;
  }

  // Not logged in -> redirect to transparency portal
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/transparency" replace />} />
      </Routes>
    );
  }

  // Check if password change is forced
  if (requiresPasswordChange) {
    return (
      <Routes>
        <Route path="/force-password-change" element={<ForceChangePasswordPage />} />
        <Route path="*" element={<Navigate to="/force-password-change" replace />} />
      </Routes>
    );
  }

  // Check if 2FA verification is pending (Fix 8)
  if (requires2FA) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Walled Garden - Mount strictly the routes assigned to this user's role
  const roleName = user?.role?.name;
  const roleBasePath = getRoleBasePath(roleName);

  if (roleBasePath && !location.pathname.startsWith(roleBasePath)) {
    return <Navigate to={getRoleDashboardPath(roleName)} replace />;
  }

  switch (roleName) {
    case 'system_admin': return <SystemAdminRoutes />;
    case 'hope': return <HopeRoutes />;
    case 'bac_chairperson': return <BacChairpersonRoutes />;
    case 'bac_secretariat': return <BacSecretariatRoutes />;
    case 'bac_member': return <BacMemberRoutes />;
    case 'twg_member': return <TwgMemberRoutes />;
    case 'department_requester': return <DepartmentRequesterRoutes />;
    case 'budget_officer': return <BudgetOfficerRoutes />;
    case 'finance_officer': return <FinanceOfficerRoutes />;
    case 'vendor': return <VendorRoutes />;
    case 'observer': return <ObserverRoutes />;
    case 'internal_auditor': return <InternalAuditorRoutes />;
    default:
      return (
        <Routes>
          <Route path="*" element={<UnauthorizedPage />} />
        </Routes>
      );
  }
};


function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public transparency routes — no auth required */}
            <Route path="/" element={<Navigate to="/transparency" replace />} />
            <Route path="/transparency" element={<PublicLayout />}>
              <Route index element={<TransparencyPage />} />
              <Route path="calendar" element={<ProcurementCalendar />} />
              <Route path=":reference" element={<TransparencyDetailPage />} />
            </Route>

            {/* Auth pages */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/force-password-change" element={<ForceChangePasswordPage />} />

            {/* All role-gated routes */}
            <Route path="/*" element={<RoleRouter />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      <Toaster />
    </ErrorBoundary>
  );
}

export default App;
