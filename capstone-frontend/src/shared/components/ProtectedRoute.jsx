import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * ProtectedRoute — wraps routes that require authentication.
 * Optionally checks for specific roles: <ProtectedRoute roles={['system_admin','hope']}>
 */
export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role access
  if (roles && roles.length > 0 && user?.role) {
    if (!roles.includes(user.role.name)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
}
