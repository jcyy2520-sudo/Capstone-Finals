
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getRoleDashboardPath } from '../../utils/rolePaths';

export default function UnauthorizedPage() {
  const { user } = useAuth();
  const redirectPath = getRoleDashboardPath(user?.role?.name);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h1 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-500 text-sm mb-6">
          You do not have permission to access this page. If you believe this is an error,
          contact the System Administrator.
        </p>
        <Link
          to={redirectPath}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 transition"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
