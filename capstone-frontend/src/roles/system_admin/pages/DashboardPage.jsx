import { useAuth } from '../../../contexts/AuthContext';
import { Link } from 'react-router-dom';

const adminStats = [
  { label: 'Active User Sessions', value: '124', hint: '+12 in last 24h' },
  { label: '2FA Compliance', value: '96%', hint: 'Privileged users enrolled' },
  { label: 'Security Alerts', value: '3', hint: 'Requires immediate review' },
  { label: 'Ledger Node Health', value: 'Operational', hint: 'All peers connected' },
];

const adminActions = [
  { label: 'User Management', description: 'Create, update, and deactivate accounts.', path: '/admin/users' },
  { label: 'System Settings', description: 'Enforce security and session policies.', path: '/admin/config' },
  { label: 'Audit Logs', description: 'Review privileged actions and login anomalies.', path: '/admin/audit' },
  { label: 'Blockchain Monitor', description: 'Validate ledger events and node status.', path: '/admin/blockchain' },
];

export default function SystemAdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">System Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome, {user?.name}. Centralized control for configuration, governance, and security.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {adminStats.map((item) => (
          <div key={item.label} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-[11px] uppercase tracking-wide text-gray-500">{item.label}</p>
            <p className="text-lg font-semibold text-gray-900 mt-2">{item.value}</p>
            <p className="text-xs text-gray-500 mt-2">{item.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-900">Control Center</h2>
          <div className="mt-4 space-y-3">
            {adminActions.map((action) => (
              <Link
                key={action.path}
                to={action.path}
                className="block rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition"
              >
                <p className="text-sm font-semibold text-gray-900">{action.label}</p>
                <p className="text-xs text-gray-500 mt-1">{action.description}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-900">Priority Checks</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
              <div>
                <p className="font-medium text-gray-900">Account Lockout Review</p>
                <p className="text-xs text-gray-500">Investigate repeated failed logins from flagged IPs.</p>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-700">High</span>
            </div>
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
              <div>
                <p className="font-medium text-gray-900">Master Data Update</p>
                <p className="text-xs text-gray-500">Publish FY configuration and template revision set.</p>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-700">Medium</span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-gray-900">Ledger Consistency Audit</p>
                <p className="text-xs text-gray-500">Verify block continuity for last 24-hour event window.</p>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700">On track</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
