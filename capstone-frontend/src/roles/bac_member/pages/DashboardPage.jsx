import { useAuth } from '../../../contexts/AuthContext';
import { Link } from 'react-router-dom';

const memberStats = [
  { label: 'Sessions Awaiting Attendance', value: '2' },
  { label: 'Evaluation Tasks', value: '6' },
  { label: 'Post-Qual Reviews', value: '3' },
  { label: 'Pending Co-signatures', value: '4' },
];

export default function BacMemberDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">BAC Member Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome, {user?.name}. Work queue for voting, evaluation, and co-signatures.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {memberStats.map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-[11px] uppercase tracking-wide text-gray-500">{item.label}</p>
            <p className="text-lg font-semibold text-gray-900 mt-2">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-900">My Priority Actions</h2>
          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-sm font-medium text-gray-900">ITB-2026-0041 Opening Session</p>
              <p className="text-xs text-gray-500 mt-1">Confirm quorum attendance before 10:00 AM tomorrow.</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-sm font-medium text-gray-900">Evaluation Form Completion</p>
              <p className="text-xs text-gray-500 mt-1">Submit technical and financial evaluations for 3 eligible bidders.</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-sm font-medium text-gray-900">BAC Resolution Co-signing</p>
              <p className="text-xs text-gray-500 mt-1">2 resolutions are waiting for your digital confirmation.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
          <h2 className="text-base font-semibold text-gray-900">Quick Navigation</h2>
          <Link to="/bac-member/bid-openings" className="block text-sm rounded-lg border border-gray-200 p-3 hover:bg-gray-50">Bid Openings</Link>
          <Link to="/bac-member/evaluations" className="block text-sm rounded-lg border border-gray-200 p-3 hover:bg-gray-50">Evaluation Tasks</Link>
          <Link to="/bac-member/post-qualification" className="block text-sm rounded-lg border border-gray-200 p-3 hover:bg-gray-50">Post-Qualification Tasks</Link>
          <Link to="/bac-member/resolutions" className="block text-sm rounded-lg border border-gray-200 p-3 hover:bg-gray-50">BAC Resolutions</Link>
        </div>
      </div>
    </div>
  );
}
