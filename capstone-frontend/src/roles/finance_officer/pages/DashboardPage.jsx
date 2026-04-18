import { useAuth } from '../../../contexts/AuthContext';
import { Link } from 'react-router-dom';

const financeStats = [
  { label: 'Invoices Pending Validation', value: '9' },
  { label: 'For Payment Approval', value: '4' },
  { label: 'Paid This Week', value: '12' },
  { label: '3-Way Match Exceptions', value: '2' },
];

export default function FinanceOfficerDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Finance Officer Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome, {user?.name}. Invoice control and payment recording overview.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {financeStats.map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-[11px] uppercase tracking-wide text-gray-500">{item.label}</p>
            <p className="text-lg font-semibold text-gray-900 mt-2">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-900">Processing Focus</h2>
          <div className="mt-4 space-y-3 text-sm text-gray-700">
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="font-medium text-gray-900">Invoice INV-2026-0192</p>
              <p className="text-xs text-gray-500 mt-1">Awaiting PO and IAR match confirmation.</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="font-medium text-gray-900">Payment Batch PB-2026-06</p>
              <p className="text-xs text-gray-500 mt-1">Schedule for disbursement logging and posting.</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="font-medium text-gray-900">Exception Queue</p>
              <p className="text-xs text-gray-500 mt-1">Two records have amount variance above tolerance.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
          <h2 className="text-base font-semibold text-gray-900">Quick Actions</h2>
          <Link to="/finance/invoices" className="block text-sm rounded-lg border border-gray-200 p-3 hover:bg-gray-50">Invoice Processing</Link>
          <Link to="/finance/payments" className="block text-sm rounded-lg border border-gray-200 p-3 hover:bg-gray-50">Payment Records</Link>
          <Link to="/finance/reports" className="block text-sm rounded-lg border border-gray-200 p-3 hover:bg-gray-50">Financial Reports</Link>
        </div>
      </div>
    </div>
  );
}
