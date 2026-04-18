import React from 'react';

const MODE_LABELS = {
  direct_contracting: { name: 'Direct Contracting', section: 'Sec. 50, IRR of RA 9184' },
  direct_acquisition: { name: 'Direct Acquisition', section: 'Sec. 52.1(b), IRR of RA 9184' },
  negotiated_procurement: { name: 'Negotiated Procurement', section: 'Sec. 53, IRR of RA 9184' },
  repeat_order: { name: 'Repeat Order', section: 'Sec. 51, IRR of RA 9184' },
  direct_sales: { name: 'Direct Sales', section: 'RA 9184 Alternative Mode' },
  sti_procurement: { name: 'Direct Procurement for STI', section: 'RA 11293 & RA 9184' },
};

const EXCLUSIVITY_LABELS = {
  sole_distributor: 'Sole Distributor / Dealer',
  patent_holder: 'Patent / Copyright Holder',
  proprietary: 'Proprietary Nature',
  critical_component: 'Critical Component Compatibility',
};

const GROUND_LABELS = {
  two_failed_biddings: 'Two Failed Biddings (Sec. 53.1)',
  emergency: 'Emergency Cases (Sec. 53.2)',
  take_over: 'Take-Over of Contracts (Sec. 53.3)',
  adjacent_adjoining: 'Adjacent / Adjoining Lots (Sec. 53.4)',
  agency_to_agency: 'Agency-to-Agency (Sec. 53.5)',
  scientific_scholarly: 'Scientific / Scholarly / Artistic (Sec. 53.6)',
  highly_technical: 'Highly Technical Consultants (Sec. 53.7)',
  gocc_defense: 'GOCC / Defense Cooperation (Sec. 53.8)',
  small_value: 'Small Value Procurement (Sec. 53.9)',
};

export default function InvitationPreviewAlternative({ data }) {
  const abc = parseFloat(data.abc) || 0;
  const today = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  const modeInfo = MODE_LABELS[data.procurement_mode] || { name: 'Alternative Mode', section: 'RA 9184' };
  const msd = data.mode_specific_data || {};

  return (
    <div className="bg-white text-gray-900 font-serif text-[11px] leading-relaxed">
      {/* Header */}
      <div className="text-center mb-6 border-b pb-4">
        <p className="text-[10px] tracking-widest uppercase text-gray-500">Republic of the Philippines</p>
        <p className="font-bold text-sm mt-1">{data.procuring_entity || 'City Government of ProcureSeal'}</p>
        <p className="text-[10px] text-gray-500">Procurement Management Office</p>
      </div>

      {/* Title */}
      <h1 className="text-center font-bold text-base uppercase underline mb-1">
        Notice of {modeInfo.name}
      </h1>
      <p className="text-center text-[10px] text-gray-500 mb-1 font-sans font-medium">
        Pursuant to {modeInfo.section}
      </p>
      <p className="text-center font-semibold text-xs mb-6">
        Project: {data.project_title || <span className="text-gray-300 italic">[ Project Title ]</span>}
      </p>

      {/* Body */}
      <div className="space-y-3 text-justify px-1">
        <p>
          The <strong>{data.procuring_entity || 'City Government of ProcureSeal'}</strong>, through the{' '}
          {data.fund_source || <span className="bg-yellow-100 px-1 italic">[ Fund Source ]</span>}, intends to procure{' '}
          <em>{data.project_title || '[ Project Title ]'}</em> with an Approved Budget for the Contract (ABC) of{' '}
          <strong>₱{abc.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong>{' '}
          through <strong>{modeInfo.name}</strong> pursuant to {modeInfo.section}.
        </p>

        {/* Justification Section */}
        <div className="bg-gray-50 rounded-lg p-3 border my-4">
          <p className="font-bold text-[10px] uppercase tracking-wider text-gray-600 mb-2">
            Justification for {modeInfo.name}
          </p>
          <p className="text-[11px] whitespace-pre-wrap">
            {data.alternative_mode_justification || <span className="text-gray-300 italic">[ Justification will appear here as you type... ]</span>}
          </p>
        </div>

        {/* Mode-Specific Sections */}
        {data.procurement_mode === 'direct_contracting' && (
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 my-3">
            <p className="font-bold text-[10px] uppercase tracking-wider text-blue-700 mb-2">Exclusivity Details</p>
            <table className="w-full text-[10px]">
              <tbody>
                <tr><td className="py-1 font-medium text-gray-600 w-36">Exclusive Supplier:</td><td>{data.selected_supplier_name || <span className="text-gray-300 italic">[ Not specified ]</span>}</td></tr>
                <tr><td className="py-1 font-medium text-gray-600">Basis of Exclusivity:</td><td>{EXCLUSIVITY_LABELS[msd.exclusivity_basis] || <span className="text-gray-300 italic">[ Select basis ]</span>}</td></tr>
                {msd.exclusivity_proof_description && (
                  <tr><td className="py-1 font-medium text-gray-600">Proof Document:</td><td>{msd.exclusivity_proof_description}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {data.procurement_mode === 'repeat_order' && (
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 my-3">
            <p className="font-bold text-[10px] uppercase tracking-wider text-blue-700 mb-2">Repeat Order Details</p>
            <table className="w-full text-[10px]">
              <tbody>
                <tr><td className="py-1 font-medium text-gray-600 w-36">Original Supplier:</td><td>{data.selected_supplier_name || <span className="text-gray-300 italic">[ Not specified ]</span>}</td></tr>
                <tr><td className="py-1 font-medium text-gray-600">Original Contract ID:</td><td>{msd.original_contract_id || <span className="text-gray-300 italic">[ Not specified ]</span>}</td></tr>
                <tr><td className="py-1 font-medium text-gray-600">Same Items:</td><td>{msd.same_items_confirmation ? '✓ Confirmed' : '—'}</td></tr>
                <tr><td className="py-1 font-medium text-gray-600">Price Compliance:</td><td>{msd.price_compliance ? '✓ Same or lower price' : '—'}</td></tr>
              </tbody>
            </table>
          </div>
        )}

        {data.procurement_mode === 'negotiated_procurement' && (
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 my-3">
            <p className="font-bold text-[10px] uppercase tracking-wider text-blue-700 mb-2">Negotiation Details</p>
            <table className="w-full text-[10px]">
              <tbody>
                <tr><td className="py-1 font-medium text-gray-600 w-36">Ground:</td><td>{GROUND_LABELS[msd.negotiation_ground] || <span className="text-gray-300 italic">[ Select ground ]</span>}</td></tr>
                <tr><td className="py-1 font-medium text-gray-600">Target Supplier:</td><td>{data.selected_supplier_name || <span className="text-gray-300 italic">[ Not specified ]</span>}</td></tr>
                {msd.negotiation_ground === 'two_failed_biddings' && msd.failed_bidding_references && (
                  <tr><td className="py-1 font-medium text-gray-600">Failed Bidding Refs:</td><td>{msd.failed_bidding_references.filter(Boolean).join(', ') || '—'}</td></tr>
                )}
                {msd.negotiation_ground === 'emergency' && msd.emergency_declaration_reference && (
                  <tr><td className="py-1 font-medium text-gray-600">Emergency Ref:</td><td>{msd.emergency_declaration_reference}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {data.procurement_mode === 'direct_acquisition' && (
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 my-3">
            <p className="font-bold text-[10px] uppercase tracking-wider text-blue-700 mb-2">Direct Acquisition Details</p>
            <table className="w-full text-[10px]">
              <tbody>
                <tr><td className="py-1 font-medium text-gray-600 w-36">Supplier:</td><td>{data.selected_supplier_name || <span className="text-gray-300 italic">[ Not specified ]</span>}</td></tr>
                {msd.supplier_quotation_date && (
                  <tr><td className="py-1 font-medium text-gray-600">Quotation Date:</td><td>{new Date(msd.supplier_quotation_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
                )}
                <tr><td className="py-1 font-medium text-gray-600">ABC Limit:</td><td>₱200,000.00 (Sec. 52.1b)</td></tr>
              </tbody>
            </table>
          </div>
        )}

        {data.procurement_mode === 'direct_sales' && (
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 my-3">
            <p className="font-bold text-[10px] uppercase tracking-wider text-blue-700 mb-2">Direct Sales Details</p>
            <table className="w-full text-[10px]">
              <tbody>
                <tr><td className="py-1 font-medium text-gray-600 w-36">Selling Agency:</td><td>{msd.selling_agency || <span className="text-gray-300 italic">[ Not specified ]</span>}</td></tr>
                {msd.price_comparison_basis && (
                  <tr><td className="py-1 font-medium text-gray-600">Price Comparison:</td><td>{msd.price_comparison_basis}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {data.procurement_mode === 'sti_procurement' && (
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 my-3">
            <p className="font-bold text-[10px] uppercase tracking-wider text-blue-700 mb-2">STI Procurement Details</p>
            <table className="w-full text-[10px]">
              <tbody>
                <tr><td className="py-1 font-medium text-gray-600 w-36">Supplier:</td><td>{data.selected_supplier_name || <span className="text-gray-300 italic">[ Not specified ]</span>}</td></tr>
                <tr><td className="py-1 font-medium text-gray-600">STI Classification:</td><td>{(msd.sti_classification || '').replace(/_/g, ' ') || <span className="text-gray-300 italic">[ Select classification ]</span>}</td></tr>
                {msd.technical_endorsement_by && (
                  <tr><td className="py-1 font-medium text-gray-600">Endorsed By:</td><td>{msd.technical_endorsement_by}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Approval Routing */}
        <div className="bg-amber-50 rounded-lg p-3 border border-amber-200 mt-4">
          <p className="font-bold text-[10px] uppercase tracking-wider text-amber-700 mb-1">Approval Routing</p>
          <p className="text-[10px] text-amber-800">
            This procurement requires approval from the <strong>Head of the Procuring Entity (HOPE)</strong> before 
            the BAC Secretariat may proceed with recording/posting.
          </p>
        </div>

        {/* Timeline Section */}
        {(data.submission_deadline || data.opening_date) && (
          <div className="mt-4 bg-gray-50 rounded-lg p-3 border">
            <p className="font-bold text-[10px] uppercase tracking-wider text-gray-600 mb-2">Schedule</p>
            <table className="w-full text-[10px]">
              <tbody>
                {data.submission_deadline && (
                  <tr><td className="py-1 font-medium text-gray-600 w-36">Submission Deadline:</td>
                  <td>{new Date(data.submission_deadline).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
                )}
                {data.opening_date && (
                  <tr><td className="py-1 font-medium text-gray-600">Opening Date:</td>
                  <td>{new Date(data.opening_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
                )}
                {data.opening_venue && (
                  <tr><td className="py-1 font-medium text-gray-600">Venue:</td><td>{data.opening_venue}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Signature */}
      <div className="mt-10 grid grid-cols-2 gap-8">
        <div className="text-center">
          <div className="border-b border-gray-900 w-40 mx-auto mb-1 mt-10"></div>
          <p className="font-bold text-xs uppercase">HOPE NAME</p>
          <p className="text-[10px] text-gray-600">Head of the Procuring Entity</p>
        </div>
        <div className="text-center">
          <div className="border-b border-gray-900 w-40 mx-auto mb-1 mt-10"></div>
          <p className="font-bold text-xs uppercase">BAC CHAIRPERSON</p>
          <p className="text-[10px] text-gray-600">Chairperson, BAC</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-3 border-t text-[9px] text-gray-400 text-center">
        ProcureSeal Audit Trail &bull; Generated: {today}
      </div>
    </div>
  );
}
