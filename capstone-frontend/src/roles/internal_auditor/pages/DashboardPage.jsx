import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { AlertTriangle, Shield, Database, FileText } from 'lucide-react';
import api from '../../../services/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [risks, setRisks] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const [summaryRes, riskRes] = await Promise.allSettled([
          api.get('/reports/summary', { signal: controller.signal }),
          api.get('/reports/risk-indicators', { signal: controller.signal }),
        ]);
        if (!controller.signal.aborted) {
          if (summaryRes.status === 'fulfilled') setStats(summaryRes.value.data);
          if (riskRes.status === 'fulfilled') setRisks(riskRes.value.data);
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
        <h1 className="text-lg font-semibold text-gray-900">Internal Auditor Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome, {user?.name}. Audit oversight and risk monitoring workspace.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading dashboard...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard icon={Shield} label="Blockchain Events" value={stats?.blockchain_events ?? 0} />
            <StatCard icon={FileText} label="Audit Logs (24h)" value={stats?.audit_logs_24h ?? 0} />
            <StatCard icon={AlertTriangle} label="Risk Flags" value={risks?.total_flags ?? 0} tone={risks?.critical_count > 0 ? 'red' : undefined} />
            <StatCard icon={Database} label="Active Contracts" value={stats?.active_contracts ?? 0} />
          </div>

          {/* Risk Flags */}
          {risks && risks.flags.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">Active Risk Indicators</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {risks.flags.map((flag, i) => (
                  <div key={i} className="px-5 py-4 flex items-start gap-3">
                    <span className={`mt-0.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      flag.severity === 'critical' ? 'bg-red-500' : flag.severity === 'high' ? 'bg-amber-500' : 'bg-blue-400'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{flag.message}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{flag.type.replace(/_/g, ' ')} {flag.reference ? `• ${flag.reference}` : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Link to="/auditor/audit" className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:bg-gray-50 transition">
              <h3 className="font-semibold text-sm text-gray-900 mb-1">Audit Trail</h3>
              <p className="text-xs text-gray-500">Browse system audit logs with filters</p>
            </Link>
            <Link to="/auditor/blockchain" className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:bg-gray-50 transition">
              <h3 className="font-semibold text-sm text-gray-900 mb-1">Blockchain Verification</h3>
              <p className="text-xs text-gray-500">Verify chain integrity and event hashes</p>
            </Link>
            <Link to="/auditor/reports" className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:bg-gray-50 transition">
              <h3 className="font-semibold text-sm text-gray-900 mb-1">Reports &amp; Analytics</h3>
              <p className="text-xs text-gray-500">Procurement analytics and compliance data</p>
            </Link>
          </div>
        </>
      )}
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
