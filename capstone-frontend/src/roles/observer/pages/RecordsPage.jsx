import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import api from '../../../services/api';
import DocumentVersionHistory from '../../../shared/components/DocumentVersionHistory';

const statusColors = {
  posted: 'bg-blue-100 text-blue-700',
  awarded: 'bg-green-100 text-green-700',
  active: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-gray-100 text-gray-600',
  failed: 'bg-red-100 text-red-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function RecordsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [modeFilter, setModeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = { page, per_page: 15 };
        if (modeFilter) params.mode = modeFilter;
        if (statusFilter) params.status = statusFilter;
        const { data } = await api.get('/reports/procurement-register', { params });
        setRecords(data.data || []);
        setLastPage(data.last_page || 1);
      } catch {
        setRecords([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page, modeFilter, statusFilter]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Procurement Register</h1>
        <p className="text-sm text-gray-500 mt-1">Read-only view of all procurement records across the system.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={modeFilter} onChange={(e) => { setModeFilter(e.target.value); setPage(1); }}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2">
          <option value="">All Modes</option>
          <option value="competitive_bidding">Competitive Bidding</option>
          <option value="shopping_52_1a">Shopping (52.1a)</option>
          <option value="shopping_52_1b">Shopping (52.1b)</option>
          <option value="small_value_procurement">Small Value</option>
          <option value="direct_contracting">Direct Contracting</option>
          <option value="negotiated_procurement">Negotiated</option>
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2">
          <option value="">All Statuses</option>
          <option value="posted">Posted</option>
          <option value="awarded">Awarded</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading records...</div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No procurement records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-3 py-2.5 font-medium text-gray-600">Reference</th>
                  <th className="px-3 py-2.5 font-medium text-gray-600">Mode</th>
                  <th className="px-3 py-2.5 font-medium text-gray-600">Department</th>
                  <th className="px-3 py-2.5 font-medium text-gray-600">Status</th>
                  <th className="px-3 py-2.5 font-medium text-gray-600">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map((r) => (
                  <tr key={r.id} className={`hover:bg-gray-50 cursor-pointer ${selectedRecord?.id === r.id ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedRecord(selectedRecord?.id === r.id ? null : r)}>
                    <td className="px-3 py-2.5 font-medium text-gray-900">{r.itb_reference || `INV-${r.id}`}</td>
                    <td className="px-3 py-2.5 text-gray-600">{(r.procurement_mode || '').replace(/_/g, ' ')}</td>
                    <td className="px-3 py-2.5 text-gray-600">{r.purchase_requisition?.department?.name || '—'}</td>
                    <td className="px-3 py-2.5">
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColors[r.status] || 'bg-gray-100 text-gray-600'}`}>
                        {(r.status || '').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-500">{new Date(r.created_at).toLocaleDateString('en-PH')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
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

      {/* Document Version History Panel */}
      {selectedRecord && (
        <DocumentVersionHistory entityType="Invitation" entityId={selectedRecord.id} />
      )}
    </div>
  );
}