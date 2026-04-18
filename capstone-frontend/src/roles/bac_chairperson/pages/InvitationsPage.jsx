import { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from '../../../utils/toast';
import {
  CheckCircle, XCircle, Clock, AlertCircle, FileText,
  ChevronDown, ChevronUp, Download, Shield, Eye
} from 'lucide-react';
import InvitationDocumentPreview from '../../../shared/components/InvitationDocumentPreview';

const STATUS_CONFIG = {
  draft: { color: 'bg-gray-100 text-gray-600', label: 'Draft' },
  pending_chairperson_approval: { color: 'bg-orange-100 text-orange-700', label: 'For Your Approval' },
  pending_hope_approval: { color: 'bg-amber-100 text-amber-700', label: 'For HOPE Approval' },
  approved: { color: 'bg-blue-100 text-blue-700', label: 'Approved' },
  posted: { color: 'bg-green-100 text-green-700', label: 'Posted' },
  sent: { color: 'bg-green-100 text-green-700', label: 'Sent (RFQ)' },
  recorded: { color: 'bg-emerald-100 text-emerald-700', label: 'Recorded' },
  closed: { color: 'bg-slate-100 text-slate-700', label: 'Closed' },
};

const MODE_LABELS = {
  competitive_bidding: 'Competitive Bidding',
  small_value_procurement: 'Small Value Procurement',
  shopping_52_1a: 'Shopping (52.1a)',
  shopping_52_1b: 'Shopping (52.1b)',
  limited_source_bidding: 'Limited Source Bidding',
  direct_contracting: 'Direct Contracting',
  negotiated_procurement: 'Negotiated Procurement',
  repeat_order: 'Repeat Order',
  direct_acquisition: 'Direct Acquisition',
  direct_sales: 'Direct Sales',
  sti_procurement: 'STI Procurement',
};

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending_chairperson_approval');
  const [expandedId, setExpandedId] = useState(null);
  const [returnModal, setReturnModal] = useState(null);
  const [returnRemarks, setReturnRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [previewId, setPreviewId] = useState(null);

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      const params = filter ? { status: filter } : {};
      const res = await api.get('/invitations', { params });
      setInvitations(res.data.data || []);
    } catch {
      toast.error('Failed to load invitations.');
    }
    setLoading(false);
  };

  useEffect(() => { fetchInvitations(); }, [filter]);

  const handleApprove = async (id) => {
    if (!confirm('Approve this invitation? It will proceed to posting.')) return;
    setActionLoading(id);
    try {
      await api.post(`/invitations/${id}/approve`);
      toast.success('Invitation approved.');
      fetchInvitations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve.');
    }
    setActionLoading(null);
  };

  const handleReturn = async () => {
    if (!returnModal) return;
    if (returnRemarks.trim().length < 10) {
      toast.error('Remarks must be at least 10 characters.');
      return;
    }
    setActionLoading(returnModal);
    try {
      await api.post(`/invitations/${returnModal}/return`, { remarks: returnRemarks });
      toast.success('Invitation returned to Secretariat.');
      setReturnModal(null);
      setReturnRemarks('');
      fetchInvitations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to return.');
    }
    setActionLoading(null);
  };

  const handleDownloadPdf = (id) => {
    window.open(`${api.defaults.baseURL}/invitations/${id}/pdf`, '_blank');
  };

  const pendingCount = invitations.filter(i => i.status === 'pending_chairperson_approval').length;

  const statusBadge = (status) => {
    const s = status?.toLowerCase();
    const cfg = STATUS_CONFIG[s] || { color: 'bg-gray-100 text-gray-600', label: status };
    return (
      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${cfg.color}`}>
        {cfg.label}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Invitation Approvals</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Review and approve ITBs submitted by the BAC Secretariat.
          </p>
        </div>
        {filter === 'pending_chairperson_approval' && (
          <span className="px-3 py-1.5 text-xs font-bold bg-orange-100 text-orange-700 rounded-full">
            {pendingCount} Pending
          </span>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: 'pending_chairperson_approval', label: 'Pending Approval', icon: Clock },
          { value: 'approved', label: 'Approved', icon: CheckCircle },
          { value: '', label: 'All', icon: FileText },
        ].map(f => {
          const Icon = f.icon;
          return (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition flex items-center gap-1.5 ${
                filter === f.value ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              <Icon className="w-3.5 h-3.5" /> {f.label}
            </button>
          );
        })}
      </div>

      {/* Invitations List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : invitations.length === 0 ? (
          <div className="text-center py-16">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600">No invitations found</h3>
            <p className="text-sm text-gray-400 mt-1">
              {filter === 'pending_chairperson_approval'
                ? 'No invitations are awaiting your approval.'
                : 'No invitations match this filter.'}
            </p>
          </div>
        ) : (
          invitations.map(inv => {
            const isExpanded = expandedId === inv.id;
            const isPending = inv.status === 'pending_chairperson_approval';
            return (
              <div key={inv.id} className={`bg-white rounded-xl border shadow-sm transition ${isPending ? 'border-orange-200' : 'border-gray-200'}`}>
                {/* Row Header */}
                <div className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => setExpandedId(isExpanded ? null : inv.id)}>
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      inv.type === 'itb' ? 'bg-indigo-100 text-indigo-700' : 'bg-teal-100 text-teal-700'
                    }`}>
                      {(inv.type || '').toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{inv.project_title}</p>
                      <p className="text-xs text-gray-400 font-mono">{inv.reference_number}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-sm font-mono font-semibold text-gray-800">
                      ₱{parseFloat(inv.abc || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </span>
                    {statusBadge(inv.status)}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-6 py-5 bg-gray-50/50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-3 text-sm mb-5">
                      <div>
                        <span className="text-gray-500 font-medium">Procurement Mode</span>
                        <p className="text-gray-900 mt-0.5">{MODE_LABELS[inv.procurement_mode] || inv.procurement_mode}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 font-medium">Submission Deadline</span>
                        <p className="text-gray-900 mt-0.5">{inv.submission_deadline ? new Date(inv.submission_deadline).toLocaleString() : '—'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 font-medium">Opening Date</span>
                        <p className="text-gray-900 mt-0.5">{inv.opening_date ? new Date(inv.opening_date).toLocaleString() : '—'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 font-medium">Fund Source</span>
                        <p className="text-gray-900 mt-0.5">{inv.fund_source || '—'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 font-medium">Created By</span>
                        <p className="text-gray-900 mt-0.5">{inv.creator?.name || '—'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 font-medium">Linked PR</span>
                        <p className="text-gray-900 mt-0.5">{inv.purchase_requisition?.pr_reference || '—'}</p>
                      </div>
                      {inv.opening_venue && (
                        <div>
                          <span className="text-gray-500 font-medium">Opening Venue</span>
                          <p className="text-gray-900 mt-0.5">{inv.opening_venue}</p>
                        </div>
                      )}
                      {inv.special_conditions && (
                        <div className="md:col-span-3">
                          <span className="text-gray-500 font-medium">Special Conditions</span>
                          <p className="text-gray-900 mt-0.5">{inv.special_conditions}</p>
                        </div>
                      )}
                      {inv.alternative_mode_justification && (
                        <div className="md:col-span-3">
                          <span className="text-gray-500 font-medium">Alternative Mode Justification</span>
                          <p className="text-gray-900 mt-0.5">{inv.alternative_mode_justification}</p>
                        </div>
                      )}
                    </div>

                    {/* Return remarks (if previously returned) */}
                    {inv.return_remarks && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs font-medium text-red-600 uppercase tracking-wider mb-1">Previous Return Remarks</p>
                        <p className="text-sm text-red-700">{inv.return_remarks}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
                      <button onClick={() => handleDownloadPdf(inv.id)}
                        className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition flex items-center gap-1.5">
                        <Download className="w-3.5 h-3.5" /> Download PDF
                      </button>
                      <button onClick={() => setPreviewId(previewId === inv.id ? null : inv.id)}
                        className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition flex items-center gap-1.5 ${previewId === inv.id ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
                        <Eye className="w-3.5 h-3.5" /> {previewId === inv.id ? 'Hide Preview' : 'Preview Document'}
                      </button>
                      {isPending && (
                        <>
                          <button onClick={() => handleApprove(inv.id)}
                            disabled={actionLoading === inv.id}
                            className="px-4 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition flex items-center gap-1.5 ml-auto">
                            <CheckCircle className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button onClick={() => { setReturnModal(inv.id); setReturnRemarks(''); }}
                            disabled={actionLoading === inv.id}
                            className="px-4 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 transition flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5" /> Return
                          </button>
                        </>
                      )}
                    </div>

                    {/* Document Preview */}
                    {previewId === inv.id && (
                      <InvitationDocumentPreview invitation={inv} />
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Return Modal */}
      {returnModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setReturnModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Return Invitation</h3>
            <p className="text-sm text-gray-500 mb-4">Provide remarks explaining why this invitation is being returned to the Secretariat.</p>
            <textarea
              value={returnRemarks}
              onChange={e => setReturnRemarks(e.target.value)}
              rows={4}
              placeholder="Enter remarks (min. 10 characters)..."
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-[13px] focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none resize-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setReturnModal(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                Cancel
              </button>
              <button onClick={handleReturn}
                disabled={returnRemarks.trim().length < 10 || actionLoading === returnModal}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition">
                {actionLoading === returnModal ? 'Returning…' : 'Return Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
