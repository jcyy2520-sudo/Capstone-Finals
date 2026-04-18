import { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from '../../../utils/toast';

const STATUS_COLORS = {
  pending_hope_approval: 'bg-violet-100 text-violet-700',
  approved: 'bg-green-100 text-green-700',
  returned: 'bg-red-100 text-red-600',
  pending_budget_certification: 'bg-orange-100 text-orange-700',
};

const STATUS_LABELS = {
  pending_hope_approval: 'For Approval',
  approved: 'Approved',
  returned: 'Returned',
  pending_budget_certification: 'For Budget Cert.',
};

function StatusBadge({ status }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export default function ApprovalsPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending_hope_approval');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => { fetchEntries(); }, [filter]);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const params = filter ? { status: filter } : {};
      const res = await api.get('/app-entries', { params });
      setEntries(res.data.data || []);
    } catch {
      toast.error('Failed to load APP entries.');
    }
    setLoading(false);
  };

  const handleApprove = async (id) => {
    if (!confirm('Approve this APP entry? This will finalize the annual procurement plan item.')) return;
    setActionLoading(id);
    try {
      await api.post(`/app-entries/${id}/approve`);
      toast.success('APP entry approved.');
      fetchEntries();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed.');
    }
    setActionLoading(null);
  };

  const handleReturn = async (id) => {
    const remarks = prompt('Enter return remarks (min 10 characters):');
    if (!remarks || remarks.length < 10) {
      if (remarks !== null) toast.error('Remarks must be at least 10 characters.');
      return;
    }
    setActionLoading(id);
    try {
      await api.post(`/app-entries/${id}/return`, { remarks });
      toast.success('APP entry returned for revision.');
      fetchEntries();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Return failed.');
    }
    setActionLoading(null);
  };

  const formatCurrency = (val) =>
    parseFloat(val || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 });

  const pendingCount = entries.filter(e => e.status === 'pending_hope_approval').length;

  const filters = [
    { value: 'pending_hope_approval', label: 'Pending Approval' },
    { value: 'approved', label: 'Approved' },
    { value: '', label: 'All' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">APP Approvals</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review budget-certified APP entries and approve or return for revision.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs uppercase tracking-wide text-violet-600">Pending Approval</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">{pendingCount}</p>
          <p className="text-xs text-gray-400 mt-1">APP entries awaiting your sign-off</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs uppercase tracking-wide text-emerald-600">Total Visible</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">{entries.length}</p>
          <p className="text-xs text-gray-400 mt-1">Across all filtered statuses</p>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {filters.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
              filter === f.value
                ? 'bg-violet-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>{f.label}</button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            {filter === 'pending_hope_approval'
              ? 'No APP entries awaiting approval.'
              : 'No APP entries found.'}
          </div>
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
                  <th className="text-left px-3 py-2.5 font-medium text-gray-600">Budget Certified</th>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-600">Status</th>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition">
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-gray-900 max-w-xs truncate">{entry.project_title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">FY {entry.fiscal_year}</div>
                    </td>
                    <td className="px-3 py-2.5 text-gray-600">{entry.department?.name}</td>
                    <td className="px-3 py-2.5 text-gray-600 capitalize">{entry.category?.replace(/_/g, ' ')}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-gray-800">{formatCurrency(entry.abc)}</td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs">{entry.mode?.replace(/_/g, ' ')}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-500">
                      {entry.budget_certified_at
                        ? new Date(entry.budget_certified_at).toLocaleDateString('en-PH')
                        : '—'}
                    </td>
                    <td className="px-3 py-2.5"><StatusBadge status={entry.status} /></td>
                    <td className="px-3 py-2.5">
                      {entry.status === 'pending_hope_approval' && (
                        <div className="flex gap-1.5">
                          <button
                            disabled={actionLoading === entry.id}
                            onClick={() => handleApprove(entry.id)}
                            className="px-2.5 py-1 text-xs font-medium rounded-md bg-violet-50 text-violet-600 hover:bg-violet-100 transition disabled:opacity-50">
                            Approve
                          </button>
                          <button
                            disabled={actionLoading === entry.id}
                            onClick={() => handleReturn(entry.id)}
                            className="px-2.5 py-1 text-xs font-medium rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition disabled:opacity-50">
                            Return
                          </button>
                        </div>
                      )}
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