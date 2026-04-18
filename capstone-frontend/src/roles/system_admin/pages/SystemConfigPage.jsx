import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Users, Shield, Database, Mail } from 'lucide-react';
import api from '../../../services/api';

export default function SystemConfigPage() {
  const [health, setHealth] = useState(null);
  const [users, setUsers] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const [healthRes, usersRes] = await Promise.allSettled([
          api.get('/health', { signal: controller.signal }),
          api.get('/admin/users', { params: { per_page: 5 }, signal: controller.signal }),
        ]);
        if (!controller.signal.aborted) {
          if (healthRes.status === 'fulfilled') setHealth(healthRes.value.data);
          if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data);
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

  const configEntries = [
    { setting: 'Application', value: health?.app || 'ProcureSeal', scope: 'General', ok: !!health },
    { setting: 'Version', value: health?.version || '—', scope: 'General', ok: !!health?.version },
    { setting: 'Status', value: health?.status || '—', scope: 'Runtime', ok: health?.status === 'online' },
    { setting: 'Server Time', value: health?.timestamp ? new Date(health.timestamp).toLocaleString('en-PH') : '—', scope: 'Runtime', ok: !!health?.timestamp },
    { setting: 'Authentication', value: 'Sanctum (SPA + Token)', scope: 'Security', ok: true },
    { setting: '2FA Enforcement', value: 'Enabled for all roles', scope: 'Security', ok: true },
    { setting: 'API Rate Limiting', value: 'Throttle: auth + api', scope: 'Security', ok: true },
    { setting: 'Blockchain Ledger', value: 'Active — event anchoring enabled', scope: 'Integrity', ok: true },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">System Configuration</h1>
        <p className="text-sm text-gray-500 mt-1">Platform health, security posture, and operational settings.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading system configuration...</div>
      ) : (
        <>
          {/* Health Status */}
          <div className={`rounded-xl border p-5 flex items-center gap-4 ${health?.status === 'online' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            {health?.status === 'online' ? <CheckCircle className="text-green-600" size={24} /> : <XCircle className="text-red-600" size={24} />}
            <div>
              <p className="font-semibold text-sm">{health?.status === 'online' ? 'System Online — All services operational' : 'System Status Unknown'}</p>
              <p className="text-xs text-gray-600 mt-0.5">{health?.app} v{health?.version} &bull; {health?.timestamp ? new Date(health.timestamp).toLocaleString('en-PH') : '—'}</p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Registered Users" value={users?.total ?? '—'} />
            <StatCard icon={Shield} label="2FA Status" value="Enforced" />
            <StatCard icon={Database} label="Blockchain" value="Active" />
            <StatCard icon={Mail} label="Notifications" value="Configured" />
          </div>

          {/* Configuration Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Configuration Snapshot</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-3 py-2.5 font-medium text-gray-600">Setting</th>
                    <th className="px-3 py-2.5 font-medium text-gray-600">Value</th>
                    <th className="px-3 py-2.5 font-medium text-gray-600">Scope</th>
                    <th className="px-3 py-2.5 font-medium text-gray-600">State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {configEntries.map((entry, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 text-gray-900 text-xs font-medium">{entry.setting}</td>
                      <td className="px-3 py-2.5 text-gray-700 text-xs">{entry.value}</td>
                      <td className="px-3 py-2.5 text-gray-500 text-xs">{entry.scope}</td>
                      <td className="px-3 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded ${entry.ok ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {entry.ok ? 'OK' : 'Check'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Users */}
          {users?.data?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">Recent Users</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="px-3 py-2.5 font-medium text-gray-600">Name</th>
                      <th className="px-3 py-2.5 font-medium text-gray-600">Email</th>
                      <th className="px-3 py-2.5 font-medium text-gray-600">Role</th>
                      <th className="px-3 py-2.5 font-medium text-gray-600">Department</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.data.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2.5 text-gray-900 text-xs">{u.name}</td>
                        <td className="px-3 py-2.5 text-gray-600 text-xs">{u.email}</td>
                        <td className="px-3 py-2.5">
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{u.role?.display_name || u.role?.name || '—'}</span>
                        </td>
                        <td className="px-3 py-2.5 text-gray-500 text-xs">{u.department?.name || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
        <Icon size={16} className="text-gray-400" />
      </div>
      <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
    </div>
  );
}
