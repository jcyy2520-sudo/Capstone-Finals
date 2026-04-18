import toast from '../../../utils/toast';
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  RefreshCw, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink,
  Copy,
  Info
} from 'lucide-react';

const PROCUREMENT_MODES = [
  { value: 'competitive_bidding', label: 'Competitive Bidding' },
  { value: 'limited_source_bidding', label: 'Limited Source Bidding' },
  { value: 'direct_contracting', label: 'Direct Contracting' },
  { value: 'repeat_order', label: 'Repeat Order' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'negotiated_procurement', label: 'Negotiated Procurement' },
  { value: 'small_value_procurement', label: 'Small Value Procurement' },
];

export default function PurchaseRequisitionsPage() {
  const [prs, setPrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending_secretariat_review');
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [selectedPr, setSelectedPr] = useState(null);
  const [selectedMode, setSelectedMode] = useState('');
  const [modeJustification, setModeJustification] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPRs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchPRs = async () => {
    setLoading(true);
    try {
      const params = filter ? { status: filter } : {};
      const res = await api.get('/purchase-requisitions', { params });
      setPrs(res.data.data || []);
    } catch (err) { toast.error('Failed to load PRs. Please try again.'); console.error(err); }
    setLoading(false);
  };

  const handleOpenAccept = (pr) => {
    setSelectedPr(pr);
    const suggested = pr.app_entry?.abc > 2000000 ? 'competitive_bidding' : 'small_value_procurement';
    setSelectedMode(suggested);
    setModeJustification('');
    setShowAcceptModal(true);
  };

  const handleConfirmAccept = async () => {
    if (!selectedMode) return toast.error('Please select a procurement mode.');
    if (!modeJustification.trim()) return toast.error('Please provide a mode justification.');
    
    setSubmitting(true);
    try {
      await api.post(`/purchase-requisitions/${selectedPr.id}/accept`, {
        procurement_mode: selectedMode,
        mode_justification: modeJustification
      });
      toast.success('PR accepted. Awaiting BAC Chairperson mode confirmation.');
      setShowAcceptModal(false);
      fetchPRs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Acceptance failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      if (action === 'return') {
        const remarks = prompt('Enter return remarks:');
        if (!remarks) return;
        await api.post(`/purchase-requisitions/${id}/${action}`, { remarks });
      } else {
        await api.post(`/purchase-requisitions/${id}/${action}`);
      }
      fetchPRs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Hash copied to clipboard!');
  };

  const statusBadge = (status) => {
    const colors = {
      pending_budget_certification: 'bg-orange-50 text-orange-600 border-orange-100',
      pending_secretariat_review: 'bg-blue-50 text-blue-600 border-blue-100 animate-pulse',
      pending_mode_confirmation: 'bg-amber-50 text-amber-600 border-amber-100',
      mode_confirmed: 'bg-teal-100 text-teal-700 border-teal-200',
      accepted: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      returned: 'bg-rose-50 text-rose-600 border-rose-100',
    };
    const labels = {
      pending_budget_certification: 'Awaiting Budget', 
      pending_secretariat_review: 'Awaiting Review',
      pending_mode_confirmation: 'Pending Mode Confirmation',
      mode_confirmed: 'Mode Confirmed',
      accepted: 'Officially Accepted', 
      returned: 'Returned'
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${colors[status] || 'bg-gray-100 border-gray-200 text-gray-400'}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">PR Consolidation Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center italic">
            <Info className="w-4 h-4 mr-2 text-blue-500" /> Review, mode-assignment, and acceptance for approved requisitions.
          </p>
        </div>
        <button onClick={fetchPRs} className="p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-blue-600 transition-all shadow-sm">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { value: 'pending_secretariat_review', label: 'Awaiting Acceptance' },
          { value: 'pending_budget_certification', label: 'Under Budget Review' },
          { value: 'pending_mode_confirmation', label: 'Pending Mode Confirm' },
          { value: 'mode_confirmed', label: 'Mode Confirmed' },
          { value: '', label: 'Full Historical View' },
        ].map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all uppercase tracking-widest ${
              filter === f.value ? 'bg-gray-900 text-white shadow-lg' : 'bg-white border border-gray-200 text-gray-500 hover:border-blue-300'
            }`}>{f.label}</button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-xl shadow-gray-200/50 overflow-hidden">
        {loading && prs.length === 0 ? (
          <div className="p-20 text-center">
             <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
             <p className="text-gray-500 font-medium tracking-tight">Accessing Requisitions Database...</p>
          </div>
        ) : prs.length === 0 ? (
          <div className="p-20 text-center">
             <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
             <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">No Requisitions in this Stage</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 border-b text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">
                    <th className="px-8 py-5">PR Identification</th>
                    <th className="px-8 py-5">Originating Unit</th>
                    <th className="px-8 py-5">Value (ABC)</th>
                    <th className="px-8 py-5">Current Status</th>
                    <th className="px-8 py-5">Audit Trace</th>
                    <th className="px-8 py-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {prs.map((pr) => (
                    <tr key={pr.id} className="hover:bg-blue-50/20 transition-all group">
                      <td className="px-8 py-5">
                        <p className="font-bold text-gray-900 font-mono text-sm tracking-tight">{pr.pr_reference || 'REF-TBD'}</p>
                        <p className="text-[10px] text-gray-500 mt-1 uppercase font-semibold">Sub: {new Date(pr.submitted_at || pr.created_at).toLocaleDateString()}</p>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-sm font-bold text-gray-700">{pr.department?.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{pr.purpose}</p>
                      </td>
                      <td className="px-8 py-5">
                        <p className="font-black text-blue-700 text-sm">₱{parseFloat(pr.total_value).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                      </td>
                      <td className="px-8 py-5">{statusBadge(pr.status)}</td>
                      <td className="px-8 py-5">
                        {pr.status === 'accepted' ? (
                          <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-emerald-600">
                                  <ShieldCheck className="w-4 h-4" />
                                  <span className="text-[10px] font-bold uppercase tracking-tight">Node Verified</span>
                              </div>
                              <div className="group/audit relative">
                                  <p className="text-[9px] text-gray-400 font-mono flex items-center gap-1">
                                      {pr.latest_blockchain_event?.block_hash ? `${pr.latest_blockchain_event.block_hash.slice(0, 8)}...${pr.latest_blockchain_event.block_hash.slice(-8)}` : 'HASH_PENDING'}
                                      {pr.latest_blockchain_event?.block_hash && (
                                        <button onClick={() => copyToClipboard(pr.latest_blockchain_event.block_hash)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Copy className="w-3 h-3 hover:text-blue-500" />
                                        </button>
                                      )}
                                  </p>
                                  {pr.latest_blockchain_event && (
                                    <div className="absolute z-20 top-full left-0 mt-2 p-3 bg-gray-900 text-white text-[9px] rounded-lg shadow-2xl invisible group-hover/audit:visible min-w-[280px] space-y-2 border border-white/10">
                                        <div className="pb-2 border-b border-white/10">
                                            <p className="text-gray-400 font-bold uppercase tracking-widest text-[8px]">Full Verification Hash</p>
                                            <p className="font-mono mt-0.5 break-all text-blue-300">{pr.latest_blockchain_event.block_hash}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 uppercase font-bold tracking-tighter">
                                            <div>
                                                <p className="text-gray-400 text-[8px]">Event Record</p>
                                                <p className="text-emerald-400">{pr.latest_blockchain_event.event_type}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-[8px]">Timestamp</p>
                                                <p className="text-blue-400 font-mono">{new Date(pr.latest_blockchain_event.recorded_at).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                  )}
                              </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">Awaiting Acceptance</span>
                        )}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex justify-center">
                          {pr.status === 'pending_secretariat_review' && (
                             <div className="flex gap-2 animate-in fade-in zoom-in duration-300">
                               <button 
                                 onClick={() => handleOpenAccept(pr)} 
                                 className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center gap-2"
                               >
                                 <CheckCircle2 className="w-3 h-3" /> Step 1: Accept
                               </button>
                               <button 
                                 onClick={() => handleAction(pr.id, 'return')} 
                                 className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all"
                               >
                                 Return
                               </button>
                             </div>
                          )}
                          {pr.status === 'accepted' && (
                            <button className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-all" title="View Invitation Detail">
                                <ExternalLink className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        )}
      </div>

      {showAcceptModal && selectedPr && (
        <div className="fixed inset-0 z-[100] p-4 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-xl overflow-hidden animate-in zoom-in duration-200">
                <div className="px-8 py-6 border-b flex items-center justify-between bg-emerald-50/50">
                    <div>
                        <h3 className="text-xl font-black text-emerald-900">Official PR Acceptance</h3>
                        <p className="text-xs text-emerald-700 font-bold uppercase tracking-widest mt-1">RA 12009 Compliance Check</p>
                    </div>
                    <AlertCircle className="w-10 h-10 text-emerald-600 opacity-20" />
                </div>
                
                <div className="p-8 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ABC (Net Total)</label>
                            <p className="text-lg font-black text-blue-700">₱{parseFloat(selectedPr.total_value).toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">APP Category</label>
                            <p className="text-sm font-bold text-gray-700 uppercase">{selectedPr.app_entry?.category || 'General'}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm font-black text-gray-700 uppercase tracking-wide">Assign Procurement Mode</label>
                        <div className="grid grid-cols-1 gap-2">
                             {PROCUREMENT_MODES.map(mode => {
                                 const isThresholdBlocked = parseFloat(selectedPr.total_value) > 2000000 && 
                                                           mode.value !== 'competitive_bidding' && 
                                                           (!selectedPr.app_entry?.justification || selectedPr.app_entry?.status !== 'approved');
                                 
                                 return (
                                     <button
                                         key={mode.value}
                                         disabled={isThresholdBlocked}
                                         onClick={() => setSelectedMode(mode.value)}
                                         className={`w-full px-5 py-3 rounded-2xl text-left border-2 transition-all flex items-center justify-between ${
                                             selectedMode === mode.value 
                                                 ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-100' 
                                                 : 'border-gray-100 hover:border-gray-300 text-gray-600'
                                         } ${isThresholdBlocked ? 'opacity-30 cursor-not-allowed bg-gray-100 border-none' : ''}`}
                                     >
                                         <div className="flex flex-col">
                                             <span className="text-sm font-bold">{mode.label}</span>
                                             {isThresholdBlocked && <span className="text-[9px] font-bold text-rose-500 uppercase tracking-tighter">RA 12009 Threshold Restriction: Justification Needed</span>}
                                         </div>
                                         {selectedMode === mode.value && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                                     </button>
                                 );
                             })}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-black text-gray-700 uppercase tracking-wide">Mode Justification</label>
                        <textarea
                          value={modeJustification}
                          onChange={(e) => setModeJustification(e.target.value)}
                          rows={3}
                          placeholder="Provide justification for the selected procurement mode per RA 9184/12009..."
                          className="w-full px-3 py-2.5 rounded-2xl border-2 border-gray-100 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                        />
                    </div>

                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
                        <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
                        <p className="text-xs text-blue-700 font-medium">This PR will be forwarded to BAC Chairperson for procurement mode confirmation before invitation creation.</p>
                    </div>
                </div>

                <div className="px-8 py-6 bg-gray-50/50 border-t flex justify-end gap-3">
                    <button 
                        onClick={() => setShowAcceptModal(false)}
                        className="px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-gray-900"
                    >
                        Cancel
                    </button>
                    <button 
                        disabled={submitting || !selectedMode}
                        onClick={handleConfirmAccept}
                        className="px-8 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl bg-gray-900 text-white shadow-xl hover:bg-black disabled:opacity-50 transition-all"
                    >
                        {submitting ? 'Verifying...' : 'Finalize Acceptance'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
