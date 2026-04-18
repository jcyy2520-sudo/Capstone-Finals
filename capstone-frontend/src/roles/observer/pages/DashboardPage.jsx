import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Shield, Database, FileText, BarChart3 } from 'lucide-react';
import api from '../../../services/api';

export default function ObserverDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [chainStatus, setChainStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const [summaryRes, chainRes] = await Promise.allSettled([
          api.get('/reports/summary', { signal: controller.signal }),
          api.get('/blockchain/verify-chain', { signal: controller.signal }),
        ]);
        if (!controller.signal.aborted) {
          if (summaryRes.status === 'fulfilled') setStats(summaryRes.value.data);
          if (chainRes.status === 'fulfilled') setChainStatus(chainRes.value.data);
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

  const statCards = stats ? [
    { label: 'Active Procurements', value: stats.active_invitations + stats.active_contracts, icon: FileText },
    { label: 'Audit Trail Events (24h)', value: stats.audit_logs_24h, icon: Shield },
    { label: 'Blockchain Blocks', value: stats.blockchain_events, icon: Database },
    { label: 'Total Awards', value: stats.total_awards, icon: BarChart3 },
  ] : [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">COA / GPPB Observer Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome, {user?.name}. Read-only oversight of procurement transparency and integrity.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading dashboard...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {statCards.map((item) => (
              <div key={item.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-wide text-gray-500">{item.label}</p>
                  <item.icon size={16} className="text-gray-400" />
                </div>
                <p className="text-lg font-semibold text-gray-900 mt-2">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">Blockchain Chain Integrity</h2>
              </div>
              <div className="p-5">
                {chainStatus ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className={`w-3 h-3 rounded-full ${chainStatus.valid ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-sm font-medium">{chainStatus.valid ? 'Chain integrity verified' : 'Chain integrity FAILED'}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {chainStatus.blocks_checked ?? 0} blocks checked &bull; {chainStatus.errors ?? 0} error(s)
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Unable to verify chain</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
              <h2 className="text-base font-semibold text-gray-900">Audit Access Shortcuts</h2>
              <Link to="/observer/records" className="block text-sm rounded-lg border border-gray-200 p-3 hover:bg-gray-50">Procurement Register</Link>
              <Link to="/observer/blockchain" className="block text-sm rounded-lg border border-gray-200 p-3 hover:bg-gray-50">Blockchain Audit Trail</Link>
              <Link to="/observer/analytics" className="block text-sm rounded-lg border border-gray-200 p-3 hover:bg-gray-50">Analytics &amp; Reports</Link>
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700">
                Observer accounts are strictly read-only for records and event verification.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
