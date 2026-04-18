import React from 'react';
import { Eye } from 'lucide-react';

const MODE_TEMPLATE_MAP = {
  competitive_bidding: 'itb',
  small_value_procurement: 'rfq',
  shopping_52_1a: 'rfq',
  shopping_52_1b: 'rfq',
  limited_source_bidding: 'limited_source',
  direct_contracting: 'alternative',
  direct_acquisition: 'alternative',
  negotiated_procurement: 'alternative',
  repeat_order: 'alternative',
  direct_sales: 'alternative',
  sti_procurement: 'alternative',
};

const TEMPLATE_LABELS = {
  itb: { label: 'ITB', color: 'bg-indigo-100 text-indigo-700' },
  rfq: { label: 'RFQ', color: 'bg-teal-100 text-teal-700' },
  limited_source: { label: 'Limited Source', color: 'bg-purple-100 text-purple-700' },
  alternative: { label: 'Alt. Mode', color: 'bg-orange-100 text-orange-700' },
};

// Lazy import preview components
import InvitationPreviewITB from '../../roles/bac_secretariat/components/previews/InvitationPreviewITB';
import InvitationPreviewRFQ from '../../roles/bac_secretariat/components/previews/InvitationPreviewRFQ';
import InvitationPreviewAlternative from '../../roles/bac_secretariat/components/previews/InvitationPreviewAlternative';
import InvitationPreviewLimitedSource from '../../roles/bac_secretariat/components/previews/InvitationPreviewLimitedSource';

/**
 * Renders a read-only document preview for an existing invitation.
 * Used by BAC Chairperson, HOPE, and other roles to view the document layout.
 */
export default function InvitationDocumentPreview({ invitation }) {
  if (!invitation) return null;

  const template = MODE_TEMPLATE_MAP[invitation.procurement_mode] || 'itb';
  const info = TEMPLATE_LABELS[template];

  // Map invitation fields to the data format expected by preview components
  const data = {
    project_title: invitation.project_title,
    abc: invitation.abc,
    fund_source: invitation.fund_source,
    procuring_entity: invitation.procuring_entity || 'City Government of ProcureSeal',
    procurement_mode: invitation.procurement_mode,
    bid_document_cost: invitation.bid_document_cost,
    pre_bid_conference_date: invitation.pre_bid_conference_date,
    submission_deadline: invitation.submission_deadline,
    opening_date: invitation.opening_date,
    opening_venue: invitation.opening_venue,
    alternative_mode_justification: invitation.alternative_mode_justification,
    selected_supplier_name: invitation.selected_supplier_name,
    selected_supplier_details: invitation.selected_supplier_details,
    mode_specific_data: invitation.mode_specific_data || {},
    payment_terms: invitation.payment_terms,
    delivery_location: invitation.delivery_location,
  };

  const renderPreview = () => {
    switch (template) {
      case 'itb': return <InvitationPreviewITB data={data} />;
      case 'rfq': return <InvitationPreviewRFQ data={data} />;
      case 'limited_source': return <InvitationPreviewLimitedSource data={data} />;
      case 'alternative': return <InvitationPreviewAlternative data={data} />;
      default: return <InvitationPreviewITB data={data} />;
    }
  };

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-3">
        <Eye className="w-4 h-4 text-gray-500" />
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Document Preview</span>
        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${info.color}`}>
          {info.label}
        </span>
      </div>
      <div className="bg-gray-50 border rounded-xl p-6">
        <div className="bg-white rounded-lg shadow-sm border p-6 max-w-[540px] mx-auto">
          {renderPreview()}
        </div>
      </div>
    </div>
  );
}
