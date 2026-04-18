import { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from '../../../utils/toast';

const STATUS_COLORS = {
  signed: 'bg-amber-100 text-amber-700',
  approved_by_hope: 'bg-green-100 text-green-700',
};

const STATUS_LABELS = {
  signed: 'Pending HOPE Approval',
  approved_by_hope: 'Approved',
};

function StatusBadge({ status }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export default function ResolutionApprovalsPage() {
  const [resolutions, setResolutions] = useState([]);
  const [awards, setAwards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('signed');
  const [actionLoading, setActionLoading] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState(null);
  const [perfSecurityPct, setPerfSecurityPct] = useState(5);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/awards');
      setResolutions(res.data.bac_resolutions || []);
      setAwards(res.data.awards || []);
    } catch {
      toast.error('Failed to load BAC resolutions.');
    }
    setLoading(false);
  };

  const openApproveModal = (resolution) => {
    setSelectedResolution(resolution);
    setPerfSecurityPct(5);
    setShowApproveModal(true);
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    if (!selectedResolution) return;
    setActionLoading(selectedResolution.id);
    try {
      await api.post(`/awards/resolutions/${selectedResolution.id}/approve`, {
        performance_security_percentage: perfSecurityPct,
      });
      toast.success('BAC Resolution approved. Draft NOA generated.');
      setShowApproveModal(false);
      setSelectedResolution(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed.');
    }
    setActionLoading(null);
  };

  const filtered = resolutions.filter(r => filter ? r.status === filter : true);
  const pendingCount = resolutions.filter(r => r.status === 'signed').length;

  const filters = [
    { value: 'signed', label: 'Pending Approval' },
    { value: 'approved_by_hope', label: 'Approved' },
    { value: '', label: 'All' },
  ];

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">BAC Resolution Approvals</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review signed BAC resolutions recommending award and approve or return.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs uppercase tracking-wide text-amber-600">Pending Approval</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs uppercase tracking-wide text-green-600">Approved</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">{resolutions.filter(r => r.status === 'approved_by_hope').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs uppercase tracking-wide text-blue-600">Awards Generated</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">{awards.length}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              filter === f.value
                ? 'bg-violet-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Resolutions table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-gray-400">No resolutions found.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Reference</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Subject</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Signatories</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Approved</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(res => (
                <tr key={res.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2.5 font-medium text-gray-800">{res.resolution_reference || `RES-${res.id}`}</td>
                  <td className="px-3 py-2.5 text-gray-600 capitalize">{(res.type || '').replace(/_/g, ' ').toLowerCase()}</td>
                  <td className="px-3 py-2.5 text-gray-600 max-w-xs truncate">{res.subject || '—'}</td>
                  <td className="px-3 py-2.5 text-gray-600">{(res.signatories || []).length} / {res.min_signatures_required || 3}</td>
                  <td className="px-3 py-2.5"><StatusBadge status={res.status} /></td>
                  <td className="px-3 py-2.5 text-gray-500">{formatDate(res.hope_approved_at)}</td>
                  <td className="px-3 py-2.5">
                    {res.status === 'signed' && (
                      <button
                        onClick={() => openApproveModal(res)}
                        disabled={actionLoading === res.id}
                        className="px-3 py-1.5 bg-violet-600 text-white text-xs font-medium rounded-lg hover:bg-violet-700 disabled:opacity-50 transition"
                      >
                        {actionLoading === res.id ? 'Processing…' : 'Approve'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Approve Modal */}
      {showApproveModal && selectedResolution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 space-y-5">
            <h2 className="text-base font-semibold text-gray-900">Approve BAC Resolution</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <p><span className="font-medium text-gray-800">Reference:</span> {selectedResolution.resolution_reference || `RES-${selectedResolution.id}`}</p>
              <p><span className="font-medium text-gray-800">Type:</span> {(selectedResolution.type || '').replace(/_/g, ' ')}</p>
              <p><span className="font-medium text-gray-800">Subject:</span> {selectedResolution.subject || '—'}</p>
              <p><span className="font-medium text-gray-800">Signatories:</span> {(selectedResolution.signatories || []).length} / {selectedResolution.min_signatures_required || 3}</p>
            </div>

            <form onSubmit={handleApprove} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Performance Security Percentage (%)
                </label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  step="0.5"
                  value={perfSecurityPct}
                  onChange={e => setPerfSecurityPct(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px] focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">Per RA 9184, minimum 2%, maximum 10% of contract amount.</p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowApproveModal(false); setSelectedResolution(null); }}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === selectedResolution.id}
                  className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50"
                >
                  {actionLoading === selectedResolution.id ? 'Approving…' : 'Confirm Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
