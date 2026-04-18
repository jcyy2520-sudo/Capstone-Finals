import { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from '../../../utils/toast';

const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-600',
  ISSUED: 'bg-yellow-100 text-yellow-800',
  ACKNOWLEDGED: 'bg-blue-100 text-blue-800',
  NTP_ISSUED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-700',
  RE_AWARD: 'bg-orange-100 text-orange-700',
};

export default function AwardManagementPage() {
  const [data, setData] = useState({ bac_resolutions: [], awards: [] });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/awards');
      setData(res.data);
    } catch {
      toast.error('Failed to load awards.');
    }
    setLoading(false);
  };

  const handleIssueNoa = async (awardId) => {
    if (!window.confirm('Digitally sign and issue this Notice of Award to the vendor? This action is irreversible.')) return;
    setActionLoading(awardId);
    try {
      await api.put(`/awards/${awardId}/issue-noa`);
      toast.success('Notice of Award signed and issued successfully.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to issue NOA.');
    }
    setActionLoading(null);
  };

  const handleCancelAward = async (awardId) => {
    const grounds = window.prompt('Enter cancellation grounds (minimum 20 characters):');
    if (!grounds || grounds.length < 20) {
      if (grounds !== null) toast.error('Grounds must be at least 20 characters.');
      return;
    }
    setActionLoading(awardId);
    try {
      await api.post(`/awards/${awardId}/cancel`, { cancellation_grounds: grounds });
      toast.success('Award cancelled. BAC will re-evaluate next ranked bidder.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancellation failed.');
    }
    setActionLoading(null);
  };

  const awards = data.awards || [];
  const filtered = filter === 'all' ? awards : awards.filter(a => a.status === filter);
  const draftCount = awards.filter(a => a.status === 'DRAFT').length;
  const issuedCount = awards.filter(a => a.status === 'ISSUED').length;
  const ackedCount = awards.filter(a => a.status === 'ACKNOWLEDGED').length;

  const formatCurrency = (val) => parseFloat(val || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 });
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  const filters = [
    { value: 'all', label: 'All Awards' },
    { value: 'DRAFT', label: 'Pending Sign' },
    { value: 'ISSUED', label: 'Issued' },
    { value: 'ACKNOWLEDGED', label: 'Acknowledged' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Award Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Sign and issue Notices of Award. Track vendor acknowledgment and performance security deadlines.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs uppercase tracking-wide text-amber-600">Pending Signature</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">{draftCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs uppercase tracking-wide text-yellow-600">NOA Issued</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">{issuedCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs uppercase tracking-wide text-blue-600">Acknowledged</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">{ackedCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-[11px] uppercase tracking-wide text-gray-500">Total Awards</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">{awards.length}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
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

      {/* Awards list */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">No awards found.</div>
        ) : (
          filtered.map(award => (
            <div key={award.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-gray-900 text-lg">{award.noa_reference}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[award.status] || 'bg-gray-100 text-gray-600'}`}>
                      {award.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Vendor:</span> {award.vendor?.business_name || `Vendor #${award.vendor_id}`}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Contract Amount:</span> ₱{formatCurrency(award.contract_amount)}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Performance Security:</span> ₱{formatCurrency(award.performance_security_amount)}
                  </p>
                </div>

                <div className="flex flex-col gap-2 items-end">
                  {award.status === 'DRAFT' && (
                    <button
                      onClick={() => handleIssueNoa(award.id)}
                      disabled={actionLoading === award.id}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                    >
                      {actionLoading === award.id ? 'Signing...' : 'Sign & Issue NOA'}
                    </button>
                  )}
                  {['DRAFT', 'ISSUED', 'ACKNOWLEDGED'].includes(award.status) && (
                    <button
                      onClick={() => handleCancelAward(award.id)}
                      disabled={actionLoading === award.id}
                      className="px-4 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 disabled:opacity-50 transition"
                    >
                      Cancel Award
                    </button>
                  )}
                </div>
              </div>

              {/* Timeline info */}
              <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-500">
                <div>
                  <p className="font-medium text-gray-700">NOA Issued</p>
                  <p>{formatDate(award.noa_issued_at)}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Ack Deadline</p>
                  <p className={award.status === 'ISSUED' ? 'text-amber-600 font-semibold' : ''}>
                    {formatDate(award.noa_acknowledgment_deadline)}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Acknowledged</p>
                  <p>{formatDate(award.noa_acknowledged_at)}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Security Deadline</p>
                  <p className={award.status === 'ACKNOWLEDGED' ? 'text-red-600 font-semibold' : ''}>
                    {formatDate(award.performance_security_deadline)}
                  </p>
                </div>
              </div>

              {award.cancellation_grounds && (
                <div className="mt-3 p-3 bg-red-50 rounded-md text-[13px] text-red-700">
                  <span className="font-medium">Cancellation Grounds:</span> {award.cancellation_grounds}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
