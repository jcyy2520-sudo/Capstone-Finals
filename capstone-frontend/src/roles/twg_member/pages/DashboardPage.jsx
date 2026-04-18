import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { ClipboardCheck, FileSearch, ListChecks, AlertCircle } from 'lucide-react';
import api from '../../../services/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [pendingEvals, setPendingEvals] = useState([]);
  const [pendingPostQuals, setPendingPostQuals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const [evalRes, pqRes] = await Promise.allSettled([
          api.get('/evaluations', { signal: controller.signal }),
          api.get('/post-qualifications', { signal: controller.signal }),
        ]);
        if (!controller.signal.aborted) {
          if (evalRes.status === 'fulfilled') {
            const evals = evalRes.value.data?.data || evalRes.value.data || [];
            setPendingEvals(Array.isArray(evals) ? evals.filter(e => e.status === 'pending' || e.status === 'in_progress') : []);
          }
          if (pqRes.status === 'fulfilled') {
            const pqs = pqRes.value.data?.data || pqRes.value.data || [];
            setPendingPostQuals(Array.isArray(pqs) ? pqs.filter(p => p.status === 'pending' || p.status === 'initiated') : []);
          }
          setStats({
            evalTotal: (evalRes.value?.data?.data || evalRes.value?.data || []).length || 0,
            pqTotal: (pqRes.value?.data?.data || pqRes.value?.data || []).length || 0,
          });
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
        <h1 className="text-lg font-semibold text-gray-900">TWG Member Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome, {user?.name}. Technical evaluation and post-qualification workspace.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading dashboard...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard icon={ClipboardCheck} label="Pending Evaluations" value={pendingEvals.length} tone={pendingEvals.length > 0 ? 'amber' : undefined} />
            <StatCard icon={FileSearch} label="Post-Qual Reviews" value={pendingPostQuals.length} tone={pendingPostQuals.length > 0 ? 'amber' : undefined} />
            <StatCard icon={ListChecks} label="Total Evaluations" value={stats?.evalTotal ?? 0} />
            <StatCard icon={AlertCircle} label="Total Post-Quals" value={stats?.pqTotal ?? 0} />
          </div>

          {/* Pending Evaluation Tasks */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Pending Evaluation Tasks</h2>
            </div>
            {pendingEvals.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">No pending evaluations at this time.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {pendingEvals.slice(0, 5).map((ev) => (
                  <div key={ev.id} className="px-5 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Bid Opening #{ev.bid_opening_id || ev.id}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Status: <span className="capitalize">{(ev.status || '').replace(/_/g, ' ')}</span>
                        {ev.pr_title && ` • ${ev.pr_title}`}
                      </p>
                    </div>
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Needs Review</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Post-Qualification Tasks */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Post-Qualification Tasks</h2>
            </div>
            {pendingPostQuals.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">No pending post-qualification reviews.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {pendingPostQuals.slice(0, 5).map((pq) => (
                  <div key={pq.id} className="px-5 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{pq.vendor_name || `Post-Qual #${pq.id}`}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Status: <span className="capitalize">{(pq.status || '').replace(/_/g, ' ')}</span>
                      </p>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Evaluate</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Link to="/twg/evaluations" className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:bg-gray-50 transition">
              <h3 className="font-semibold text-sm text-gray-900 mb-1">Bid Evaluations</h3>
              <p className="text-xs text-gray-500">Submit technical and financial evaluation scores</p>
            </Link>
            <Link to="/twg/post-qualification" className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:bg-gray-50 transition">
              <h3 className="font-semibold text-sm text-gray-900 mb-1">Post-Qualification</h3>
              <p className="text-xs text-gray-500">Verify winning bidder credentials and compliance</p>
            </Link>
            <Link to="/twg/bid-openings" className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:bg-gray-50 transition">
              <h3 className="font-semibold text-sm text-gray-900 mb-1">Bid Openings</h3>
              <p className="text-xs text-gray-500">View scheduled and completed bid opening sessions</p>
            </Link>
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
