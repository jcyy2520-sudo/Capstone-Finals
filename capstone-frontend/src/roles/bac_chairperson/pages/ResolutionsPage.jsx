import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../../services/api';

const STATUS_STYLES = {
  draft: 'bg-gray-100 text-gray-700',
  pending_signatures: 'bg-amber-100 text-amber-700',
  signed: 'bg-green-100 text-green-700',
  finalized: 'bg-blue-100 text-blue-700',
};

export default function ResolutionsPage() {
  const [resolutions, setResolutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get('/post-qualifications');
        setResolutions(data.bac_resolutions || []);
      } catch {
        setResolutions([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const pending = resolutions.filter(r => r.status === 'draft' || r.status === 'pending_signatures');
  const signed = resolutions.filter(r => r.status === 'signed' || r.status === 'finalized');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">BAC Resolutions</h1>
        <p className="text-sm text-gray-500 mt-1">Review, sign, and finalize BAC resolutions for award recommendations and failure declarations.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-[11px] uppercase tracking-wide text-gray-500">Total Resolutions</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{resolutions.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-[11px] uppercase tracking-wide text-gray-500">Pending Action</p>
          <p className={`text-2xl font-bold mt-2 ${pending.length > 0 ? 'text-amber-600' : 'text-gray-900'}`}>{pending.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-[11px] uppercase tracking-wide text-gray-500">Signed / Finalized</p>
          <p className="text-2xl font-bold text-emerald-600 mt-2">{signed.length}</p>
        </div>
      </div>

      {/* Resolutions Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Resolution Register</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading resolutions...</div>
        ) : resolutions.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No BAC resolutions found.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {resolutions.map((res) => (
              <div key={res.id}>
                <div className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedId(expandedId === res.id ? null : res.id)}>
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">{res.resolution_number || `Resolution #${res.id}`}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {res.resolution_type?.replace(/_/g, ' ') || 'BAC Resolution'}
                        {res.invitation_id && ` • Invitation #${res.invitation_id}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded capitalize ${STATUS_STYLES[res.status] || 'bg-gray-100 text-gray-700'}`}>
                      {(res.status || '').replace(/_/g, ' ')}
                    </span>
                    {expandedId === res.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </div>
                {expandedId === res.id && (
                  <div className="px-5 pb-4 bg-gray-50 border-t border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm pt-3">
                      {res.recommendation && (
                        <div>
                          <p className="text-gray-500 text-xs">Recommendation</p>
                          <p className="text-gray-900">{res.recommendation}</p>
                        </div>
                      )}
                      {res.grounds && (
                        <div>
                          <p className="text-gray-500 text-xs">Grounds</p>
                          <p className="text-gray-900">{res.grounds}</p>
                        </div>
                      )}
                      {res.signatories && (
                        <div>
                          <p className="text-gray-500 text-xs">Signatories</p>
                          <p className="text-gray-900">{Array.isArray(res.signatories) ? res.signatories.length : 0} signature(s)</p>
                        </div>
                      )}
                      {res.min_signatures_required && (
                        <div>
                          <p className="text-gray-500 text-xs">Required Signatures</p>
                          <p className="text-gray-900">{res.min_signatures_required}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-gray-500 text-xs">Created</p>
                        <p className="text-gray-900">{res.created_at ? new Date(res.created_at).toLocaleString('en-PH') : '—'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}