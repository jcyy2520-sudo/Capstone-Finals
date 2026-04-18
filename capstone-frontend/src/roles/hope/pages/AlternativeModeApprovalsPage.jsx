import { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from '../../../utils/toast';
import { ShieldCheck, CheckCircle, XCircle, FileText, Clock, Eye } from 'lucide-react';
import InvitationDocumentPreview from '../../../shared/components/InvitationDocumentPreview';

const MODE_LABELS = {
  direct_contracting: 'Direct Contracting',
  direct_acquisition: 'Direct Acquisition',
  negotiated_procurement: 'Negotiated Procurement',
  repeat_order: 'Repeat Order',
  direct_sales: 'Direct Sales',
  sti_procurement: 'STI Procurement',
  limited_source_bidding: 'Limited Source Bidding',
};

const GROUND_LABELS = {
  two_failed_biddings: 'Two Failed Biddings',
  emergency: 'Emergency',
  take_over: 'Take-Over of Contracts',
  adjacent_adjoining: 'Adjacent / Adjoining',
  agency_to_agency: 'Agency-to-Agency',
  scientific_scholarly: 'Scientific / Scholarly',
  highly_technical: 'Highly Technical',
  gocc_defense: 'GOCC / Defense',
  small_value: 'Small Value (Sec 53.9)',
};

const EXCLUSIVITY_LABELS = {
  sole_distributor: 'Sole Distributor',
  patent_holder: 'Patent Holder',
  proprietary: 'Proprietary',
  critical_component: 'Critical Component',
};

export default function AlternativeModeApprovalsPage() {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending_hope_approval');
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedInv, setSelectedInv] = useState(null);
  const [previewId, setPreviewId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = filter ? { status: filter } : {};
      const res = await api.get('/invitations', { params });
      const items = res.data?.data || res.data || [];
      // Filter to only alternative modes
      const altModes = Object.keys(MODE_LABELS);
      setInvitations(items.filter(i => altModes.includes(i.procurement_mode)));
    } catch {
      toast.error('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filter]);

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this alternative mode procurement? This authorizes the Secretariat to proceed.')) return;
    setActionLoading(id);
    try {
      await api.post(`/invitations/${id}/approve`);
      toast.success('Alternative mode approved');
      setSelectedInv(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Approval failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReturn = async (id) => {
    const remarks = window.prompt('Return remarks (min 10 characters):');
    if (!remarks || remarks.length < 10) { if (remarks !== null) toast.error('Remarks must be at least 10 characters'); return; }
    setActionLoading(id);
    try {
      await api.post(`/invitations/${id}/return`, { remarks });
      toast.success('Invitation returned to Secretariat');
      setSelectedInv(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Return failed');
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = invitations.filter(i => i.status === 'pending_hope_approval').length;

  const filters = [
    { value: 'pending_hope_approval', label: 'Pending My Approval' },
    { value: 'approved', label: 'Approved' },
    { value: 'recorded', label: 'Recorded' },
    { value: '', label: 'All' },
  ];

  const renderModeDetails = (inv) => {
    const msd = inv.mode_specific_data || {};
    return (
      <div className="space-y-2 text-sm">
        {inv.procurement_mode === 'direct_contracting' && msd.exclusivity_basis && (
          <div><span className="font-medium text-gray-600">Exclusivity:</span> {EXCLUSIVITY_LABELS[msd.exclusivity_basis] || msd.exclusivity_basis}</div>
        )}
        {inv.procurement_mode === 'direct_contracting' && msd.exclusivity_proof_description && (
          <div><span className="font-medium text-gray-600">Proof:</span> {msd.exclusivity_proof_description}</div>
        )}
        {inv.procurement_mode === 'repeat_order' && msd.original_contract_id && (
          <div><span className="font-medium text-gray-600">Original Contract:</span> ID #{msd.original_contract_id}
            {msd.same_items_confirmation && <span className="ml-2 text-green-600 text-xs">✓ Same items</span>}
            {msd.price_compliance && <span className="ml-2 text-green-600 text-xs">✓ Price OK</span>}
          </div>
        )}
        {inv.procurement_mode === 'negotiated_procurement' && msd.negotiation_ground && (
          <div><span className="font-medium text-gray-600">Ground:</span> {GROUND_LABELS[msd.negotiation_ground] || msd.negotiation_ground}</div>
        )}
        {msd.negotiation_ground === 'two_failed_biddings' && msd.failed_bidding_references && (
          <div><span className="font-medium text-gray-600">Failed refs:</span> {msd.failed_bidding_references.join(', ')}</div>
        )}
        {msd.negotiation_ground === 'emergency' && msd.emergency_declaration_reference && (
          <div><span className="font-medium text-gray-600">Emergency ref:</span> {msd.emergency_declaration_reference}</div>
        )}
        {inv.procurement_mode === 'limited_source_bidding' && msd.shortlisted_suppliers && (
          <div><span className="font-medium text-gray-600">Shortlist:</span> {msd.shortlisted_suppliers.join(', ')}</div>
        )}
        {inv.procurement_mode === 'direct_sales' && msd.selling_agency && (
          <div><span className="font-medium text-gray-600">Selling Agency:</span> {msd.selling_agency}</div>
        )}
        {inv.procurement_mode === 'sti_procurement' && msd.sti_classification && (
          <div><span className="font-medium text-gray-600">STI Class:</span> {msd.sti_classification.replace(/_/g, ' ')}</div>
        )}
        {inv.procurement_mode === 'sti_procurement' && msd.technical_endorsement_by && (
          <div><span className="font-medium text-gray-600">Endorsed by:</span> {msd.technical_endorsement_by}</div>
        )}
        {inv.procurement_mode === 'direct_acquisition' && msd.supplier_quotation_date && (
          <div><span className="font-medium text-gray-600">Quotation date:</span> {new Date(msd.supplier_quotation_date).toLocaleDateString()}</div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" /></div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Alternative Mode Approvals</h1>
        <p className="text-sm text-gray-500 mt-0.5">Review and approve alternative procurement mode justifications.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-violet-600">Pending Approval</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-emerald-600">Total Shown</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">{invitations.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {filters.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${filter === f.value ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-4">
        {invitations.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
            <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-lg font-medium text-gray-900 mb-1">No alternative mode requests</p>
            <p className="text-sm">{filter === 'pending_hope_approval' ? 'All caught up — no pending approvals.' : 'No invitations match this filter.'}</p>
          </div>
        ) : (
          invitations.map(inv => (
            <div key={inv.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${inv.status === 'pending_hope_approval' ? 'bg-violet-100 text-violet-700' : inv.status === 'approved' ? 'bg-green-100 text-green-700' : inv.status === 'recorded' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                        {inv.status === 'pending_hope_approval' ? 'Pending' : inv.status}
                      </span>
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 uppercase tracking-wider">
                        {MODE_LABELS[inv.procurement_mode] || inv.procurement_mode}
                      </span>
                      <span className="text-sm font-mono text-gray-400">{inv.reference_number}</span>
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">{inv.project_title}</h3>
                    <p className="text-sm text-gray-500 mt-1">ABC: ₱{Number(inv.abc).toLocaleString()} • {inv.procurement_mode && (MODE_LABELS[inv.procurement_mode] || inv.procurement_mode)}</p>
                    {inv.selected_supplier_name && (
                      <p className="text-sm text-gray-600 mt-1">Supplier: <span className="font-medium">{inv.selected_supplier_name}</span></p>
                    )}
                  </div>
                  {inv.status === 'pending_hope_approval' && (
                    <div className="flex gap-2 shrink-0 ml-4">
                      <button onClick={() => handleApprove(inv.id)} disabled={actionLoading === inv.id} className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-md text-[13px] font-medium hover:bg-green-700 disabled:opacity-50 transition">
                        <CheckCircle className="w-4 h-4" /> Approve
                      </button>
                      <button onClick={() => handleReturn(inv.id)} disabled={actionLoading === inv.id} className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-md text-[13px] font-medium hover:bg-red-700 disabled:opacity-50 transition">
                        <XCircle className="w-4 h-4" /> Return
                      </button>
                    </div>
                  )}
                </div>

                {/* Justification */}
                {inv.alternative_mode_justification && (
                  <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Justification</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{inv.alternative_mode_justification}</p>
                  </div>
                )}

                {/* Mode-specific details */}
                {inv.mode_specific_data && Object.keys(inv.mode_specific_data).length > 0 && (
                  <div className="mt-3 bg-orange-50 rounded-lg p-4 border border-orange-100">
                    <p className="text-xs font-medium text-orange-600 uppercase tracking-wider mb-2">Mode-Specific Data</p>
                    {renderModeDetails(inv)}
                  </div>
                )}

                {/* Return remarks if any */}
                {inv.return_remarks && (
                  <div className="mt-3 bg-red-50 rounded-lg p-3 border border-red-100">
                    <p className="text-xs font-medium text-red-600 uppercase tracking-wider mb-1">Return Remarks</p>
                    <p className="text-sm text-red-700">{inv.return_remarks}</p>
                  </div>
                )}

                {/* Preview Toggle */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <button onClick={() => setPreviewId(previewId === inv.id ? null : inv.id)}
                    className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition flex items-center gap-1.5 ${previewId === inv.id ? 'bg-violet-50 text-violet-600 border-violet-200' : 'text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
                    <Eye className="w-3.5 h-3.5" /> {previewId === inv.id ? 'Hide Preview' : 'Preview Document'}
                  </button>
                  {previewId === inv.id && (
                    <InvitationDocumentPreview invitation={inv} />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
