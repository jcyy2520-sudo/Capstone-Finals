import toast from '../../../utils/toast';
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { CheckCircle2, RefreshCw, FileText, AlertCircle, Info, XCircle } from 'lucide-react';

const PROCUREMENT_MODES = [
  { value: 'competitive_bidding', label: 'Competitive Bidding' },
  { value: 'limited_source_bidding', label: 'Limited Source Bidding' },
  { value: 'direct_contracting', label: 'Direct Contracting' },
  { value: 'repeat_order', label: 'Repeat Order' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'negotiated_procurement', label: 'Negotiated Procurement' },
  { value: 'small_value_procurement', label: 'Small Value Procurement' },
];

export default function ModeConfirmationPage() {
  const [prs, setPrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPr, setSelectedPr] = useState(null);
  const [overrideMode, setOverrideMode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchPRs(); }, []);

  const fetchPRs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/purchase-requisitions/mode-confirmation-queue');
      setPrs(res.data.data || []);
    } catch (err) { toast.error('Failed to load PRs.'); console.error(err); }
    setLoading(false);
  };

  const openConfirm = (pr) => {
    setSelectedPr(pr);
    setOverrideMode(pr.recommended_mode || '');
    setShowModal(true);
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await api.post(`/purchase-requisitions/${selectedPr.id}/confirm-mode`, {
        confirmed_mode: overrideMode || selectedPr.recommended_mode
      });
      toast.success('Procurement mode confirmed. PR is now ready for invitation creation.');
      setShowModal(false);
      fetchPRs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Confirmation failed.');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Mode Confirmation</h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center italic">
            <Info className="w-4 h-4 mr-2 text-blue-500" /> Review secretariat-recommended procurement modes and confirm or override.
          </p>
        </div>
        <button onClick={fetchPRs} className="p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-blue-600 transition-all shadow-sm">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-xl shadow-gray-200/50 overflow-hidden">
        {loading ? (
          <div className="p-20 text-center">
            <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500 font-medium tracking-tight">Loading PRs pending confirmation...</p>
          </div>
        ) : prs.length === 0 ? (
          <div className="p-20 text-center">
            <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">No PRs Pending Mode Confirmation</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">
                  <th className="px-8 py-5">PR Reference</th>
                  <th className="px-8 py-5">Purpose</th>
                  <th className="px-8 py-5">ABC Value</th>
                  <th className="px-8 py-5">Recommended Mode</th>
                  <th className="px-8 py-5">Justification</th>
                  <th className="px-8 py-5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {prs.map((pr) => (
                  <tr key={pr.id} className="hover:bg-blue-50/20 transition-all">
                    <td className="px-8 py-5">
                      <p className="font-bold text-gray-900 font-mono text-sm">{pr.pr_reference || 'REF-TBD'}</p>
                      <p className="text-[10px] text-gray-500 mt-1">{new Date(pr.created_at).toLocaleDateString()}</p>
                    </td>
                    <td className="px-8 py-5 text-sm text-gray-700 max-w-xs truncate">{pr.purpose}</td>
                    <td className="px-8 py-5">
                      <p className="font-black text-blue-700 text-sm">₱{parseFloat(pr.total_value).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
                        {(pr.recommended_mode || '').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-xs text-gray-600 max-w-xs truncate">{pr.recommended_mode_justification || 'N/A'}</td>
                    <td className="px-8 py-5 text-center">
                      <button onClick={() => openConfirm(pr)}
                        className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center gap-2 mx-auto">
                        <CheckCircle2 className="w-3 h-3" /> Review & Confirm
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && selectedPr && (
        <div className="fixed inset-0 z-[100] p-4 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-xl overflow-hidden animate-in zoom-in duration-200">
            <div className="px-8 py-6 border-b flex items-center justify-between bg-teal-50/50">
              <div>
                <h3 className="text-xl font-black text-teal-900">Confirm Procurement Mode</h3>
                <p className="text-xs text-teal-700 font-bold uppercase tracking-widest mt-1">BAC Chairperson Approval</p>
              </div>
              <AlertCircle className="w-10 h-10 text-teal-600 opacity-20" />
            </div>

            <div className="p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">PR Reference</label>
                  <p className="text-sm font-bold text-gray-900 font-mono">{selectedPr.pr_reference}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ABC Value</label>
                  <p className="text-lg font-black text-blue-700">₱{parseFloat(selectedPr.total_value).toLocaleString()}</p>
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Secretariat Recommendation</label>
                <p className="text-sm font-bold text-amber-800 mt-1">{(selectedPr.recommended_mode || '').replace(/_/g, ' ')}</p>
                <p className="text-xs text-amber-700 mt-2">{selectedPr.recommended_mode_justification || 'No justification provided.'}</p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-black text-gray-700 uppercase tracking-wide">Confirm or Override Mode</label>
                <div className="grid grid-cols-1 gap-2">
                  {PROCUREMENT_MODES.map(mode => (
                    <button key={mode.value}
                      onClick={() => setOverrideMode(mode.value)}
                      className={`w-full px-5 py-3 rounded-2xl text-left border-2 transition-all flex items-center justify-between ${
                        overrideMode === mode.value
                          ? 'border-teal-600 bg-teal-50 text-teal-900 ring-2 ring-teal-100'
                          : 'border-gray-100 hover:border-gray-300 text-gray-600'
                      }`}>
                      <span className="text-sm font-bold">{mode.label}</span>
                      {overrideMode === mode.value && <CheckCircle2 className="w-5 h-5 text-teal-600" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-8 py-6 bg-gray-50/50 border-t flex justify-end gap-3">
              <button onClick={() => setShowModal(false)}
                className="px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-gray-900">
                Cancel
              </button>
              <button disabled={submitting || !overrideMode}
                onClick={handleConfirm}
                className="px-8 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl bg-gray-900 text-white shadow-xl hover:bg-black disabled:opacity-50 transition-all">
                {submitting ? 'Confirming...' : 'Confirm Mode'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
