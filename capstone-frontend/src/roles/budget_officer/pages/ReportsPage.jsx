import { useState, useEffect } from 'react';
import { Wallet, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import api from '../../../services/api';

export default function ReportsPage() {
  const [appEntries, setAppEntries] = useState([]);
  const [prs, setPrs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const [appRes, prRes] = await Promise.allSettled([
          api.get('/app-entries', { signal: controller.signal }),
          api.get('/purchase-requisitions', { signal: controller.signal }),
        ]);
        if (!controller.signal.aborted) {
          if (appRes.status === 'fulfilled') setAppEntries(appRes.value.data?.data || appRes.value.data || []);
          if (prRes.status === 'fulfilled') setPrs(prRes.value.data?.data || prRes.value.data || []);
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

  const allApps = Array.isArray(appEntries) ? appEntries : [];
  const allPrs = Array.isArray(prs) ? prs : [];
  const certifiedApps = allApps.filter(a => a.status === 'budget_certified' || a.status === 'approved');
  const pendingApps = allApps.filter(a => a.status === 'submitted' || a.status === 'accepted');
  const pendingPrs = allPrs.filter(p => p.status === 'submitted' || p.status === 'endorsed');
  const certifiedPrs = allPrs.filter(p => p.status === 'budget_certified' || p.status === 'accepted');

  const totalValue = allApps.reduce((sum, a) => sum + Number(a.estimated_budget || 0), 0);
  const certifiedValue = certifiedApps.reduce((sum, a) => sum + Number(a.estimated_budget || 0), 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Budget Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Budget certification coverage, fund utilization, and pending requisitions.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading budget reports...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard icon={Wallet} label="Total APP Budget" value={totalValue > 0 ? `PHP ${totalValue.toLocaleString('en-PH')}` : '—'} />
            <StatCard icon={CheckCircle} label="Certified Items" value={certifiedApps.length + certifiedPrs.length} />
            <StatCard icon={Clock} label="Pending Certification" value={pendingApps.length + pendingPrs.length} tone={pendingApps.length + pendingPrs.length > 0 ? 'amber' : undefined} />
            <StatCard icon={AlertTriangle} label="Utilization" value={totalValue > 0 ? `${Math.round((certifiedValue / totalValue) * 100)}%` : '—'} />
          </div>

          {/* APP Entries Summary */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">APP Entries ({allApps.length})</h2>
            </div>
            {allApps.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">No APP entries found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="px-3 py-2.5 font-medium text-gray-600">Title</th>
                      <th className="px-3 py-2.5 font-medium text-gray-600">Department</th>
                      <th className="px-3 py-2.5 font-medium text-gray-600">Budget</th>
                      <th className="px-3 py-2.5 font-medium text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allApps.slice(0, 10).map((app) => (
                      <tr key={app.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2.5 text-gray-900 text-xs">{app.title || app.procurement_title || `APP #${app.id}`}</td>
                        <td className="px-3 py-2.5 text-gray-600 text-xs">{app.department?.name || '—'}</td>
                        <td className="px-3 py-2.5 text-gray-700 text-xs">{app.estimated_budget ? `PHP ${Number(app.estimated_budget).toLocaleString('en-PH')}` : '—'}</td>
                        <td className="px-3 py-2.5">
                          <span className={`text-xs px-2 py-0.5 rounded capitalize ${
                            app.status === 'approved' || app.status === 'budget_certified' ? 'bg-green-100 text-green-700' :
                            app.status === 'returned' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          }`}>{(app.status || '').replace(/_/g, ' ')}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Purchase Requisitions Summary */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Purchase Requisitions ({allPrs.length})</h2>
            </div>
            {allPrs.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">No purchase requisitions found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="px-3 py-2.5 font-medium text-gray-600">PR Number</th>
                      <th className="px-3 py-2.5 font-medium text-gray-600">Purpose</th>
                      <th className="px-3 py-2.5 font-medium text-gray-600">Amount</th>
                      <th className="px-3 py-2.5 font-medium text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allPrs.slice(0, 10).map((pr) => (
                      <tr key={pr.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2.5 text-gray-900 text-xs">{pr.pr_number || `PR #${pr.id}`}</td>
                        <td className="px-3 py-2.5 text-gray-600 text-xs max-w-[200px] truncate">{pr.purpose || '—'}</td>
                        <td className="px-3 py-2.5 text-gray-700 text-xs">{pr.estimated_amount ? `PHP ${Number(pr.estimated_amount).toLocaleString('en-PH')}` : '—'}</td>
                        <td className="px-3 py-2.5">
                          <span className={`text-xs px-2 py-0.5 rounded capitalize ${
                            pr.status === 'budget_certified' || pr.status === 'accepted' ? 'bg-green-100 text-green-700' :
                            pr.status === 'returned' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          }`}>{(pr.status || '').replace(/_/g, ' ')}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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