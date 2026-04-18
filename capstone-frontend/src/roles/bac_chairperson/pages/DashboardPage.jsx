import { useAuth } from '../../../contexts/AuthContext';
import { Link } from 'react-router-dom';

const chairStats = [
  { label: 'Upcoming Bid Openings', value: '5' },
  { label: 'Pending BAC Signatures', value: '7' },
  { label: 'Failure of Bidding Cases', value: '1' },
  { label: 'Post-Qual Pending', value: '4' },
];

export default function BacChairpersonDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">BAC Chairperson Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome, {user?.name}. Chair-level command view for bidding operations.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {chairStats.map((item) => (
          <div key={item.label} className="bg-white border border-gray-200 rounded-lg p-3.5 shadow-sm">
            <p className="text-[11px] uppercase tracking-wide text-gray-500">{item.label}</p>
            <p className="text-lg font-semibold text-gray-900 mt-2">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-900">Action Pipeline</h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link to="/chairperson/bid-openings" className="rounded-lg border border-gray-200 p-3 text-sm hover:bg-gray-50">Bid Openings</Link>
            <Link to="/chairperson/evaluations" className="rounded-lg border border-gray-200 p-3 text-sm hover:bg-gray-50">Bid Evaluation</Link>
            <Link to="/chairperson/post-qualification" className="rounded-lg border border-gray-200 p-3 text-sm hover:bg-gray-50">Post-Qualification</Link>
            <Link to="/chairperson/resolutions" className="rounded-lg border border-gray-200 p-3 text-sm hover:bg-gray-50">BAC Resolutions</Link>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-900">Chairperson Notes</h2>
          <ul className="mt-4 space-y-3 text-sm text-gray-700">
            <li className="border-l-4 border-blue-500 pl-3">Confirm quorum for all sessions scheduled in the next 48 hours.</li>
            <li className="border-l-4 border-amber-500 pl-3">Review failure-of-bidding grounds before routing any re-bidding request.</li>
            <li className="border-l-4 border-emerald-500 pl-3">Ensure LCRB resolutions include complete legal basis and co-signatures.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
