import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { ClipboardCheck, AlertTriangle, Award, TrendingUp } from 'lucide-react';
import api from '../../../services/api';

export default function HopeDashboard() {
  const { user } = useAuth();
  const [perf, setPerf] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const { data } = await api.get('/reports/hope-performance', { signal: controller.signal });
        if (!controller.signal.aborted) setPerf(data);
      } catch (err) {
        if (err?.name === 'CanceledError') return;
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, []);

  const formatCurrency = (v) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(v || 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">HOPE Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome, {user?.name}. Final approval and compliance oversight workspace.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading dashboard...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard icon={ClipboardCheck} label="Pending Approvals" value={perf?.pending_approvals ?? 0} tone={perf?.pending_approvals > 0 ? 'blue' : undefined} />
            <StatCard icon={AlertTriangle} label="Overdue Procurements" value={perf?.overdue_procurements ?? 0} tone={perf?.overdue_procurements > 0 ? 'red' : undefined} />
            <StatCard icon={Award} label="Awards This Month" value={perf?.awards_this_month ?? 0} />
            <StatCard icon={TrendingUp} label="Budget Savings" value={`${perf?.savings_percentage ?? 0}%`} tone="green" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Budget Summary */}
            <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">Budget &amp; Contract Overview</h2>
              </div>
              <div className="p-5 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-gray-500">Total APP Budget</p>
                  <p className="text-base font-semibold text-gray-900 mt-1">{formatCurrency(perf?.total_app_budget)}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-gray-500">Total Contracted</p>
                  <p className="text-base font-semibold text-gray-900 mt-1">{formatCurrency(perf?.total_contracted)}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-gray-500">Active Contracts</p>
                  <p className="text-base font-semibold text-gray-900 mt-1">{perf?.active_contracts ?? 0}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-gray-500">Completed Contracts</p>
                  <p className="text-base font-semibold text-gray-900 mt-1">{perf?.completed_contracts ?? 0}</p>
                </div>
              </div>
            </div>

            {/* Executive Shortcuts */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
              <h2 className="text-base font-semibold text-gray-900">Executive Shortcuts</h2>
              <Link to="/hope/approvals" className="block text-sm rounded-lg border border-gray-200 p-3 hover:bg-gray-50">My Approval Queue</Link>
              <Link to="/hope/alternative-modes" className="block text-sm rounded-lg border border-gray-200 p-3 hover:bg-gray-50">Alternative Mode Approvals</Link>
              <Link to="/hope/resolutions" className="block text-sm rounded-lg border border-gray-200 p-3 hover:bg-gray-50">BAC Resolutions</Link>
              <Link to="/hope/reports" className="block text-sm rounded-lg border border-gray-200 p-3 hover:bg-gray-50">Performance Reports</Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }) {
  const color = tone === 'red' ? 'text-red-600' : tone === 'green' ? 'text-green-600' : tone === 'blue' ? 'text-blue-600' : 'text-gray-900';
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
        <Icon size={16} className="text-gray-400" />
      </div>
      <p className={`text-2xl font-bold mt-2 ${color}`}>{value}</p>
    </div>
  );
}
