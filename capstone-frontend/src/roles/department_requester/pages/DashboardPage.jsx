import { useAuth } from '../../../contexts/AuthContext';
import { Link } from 'react-router-dom';

const requesterStats = [
  { label: 'My Active PRs', value: '7' },
  { label: 'For Department Head Endorsement', value: '3' },
  { label: 'Active Deliveries', value: '2' },
  { label: 'Returned for Revision', value: '1' },
];

export default function DepartmentRequesterDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Department Requester Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome, {user?.name}. Track your planning submissions, requisitions, and delivery notices.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {requesterStats.map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-[11px] uppercase tracking-wide text-gray-500">{item.label}</p>
            <p className="text-lg font-semibold text-gray-900 mt-2">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-900">My Current Work</h2>
          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-sm font-medium text-gray-900">PR-2026-MHO-0021</p>
              <p className="text-xs text-gray-500 mt-1">Waiting for budget certification. No action required from requester.</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-sm font-medium text-gray-900">PR-2026-MHO-0017</p>
              <p className="text-xs text-gray-500 mt-1">Approved and in invitation stage. Track procurement progress.</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-sm font-medium text-gray-900">Contract CTR-2026-0009</p>
              <p className="text-xs text-gray-500 mt-1">Delivery received by the office. IAC inspection is now pending.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
          <h2 className="text-base font-semibold text-gray-900">Quick Actions</h2>
          <Link to="/requester/purchase-requisitions" className="block text-sm rounded-lg border border-gray-200 p-3 hover:bg-gray-50">Create Purchase Requisition</Link>
          <Link to="/requester/purchase-requisitions" className="block text-sm rounded-lg border border-gray-200 p-3 hover:bg-gray-50">My PRs</Link>
          <Link to="/requester/app" className="block text-sm rounded-lg border border-gray-200 p-3 hover:bg-gray-50">Annual Procurement Plan Entries</Link>
        </div>
      </div>
    </div>
  );
}
