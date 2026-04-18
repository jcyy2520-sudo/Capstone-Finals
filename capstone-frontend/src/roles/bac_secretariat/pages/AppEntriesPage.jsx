import toast from '../../../utils/toast';
import { useState, useEffect } from 'react';
import api from '../../../services/api';
export default function AppEntriesPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchEntries();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const params = filter ? { status: filter } : {};
      const res = await api.get('/app-entries', { params });
      setEntries(res.data.data || []);
    } catch (err) { toast.error('Action failed. Please try again.'); console.error(err); }
    setLoading(false);
  };

  const handleAction = async (id, action) => {
    try {
      if (action === 'return') {
        const remarks = prompt('Enter return remarks (min 10 chars):');
        if (!remarks || remarks.length < 10) return;
        await api.post(`/app-entries/${id}/${action}`, { remarks });
      } else {
        await api.post(`/app-entries/${id}/${action}`);
      }
      fetchEntries();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    }
  };

  const statusBadge = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-600',
      submitted: 'bg-blue-100 text-blue-700',
      pending_secretariat_consolidation: 'bg-yellow-100 text-yellow-700',
      pending_budget_certification: 'bg-orange-100 text-orange-700',
      pending_hope_approval: 'bg-purple-100 text-purple-700',
      approved: 'bg-green-100 text-green-700',
      returned: 'bg-red-100 text-red-600',
      cancelled: 'bg-gray-200 text-gray-500',
    };
    const labels = {
      draft: 'Draft', submitted: 'Submitted',
      pending_secretariat_consolidation: 'Pending Consolidation',
      pending_budget_certification: 'For Budget Cert.',
      pending_hope_approval: 'For HOPE Approval',
      approved: 'Approved', returned: 'Returned', cancelled: 'Cancelled',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getActions = (entry) => {
    const actions = [];
    if (entry.status === 'submitted') {
      actions.push({ label: 'Accept', action: 'accept', color: 'green' });
      actions.push({ label: 'Return', action: 'return', color: 'red' });
    }
    return actions;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Annual Procurement Plan Consolidation</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage and accept submitted APP entries</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { value: '', label: 'All' },
          { value: 'submitted', label: 'Submitted (Action Required)' },
          { value: 'pending_budget_certification', label: 'For Budget Cert.' },
          { value: 'pending_hope_approval', label: 'For HOPE Approval' },
          { value: 'approved', label: 'Approved' },
        ].map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
              filter === f.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>{f.label}</button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No APP entries found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-600">Project Title</th>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-600">Department</th>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-600">Category</th>
                  <th className="text-right px-3 py-2.5 font-medium text-gray-600">ABC (₱)</th>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-600">Mode</th>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-600">Status</th>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition">
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-gray-900 max-w-xs truncate">{entry.project_title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{entry.target_start_quarter} – {entry.target_completion_quarter}</div>
                    </td>
                    <td className="px-3 py-2.5 text-gray-600">{entry.department?.name}</td>
                    <td className="px-3 py-2.5 text-gray-600 capitalize">{entry.category?.replace(/_/g, ' ')}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-gray-800">
                      {parseFloat(entry.abc).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs">{entry.mode?.replace(/_/g, ' ')}</td>
                    <td className="px-3 py-2.5">{statusBadge(entry.status)}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1.5">
                        {getActions(entry).map(a => (
                          <button key={a.action}
                            onClick={() => handleAction(entry.id, a.action)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                              a.color === 'red' ? 'bg-red-50 text-red-600 hover:bg-red-100' :
                              a.color === 'green' ? 'bg-green-50 text-green-600 hover:bg-green-100' :
                              'bg-blue-50 text-blue-600 hover:bg-blue-100'
                            }`}>{a.label}</button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
