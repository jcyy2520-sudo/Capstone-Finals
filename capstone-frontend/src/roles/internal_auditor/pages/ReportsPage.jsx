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

export default function ReportsPage() {
  const [byMode, setByMode] = useState([]);
  const [byStatus, setByStatus] = useState({});
  const [timeline, setTimeline] = useState(null);
  const [risks, setRisks] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [modeRes, statusRes, timeRes, riskRes] = await Promise.all([
          api.get('/reports/by-mode'),
          api.get('/reports/by-status'),
          api.get('/reports/timeline-compliance'),
          api.get('/reports/risk-indicators'),
        ]);
        setByMode(normalizeModeBreakdown(modeRes.data));
        setByStatus(normalizeStatusBreakdown(statusRes.data));
        setTimeline(timeRes.data);
        setRisks(riskRes.data);
      } catch {
        // degrade gracefully
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-400">Loading reports...</div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Audit Reports &amp; Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Procurement compliance data and risk analysis for audit review.</p>
      </div>

      {/* Timeline stats */}
      {timeline && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard icon={Clock} label="Avg PR → Invitation" value={`${timeline.avg_days_pr_to_invitation ?? timeline.avg_pr_to_invitation_days ?? 0} days`} />
          <StatCard icon={TrendingUp} label="Avg Invitation → Award" value={`${timeline.avg_days_invitation_to_award ?? timeline.avg_invitation_to_award_days ?? 0} days`} />
          <StatCard icon={AlertTriangle} label="Overdue Contracts" value={timeline.overdue_contracts} tone={timeline.overdue_contracts > 0 ? 'red' : undefined} />
          <StatCard icon={BarChart3} label="Active Contracts" value={timeline.total_active_contracts} />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Risk Indicators */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Risk Indicators ({risks?.total_flags ?? 0})</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {(!risks || risks.flags.length === 0) ? (
              <div className="p-5 text-sm text-gray-400">No active risk flags</div>
            ) : (
              risks.flags.map((flag, i) => (
                <div key={i} className="px-5 py-3 flex items-start gap-3">
                  <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                    flag.severity === 'critical' ? 'bg-red-500' : flag.severity === 'high' ? 'bg-amber-500' : 'bg-blue-400'
                  }`} />
                  <div>
                    <p className="text-sm text-gray-900">{flag.message}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{flag.severity.toUpperCase()} &bull; {flag.type.replace(/_/g, ' ')}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* By Mode */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Procurement by Mode</h2>
          </div>
          <div className="p-5 space-y-2">
            {byMode.length === 0 ? (
              <p className="text-sm text-gray-400">No data yet</p>
            ) : (
              byMode.map((item) => (
                <div key={item.procurement_mode} className="flex items-center justify-between py-1">
                  <span className="text-sm text-gray-700 capitalize">{item.procurement_mode.replace(/_/g, ' ')}</span>
                  <span className="text-sm font-bold text-gray-900">{item.count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Status Distribution Across Modules</h2>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Object.entries(byStatus).map(([module, statuses]) => (
            <div key={module}>
              <h3 className="text-[11px] uppercase tracking-wide text-gray-500 mb-3 font-semibold">{module}</h3>
              {statuses.map((item) => (
                <div key={item.status} className="flex items-center justify-between py-1">
                  <span className="text-xs text-gray-600 capitalize">{item.status.replace(/_/g, ' ')}</span>
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
  const color = tone === 'red' ? 'text-red-600' : 'text-gray-900';
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