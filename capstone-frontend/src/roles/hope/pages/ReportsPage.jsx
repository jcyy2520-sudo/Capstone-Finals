import { useState, useEffect } from 'react';
import api from '../../../services/api';

export default function HopeReportsPage() {
  const [perf, setPerf] = useState(null);
  const [byMode, setByMode] = useState([]);
  const [byStatus, setByStatus] = useState({});
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [p, m, s, t] = await Promise.all([
          api.get('/reports/hope-performance'),
          api.get('/reports/by-mode'),
          api.get('/reports/by-status'),
          api.get('/reports/timeline-compliance'),
        ]);
        setPerf(p.data);
        setByMode(m.data);
        setByStatus(s.data);
        setTimeline(t.data);
      } catch {
        // degrade
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const fmt = (v) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(v || 0);

  if (loading) return <div className="text-center py-12 text-gray-400">Loading reports...</div>;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">HOPE</p>
        <h1 className="text-lg font-semibold text-gray-900 mt-1">Performance Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Executive reporting for approvals, savings, and procurement performance.</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card label="Pending Approvals" value={perf?.pending_approvals ?? 0} />
        <Card label="Overdue Procurements" value={perf?.overdue_procurements ?? 0} tone="red" />
        <Card label="Awards This Month" value={perf?.awards_this_month ?? 0} />
        <Card label="Savings Rate" value={`${perf?.savings_percentage ?? 0}%`} tone="green" />
      </div>

      {/* Budget analysis */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Budget &amp; Savings Analysis</h2>
        </div>
        <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div><p className="text-[11px] uppercase tracking-wide text-gray-500">Total APP Budget</p><p className="text-base font-semibold text-gray-900 mt-1">{fmt(perf?.total_app_budget)}</p></div>
          <div><p className="text-[11px] uppercase tracking-wide text-gray-500">Total Contracted</p><p className="text-base font-semibold text-gray-900 mt-1">{fmt(perf?.total_contracted)}</p></div>
          <div><p className="text-[11px] uppercase tracking-wide text-gray-500">Active Contracts</p><p className="text-base font-semibold text-gray-900 mt-1">{perf?.active_contracts ?? 0}</p></div>
          <div><p className="text-[11px] uppercase tracking-wide text-gray-500">Completed Contracts</p><p className="text-base font-semibold text-gray-900 mt-1">{perf?.completed_contracts ?? 0}</p></div>
        </div>
      </div>

      {/* Timeline compliance */}
      {timeline && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Timeline Compliance</h2>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><p className="text-[11px] uppercase tracking-wide text-gray-500">Avg PR → Invitation</p><p className="text-base font-semibold text-gray-900 mt-1">{timeline.avg_days_pr_to_invitation ?? '—'} days</p></div>
            <div><p className="text-[11px] uppercase tracking-wide text-gray-500">Avg Invitation → Award</p><p className="text-base font-semibold text-gray-900 mt-1">{timeline.avg_days_invitation_to_award ?? '—'} days</p></div>
            <div><p className="text-[11px] uppercase tracking-wide text-gray-500">Overdue Contracts</p><p className={`text-base font-semibold mt-1 ${timeline.overdue_contracts > 0 ? 'text-red-600' : 'text-gray-900'}`}>{timeline.overdue_contracts ?? 0}</p></div>
          </div>
        </div>
      )}

      {/* Procurement by mode */}
      {byMode.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Procurement by Mode</h2>
          </div>
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {byMode.map((m) => (
              <div key={m.procurement_mode} className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                <p className="text-xs text-gray-500 capitalize">{m.procurement_mode?.replace(/_/g, ' ') || 'Unknown'}</p>
                <p className="text-base font-semibold text-gray-900 mt-1">{m.count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status distribution */}
      {Object.keys(byStatus).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Status Distribution</h2>
          </div>
          <div className="p-5 space-y-4">
            {Object.entries(byStatus).map(([entity, statuses]) => (
              <div key={entity}>
                <p className="text-sm font-medium text-gray-700 capitalize mb-2">{entity.replace(/_/g, ' ')}</p>
                <div className="flex flex-wrap gap-2">
                  {statuses.map((s) => (
                    <span key={s.status} className="inline-flex items-center text-xs bg-gray-100 border border-gray-200 rounded-full px-3 py-1">
                      <span className="capitalize">{s.status?.replace(/_/g, ' ')}</span>
                      <span className="ml-1.5 font-semibold">{s.count}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ label, value, tone }) {
  const color = tone === 'red' ? 'text-red-600' : tone === 'green' ? 'text-green-600' : 'text-gray-900';
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-2 ${color}`}>{value}</p>
    </div>
  );
}