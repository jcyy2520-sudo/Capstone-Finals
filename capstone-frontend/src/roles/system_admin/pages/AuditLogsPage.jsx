import { useState, useEffect } from 'react';
import api from '../../../services/api';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = { page, per_page: 20 };
        if (actionFilter) params.action = actionFilter;
        if (entityFilter) params.entity_type = entityFilter;
        if (search) params.search = search;
        const { data } = await api.get('/audit-logs', { params });
        setLogs(data.data || []);
        setLastPage(data.last_page || 1);
      } catch {
        setLogs([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page, actionFilter, entityFilter, search]);

  const totalLogs = logs.length;
  const failedLogs = logs.filter(l => !l.success).length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Audit Logs</h1>
        <p className="text-sm text-gray-500 mt-1">System-wide audit trail — authentication, record changes, and security events.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-[11px] uppercase tracking-wide text-gray-500">Entries on page</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{totalLogs}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-[11px] uppercase tracking-wide text-gray-500">Failed Actions</p>
          <p className={`text-2xl font-bold mt-2 ${failedLogs > 0 ? 'text-red-600' : 'text-gray-900'}`}>{failedLogs}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-[11px] uppercase tracking-wide text-gray-500">Current Page</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{page} / {lastPage}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input type="text" placeholder="Search description..." value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 w-56" />
        <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2">
          <option value="">All Actions</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
          <option value="approve">Approve</option>
          <option value="login">Login</option>
          <option value="submit">Submit</option>
          <option value="return">Return</option>
        </select>
        <select value={entityFilter} onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2">
          <option value="">All Entities</option>
          <option value="AppEntry">APP Entry</option>
          <option value="PurchaseRequisition">PR</option>
          <option value="Invitation">Invitation</option>
          <option value="BidOpening">Bid Opening</option>
          <option value="Award">Award</option>
          <option value="Contract">Contract</option>
          <option value="Invoice">Invoice</option>
          <option value="User">User</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No audit logs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-3 py-2.5 font-medium text-gray-600">User</th>
                  <th className="px-3 py-2.5 font-medium text-gray-600">Action</th>
                  <th className="px-3 py-2.5 font-medium text-gray-600">Entity</th>
                  <th className="px-3 py-2.5 font-medium text-gray-600">Description</th>
                  <th className="px-3 py-2.5 font-medium text-gray-600">Result</th>
                  <th className="px-3 py-2.5 font-medium text-gray-600">IP Address</th>
                  <th className="px-3 py-2.5 font-medium text-gray-600">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 text-gray-900 text-xs">{log.user_name || `User #${log.user_id}`}</td>
                    <td className="px-3 py-2.5">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{log.action}</span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs">{log.entity_type} #{log.entity_id}</td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs max-w-[200px] truncate">{log.description || '—'}</td>
                    <td className="px-3 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded ${log.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {log.success ? 'OK' : 'Failed'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-400 text-xs font-mono">{log.ip_address || '—'}</td>
                    <td className="px-3 py-2.5 text-gray-500 text-xs">{new Date(log.created_at).toLocaleString('en-PH')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {lastPage > 1 && (
          <div className="flex items-center justify-between px-3 py-2.5 border-t border-gray-100">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="text-sm text-blue-600 disabled:text-gray-300">Previous</button>
            <span className="text-xs text-gray-500">Page {page} of {lastPage}</span>
            <button onClick={() => setPage(p => Math.min(lastPage, p + 1))} disabled={page === lastPage}
              className="text-sm text-blue-600 disabled:text-gray-300">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
