import { useState, useEffect } from 'react';
import { BarChart3, FileText, Clock, AlertTriangle } from 'lucide-react';
import api from '../../../services/api';

export default function ReportsPage() {
  const [summary, setSummary] = useState(null);
  const [byMode, setByMode] = useState([]);
  const [byStatus, setByStatus] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const [sumRes, modeRes, statusRes] = await Promise.allSettled([
          api.get('/reports/summary', { signal: controller.signal }),
          api.get('/reports/by-mode', { signal: controller.signal }),
          api.get('/reports/by-status', { signal: controller.signal }),
        ]);
        if (!controller.signal.aborted) {
          if (sumRes.status === 'fulfilled') setSummary(sumRes.value.data);
          if (modeRes.status === 'fulfilled') setByMode(modeRes.value.data?.data || modeRes.value.data || []);
          if (statusRes.status === 'fulfilled') setByStatus(statusRes.value.data?.data || statusRes.value.data || []);
        }
      } catch (err) {
        if (err?.name === 'CanceledError') return;
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">BAC Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Procurement analytics, mode distribution, and pipeline status for chairperson oversight.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading reports...</div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard icon={FileText} label="Total Procurements" value={summary?.total_procurements ?? 0} />
            <StatCard icon={BarChart3} label="Active Items" value={summary?.active_items ?? 0} />
            <StatCard icon={Clock} label="Pending Actions" value={summary?.pending_actions ?? 0} tone={summary?.pending_actions > 0 ? 'amber' : undefined} />
            <StatCard icon={AlertTriangle} label="Overdue Items" value={summary?.overdue_items ?? 0} tone={summary?.overdue_items > 0 ? 'red' : undefined} />
          </div>

          {/* By Procurement Mode */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">By Procurement Mode</h2>
            </div>
            {Array.isArray(byMode) && byMode.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="px-3 py-2.5 font-medium text-gray-600">Mode</th>
                      <th className="px-3 py-2.5 font-medium text-gray-600">Count</th>
                      <th className="px-3 py-2.5 font-medium text-gray-600">Total Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {byMode.map((item, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-3 py-2.5 text-gray-900 text-xs capitalize">{(item.mode || item.procurement_mode || '—').replace(/_/g, ' ')}</td>
                        <td className="px-3 py-2.5 text-gray-700 text-xs font-semibold">{item.count ?? 0}</td>
                        <td className="px-3 py-2.5 text-gray-600 text-xs">{item.total_value ? `PHP ${Number(item.total_value).toLocaleString('en-PH')}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-400 text-sm">No procurement mode data available.</div>
            )}
          </div>

          {/* By Status */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">By Pipeline Status</h2>
            </div>
            {Array.isArray(byStatus) && byStatus.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="px-3 py-2.5 font-medium text-gray-600">Status</th>
                      <th className="px-3 py-2.5 font-medium text-gray-600">Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {byStatus.map((item, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-3 py-2.5 text-gray-900 text-xs capitalize">{(item.status || '—').replace(/_/g, ' ')}</td>
                        <td className="px-3 py-2.5 text-gray-700 text-xs font-semibold">{item.count ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-400 text-sm">No status data available.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }) {
  const color = tone === 'red' ? 'text-red-600' : tone === 'amber' ? 'text-amber-600' : 'text-gray-900';
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