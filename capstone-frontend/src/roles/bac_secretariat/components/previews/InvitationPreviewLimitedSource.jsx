import React from 'react';

export default function InvitationPreviewLimitedSource({ data }) {
  const abc = parseFloat(data.abc) || 0;
  const today = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  const msd = data.mode_specific_data || {};
  const suppliers = msd.shortlisted_suppliers || [];

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
        Invitation to Bid — Limited Source
      </h1>
      <p className="text-center text-[10px] text-gray-500 mb-1 font-sans font-medium">
        Pursuant to Sec. 49, IRR of RA 9184
      </p>
      <p className="text-center font-semibold text-xs mb-6">
        Project: {data.project_title || <span className="text-gray-300 italic">[ Project Title ]</span>}
      </p>

      {/* Body */}
      <div className="space-y-3 text-justify px-1">
        <p>
          The <strong>{data.procuring_entity || 'City Government of ProcureSeal'}</strong>, through the{' '}
          {data.fund_source || <span className="bg-yellow-100 px-1 italic">[ Fund Source ]</span>}, intends to apply the sum of{' '}
          <strong>₱{abc.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong>{' '}
          being the Approved Budget for the Contract (ABC) to payments under the contract for{' '}
          <em>{data.project_title || '[ Project Title ]'}</em>.
        </p>

        <p>
          Considering that the goods/services are highly specialized or proprietary in nature, the procurement shall be conducted 
          through <strong>Limited Source Bidding</strong> under Section 49 of the 2016 Revised IRR of RA 9184. 
          Only pre-selected suppliers/bidders known to have the technical capability and capacity are invited.
        </p>

        {/* Justification */}
        <div className="bg-gray-50 rounded-lg p-3 border my-4">
          <p className="font-bold text-[10px] uppercase tracking-wider text-gray-600 mb-2">
            Justification for Limited Source
          </p>
          <p className="text-[11px] whitespace-pre-wrap">
            {data.alternative_mode_justification || <span className="text-gray-300 italic">[ Justification will appear here as you type... ]</span>}
          </p>
        </div>

        {/* Shortlist Justification */}
        {msd.shortlist_justification && (
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 my-3">
            <p className="font-bold text-[10px] uppercase tracking-wider text-blue-700 mb-2">Shortlist Justification</p>
            <p className="text-[11px]">{msd.shortlist_justification}</p>
          </div>
        )}

        {/* Shortlisted Suppliers Table */}
        <div className="border rounded-lg overflow-hidden my-4">
          <p className="px-3 py-2 bg-gray-100 font-bold text-[10px] uppercase tracking-wider text-gray-600 border-b">
            Pre-Selected Bidders
          </p>
          <table className="w-full text-[10px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 py-2 text-left font-medium border-b w-12">#</th>
                <th className="px-3 py-2 text-left font-medium border-b">Supplier Name</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.length > 0 ? suppliers.map((s, i) => (
                <tr key={i}>
                  <td className="px-3 py-2 border-b">{i + 1}</td>
                  <td className="px-3 py-2 border-b">{s}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={2} className="px-3 py-3 text-center text-gray-300 italic">[ Enter shortlisted suppliers in the form ]</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p>
          Bidding will be conducted through Limited Source Bidding procedures as specified in the 2016 Revised IRR of RA 9184. 
          Only the above pre-selected bidders may participate.
        </p>

        <p>
          Bids must be duly received by the BAC Secretariat on or before{' '}
          <strong>{data.submission_deadline ? new Date(data.submission_deadline).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : <span className="bg-yellow-100 px-1 italic">[ Deadline ]</span>}</strong>. 
          Late bids shall not be accepted.
        </p>

        <p>
          Bid opening shall be on{' '}
          <strong>{data.opening_date ? new Date(data.opening_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : <span className="bg-yellow-100 px-1 italic">[ Opening Date ]</span>}</strong>{' '}
          at {data.opening_venue || '[ Venue ]'}.
        </p>

        {/* Approval Routing */}
        <div className="bg-amber-50 rounded-lg p-3 border border-amber-200 mt-4">
          <p className="font-bold text-[10px] uppercase tracking-wider text-amber-700 mb-1">Approval Routing</p>
          <p className="text-[10px] text-amber-800">
            This procurement requires prior approval from the <strong>Head of the Procuring Entity (HOPE)</strong> before 
            the invitations are sent to the pre-selected bidders.
          </p>
        </div>
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
