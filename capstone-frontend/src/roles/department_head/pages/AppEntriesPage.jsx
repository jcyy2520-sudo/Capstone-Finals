import { useEffect, useState } from 'react';
import api from '../../../services/api';
import toast from '../../../utils/toast';

const STATUS_STYLES = {
  submitted: 'bg-amber-100 text-amber-800',
  pending_budget_certification: 'bg-blue-100 text-blue-700',
  approved: 'bg-emerald-100 text-emerald-700',
  returned: 'bg-rose-100 text-rose-700',
};

const STATUS_LABELS = {
  submitted: 'Awaiting Endorsement',
  pending_budget_certification: 'Endorsed',
  approved: 'Approved',
  returned: 'Returned',
};

export default function DepartmentHeadAppEntriesPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('submitted');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchEntries();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const params = filter ? { status: filter } : {};
      const response = await api.get('/app-entries', { params });
      setEntries(response.data.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load APP entries.');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (entryId, action) => {
    const loadingKey = `${action}-${entryId}`;
    setActionLoading(loadingKey);

    try {
      if (action === 'return') {
        const remarks = window.prompt('Enter return remarks (min 10 characters):');
        if (!remarks || remarks.trim().length < 10) {
          if (remarks !== null) toast.error('Remarks must be at least 10 characters.');
          return;
        }
        await api.post(`/app-entries/${entryId}/return`, { remarks });
        toast.success('APP entry returned to the requesting office.');
      } else {
        await api.post(`/app-entries/${entryId}/endorse`);
        toast.success('APP entry endorsed for budget certification.');
      }

      fetchEntries();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">APP Endorsements</h1>
        <p className="text-sm text-gray-500 mt-1">Endorse or return APP entries from your department before budget certification.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { value: 'submitted', label: 'Awaiting Endorsement' },
          { value: 'pending_budget_certification', label: 'Endorsed' },
          { value: 'approved', label: 'Approved' },
          { value: 'returned', label: 'Returned' },
          { value: '', label: 'All Visible' },
        ].map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
              filter === item.value ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading APP entries...</div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No APP entries found for this view.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-600">Project Title</th>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-600">Department</th>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-600">Category</th>
                  <th className="text-right px-3 py-2.5 font-medium text-gray-600">ABC (PHP)</th>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-600">Status</th>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-gray-900">{entry.project_title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">FY {entry.fiscal_year}</div>
                    </td>
                    <td className="px-3 py-2.5 text-gray-600">{entry.department?.name || 'Department not set'}</td>
                    <td className="px-3 py-2.5 text-gray-600 capitalize">{entry.category?.replace(/_/g, ' ')}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-gray-800">
                      {Number.parseFloat(entry.abc || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[entry.status] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[entry.status] || entry.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      {entry.status === 'submitted' ? (
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            disabled={actionLoading === `endorse-${entry.id}`}
                            onClick={() => handleAction(entry.id, 'endorse')}
                            className="px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:opacity-50"
                          >
                            Endorse
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading === `return-${entry.id}`}
                            onClick={() => handleAction(entry.id, 'return')}
                            className="px-2.5 py-1 text-xs font-medium rounded-md bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-50"
                          >
                            Return
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">No action</span>
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