import { useAuth } from '../../../contexts/AuthContext';
import { Link } from 'react-router-dom';

const budgetStats = [
  { label: 'PRs Pending Certification', value: '11' },
  { label: 'APP Lines for Budget Tagging', value: '8' },
  { label: 'Certified Today', value: '5' },
  { label: 'Fund Sources Monitored', value: '6' },
];

export default function BudgetOfficerDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Budget Officer Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome, {user?.name}. Certification and utilization monitoring center.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {budgetStats.map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-[11px] uppercase tracking-wide text-gray-500">{item.label}</p>
            <p className="text-lg font-semibold text-gray-900 mt-2">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-900">Certification Queue</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="font-medium text-gray-900">PR-2026-MHO-0018</p>
              <p className="text-xs text-gray-500 mt-1">Fund source validation required before endorsement.</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="font-medium text-gray-900">PR-2026-MEO-0012</p>
              <p className="text-xs text-gray-500 mt-1">Account code mismatch flagged by budget rules.</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="font-medium text-gray-900">APP Line - Office Equipment Q2</p>
              <p className="text-xs text-gray-500 mt-1">Waiting for final fund allocation confirmation.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
          <h2 className="text-base font-semibold text-gray-900">Quick Actions</h2>
          <Link to="/budget/certification" className="block text-sm rounded-lg border border-gray-200 p-3 hover:bg-gray-50">PRs for Certification</Link>
          <Link to="/budget/reports" className="block text-sm rounded-lg border border-gray-200 p-3 hover:bg-gray-50">Budget Utilization Report</Link>
          <div className="rounded-lg bg-amber-50 border border-amber-100 p-3 text-xs text-amber-800">
            Deadline reminders should be cleared before end-of-day certification cut-off.
          </div>
        </div>
      </div>
    </div>
  );
}
