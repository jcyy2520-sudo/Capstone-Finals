import { useState, useEffect } from 'react';
import { BarChart3, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import api from '../../../services/api';

const normalizeModeBreakdown = (payload) => {
  if (Array.isArray(payload)) {
    return payload
      .map((item) => ({
        procurement_mode: item?.procurement_mode || item?.mode || 'unknown',
        count: Number(item?.count ?? 0),
      }))
      .filter((item) => item.procurement_mode);
  }

  if (payload && typeof payload === 'object') {
    return Object.entries(payload).map(([procurement_mode, count]) => ({
      procurement_mode,
      count: Number(count ?? 0),
    }));
  }

  return [];
};

const normalizeStatusBreakdown = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return {};
  }

  return Object.fromEntries(
    Object.entries(payload).map(([module, statuses]) => {
      if (Array.isArray(statuses)) {
        return [
          module,
          statuses.map((item) => ({
            status: item?.status || 'unknown',
            count: Number(item?.count ?? 0),
          })),
        ];
      }

      return [
        module,
        Object.entries(statuses || {}).map(([status, count]) => ({
          status,
          count: Number(count ?? 0),
        })),
      ];
    })
  );
};

export default function AnalyticsPage() {
  const [byMode, setByMode] = useState([]);
  const [byDept, setByDept] = useState({});
  const [byStatus, setByStatus] = useState({});
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [modeRes, deptRes, statusRes, timeRes] = await Promise.all([
          api.get('/reports/by-mode'),
          api.get('/reports/by-department'),
          api.get('/reports/by-status'),
          api.get('/reports/timeline-compliance'),
        ]);
        setByMode(normalizeModeBreakdown(modeRes.data));
        setByDept(deptRes.data);
        setByStatus(normalizeStatusBreakdown(statusRes.data));
        setTimeline(timeRes.data);
      } catch {
        // degrade gracefully
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-400">Loading analytics...</div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Analytics &amp; Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Read-only analytics across the procurement workflow.</p>
      </div>

      {/* Timeline Compliance */}
      {timeline && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard icon={Clock} label="Avg PR → Invitation" value={`${timeline.avg_days_pr_to_invitation ?? timeline.avg_pr_to_invitation_days ?? 0} days`} />
          <StatCard icon={TrendingUp} label="Avg Invitation → Award" value={`${timeline.avg_days_invitation_to_award ?? timeline.avg_invitation_to_award_days ?? 0} days`} />
          <StatCard icon={AlertTriangle} label="Overdue Contracts" value={timeline.overdue_contracts} tone={timeline.overdue_contracts > 0 ? 'red' : 'green'} />
          <StatCard icon={BarChart3} label="Active Contracts" value={timeline.total_active_contracts} />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* By Mode */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Procurement by Mode</h2>
          </div>
          <div className="p-5 space-y-3">
            {byMode.length === 0 ? (
              <p className="text-sm text-gray-400">No data yet</p>
            ) : (
              byMode.map((item) => (
                <div key={item.procurement_mode} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{item.procurement_mode.replace(/_/g, ' ')}</span>
                  <span className="text-sm font-bold text-gray-900">{item.count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* By Department */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">PRs by Department</h2>
          </div>
          <div className="p-5 space-y-3">
            {Object.keys(byDept).length === 0 ? (
              <p className="text-sm text-gray-400">No data yet</p>
            ) : (
              Object.entries(byDept).map(([dept, count]) => (
                <div key={dept} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{dept}</span>
                  <span className="text-sm font-bold text-gray-900">{count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Status Distribution</h2>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Object.entries(byStatus).map(([module, statuses]) => (
            <div key={module}>
              <h3 className="text-[11px] uppercase tracking-wide text-gray-500 mb-3">{module}</h3>
              {statuses.map((item) => (
                <div key={item.status} className="flex items-center justify-between py-1">
                  <span className="text-xs text-gray-600">{item.status.replace(/_/g, ' ')}</span>
                  <span className="text-xs font-bold text-gray-900">{item.count}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }) {
  const color = tone === 'red' ? 'text-red-600' : tone === 'green' ? 'text-green-600' : 'text-gray-900';
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