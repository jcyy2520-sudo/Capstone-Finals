import { useState, useEffect } from 'react';
import { FileText, Send, Clock, AlertCircle } from 'lucide-react';
import api from '../../../services/api';

const normalizeModeBreakdown = (payload) => {
  if (Array.isArray(payload)) {
    return payload.map((item) => ({
      procurement_mode: item?.procurement_mode || item?.mode || 'unknown',
      count: Number(item?.count ?? 0),
      total_value: item?.total_value,
    }));
  }

  if (payload && typeof payload === 'object') {
    return Object.entries(payload).map(([procurement_mode, count]) => ({
      procurement_mode,
      count: Number(count ?? 0),
    }));
  }

  return [];
};

const normalizeDepartmentBreakdown = (payload) => {
  if (Array.isArray(payload)) {
    return payload.map((item) => ({
      department: item?.department || item?.name || '—',
      count: Number(item?.count ?? 0),
      total_value: item?.total_value,
    }));
  }

  if (payload && typeof payload === 'object') {
    return Object.entries(payload).map(([department, count]) => ({
      department,
      count: Number(count ?? 0),
    }));
  }

  return [];
};

export default function ReportsPage() {
  const [summary, setSummary] = useState(null);
  const [byMode, setByMode] = useState([]);
  const [byDept, setByDept] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const [sumRes, modeRes, deptRes] = await Promise.allSettled([
          api.get('/workspace/summary', { signal: controller.signal }),
          api.get('/reports/by-mode', { signal: controller.signal }),
          api.get('/reports/by-department', { signal: controller.signal }),
        ]);
        if (!controller.signal.aborted) {
          if (sumRes.status === 'fulfilled') setSummary(sumRes.value.data);
          if (modeRes.status === 'fulfilled') setByMode(normalizeModeBreakdown(modeRes.value.data?.data || modeRes.value.data || []));
          if (deptRes.status === 'fulfilled') setByDept(normalizeDepartmentBreakdown(deptRes.value.data?.data || deptRes.value.data || []));
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

  const cards = summary?.cards || [];
  const topStats = [
    { icon: FileText, label: 'APP Entries', value: cards.find((card) => card.key === 'app_queue')?.value ?? '—' },
    { icon: Send, label: 'Invitations', value: cards.find((card) => card.key?.includes('invitation'))?.value ?? '—' },
    { icon: Clock, label: 'Pending Items', value: cards.find((card) => card.key?.includes('pending'))?.value ?? '—', tone: 'amber' },
    { icon: AlertCircle, label: 'Active PRs', value: cards.find((card) => card.key?.includes('pr'))?.value ?? '—' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Secretariat Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Operational reporting — APP entries, invitations, procurement mode distribution, and department activity.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading reports...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {topStats.map((s, i) => (
              <StatCard key={i} icon={s.icon} label={s.label} value={s.value} tone={s.tone} />
            ))}
          </div>

          {/* By Procurement Mode */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Procurement by Mode</h2>
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
              <div className="p-6 text-center text-gray-400 text-sm">No mode data available.</div>
            )}
          </div>

          {/* By Department */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Procurement by Department</h2>
            </div>
            {Array.isArray(byDept) && byDept.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="px-3 py-2.5 font-medium text-gray-600">Department</th>
                      <th className="px-3 py-2.5 font-medium text-gray-600">Count</th>
                      <th className="px-3 py-2.5 font-medium text-gray-600">Total Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {byDept.map((item, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-3 py-2.5 text-gray-900 text-xs">{item.department || '—'}</td>
                        <td className="px-3 py-2.5 text-gray-700 text-xs font-semibold">{item.count ?? 0}</td>
                        <td className="px-3 py-2.5 text-gray-600 text-xs">{item.total_value ? `PHP ${Number(item.total_value).toLocaleString('en-PH')}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-400 text-sm">No department data available.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }) {
  const color = tone === 'amber' ? 'text-amber-600' : tone === 'red' ? 'text-red-600' : 'text-gray-900';
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