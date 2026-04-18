import React from 'react';

const MODE_LABELS = {
  small_value_procurement: 'Small Value Procurement',
  shopping_52_1a: 'Shopping (Sec. 52.1a)',
  shopping_52_1b: 'Shopping (Sec. 52.1b)',
};

export default function InvitationPreviewRFQ({ data }) {
  const abc = parseFloat(data.abc) || 0;
  const today = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  const modeLabel = MODE_LABELS[data.procurement_mode] || 'Request for Quotation';

  return (
    <div className="bg-white text-gray-900 font-serif text-[11px] leading-relaxed">
      {/* Header */}
      <div className="text-center mb-6 border-b pb-4">
        <p className="text-[10px] tracking-widest uppercase text-gray-500">Republic of the Philippines</p>
        <p className="font-bold text-sm mt-1">{data.procuring_entity || 'City Government of ProcureSeal'}</p>
        <p className="text-[10px] text-gray-500">Procurement Management Office</p>
      </div>

      {/* Title */}
      <h1 className="text-center font-bold text-base uppercase underline mb-1">Request for Quotation</h1>
      <p className="text-center text-[10px] text-gray-500 mb-1 font-sans font-medium">
        Mode: {modeLabel}
      </p>
      <p className="text-center font-semibold text-xs mb-6">
        Project: {data.project_title || <span className="text-gray-300 italic">[ Project Title ]</span>}
        <br />
        Reference No.: <span className="font-mono text-gray-500">RFQ-{new Date().getFullYear()}-XXXX</span>
      </p>

      {/* Body */}
      <div className="space-y-3 text-justify px-1">
        <p>
          Sir / Madam,
        </p>

        <p>
          The <strong>{data.procuring_entity || 'City Government of ProcureSeal'}</strong> through{' '}
          <strong>{modeLabel}</strong> under {data.procurement_mode === 'small_value_procurement' ? 'Section 53.9' : 'Section 52.1'} of 
          the 2016 Revised IRR of RA 9184 invites you to submit your lowest price quotation for the item/s described below, 
          subject to the Terms and Conditions stated herein.
        </p>

        {/* Items Table Placeholder */}
        <div className="border rounded-lg overflow-hidden my-4">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-3 py-2 text-left font-medium border-b">Item No.</th>
                <th className="px-3 py-2 text-left font-medium border-b">Description</th>
                <th className="px-3 py-2 text-center font-medium border-b">Qty</th>
                <th className="px-3 py-2 text-center font-medium border-b">Unit</th>
                <th className="px-3 py-2 text-right font-medium border-b">Unit Cost</th>
                <th className="px-3 py-2 text-right font-medium border-b">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-3 py-2 border-b text-gray-400">1</td>
                <td className="px-3 py-2 border-b text-gray-400 italic">[ Auto-populated from PR line items ]</td>
                <td className="px-3 py-2 border-b text-center text-gray-400">—</td>
                <td className="px-3 py-2 border-b text-center text-gray-400">—</td>
                <td className="px-3 py-2 border-b text-right text-gray-400">—</td>
                <td className="px-3 py-2 border-b text-right text-gray-400">—</td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold">
                <td colSpan={5} className="px-3 py-2 text-right">Approved Budget (ABC):</td>
                <td className="px-3 py-2 text-right">₱{abc.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 border space-y-1.5 text-[10px]">
          <p className="font-bold text-gray-700 uppercase text-[9px] tracking-wider">Terms & Conditions</p>
          <p><strong>Fund Source:</strong> {data.fund_source || <span className="text-gray-300 italic">[ Fund Source ]</span>}</p>
          <p><strong>Payment Terms:</strong> {data.payment_terms === '30_days' ? 'Within thirty (30) days upon completion of delivery' : (data.payment_terms || '30 days')}</p>
          <p><strong>Delivery Location:</strong> {data.delivery_location || 'As specified in the Purchase Request'}</p>
          <p><strong>Submission Deadline:</strong>{' '}
            {data.submission_deadline
              ? new Date(data.submission_deadline).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
              : <span className="bg-yellow-100 px-1 italic">[ Deadline ]</span>}
          </p>
        </div>

        <p className="mt-4">
          After having carefully read and accepted your General Conditions, I/we quote you on the item/s at prices noted above.
        </p>
      </div>

      {/* Dual Signature */}
      <div className="mt-10 grid grid-cols-2 gap-8">
        <div className="text-center">
          <div className="border-b border-gray-900 w-40 mx-auto mb-1 mt-10"></div>
          <p className="font-bold text-xs uppercase">SUPPLIER NAME</p>
          <p className="text-[10px] text-gray-600">Authorized Representative</p>
        </div>
        <div className="text-center">
          <div className="border-b border-gray-900 w-40 mx-auto mb-1 mt-10"></div>
          <p className="font-bold text-xs uppercase">NAME OF BAC CHAIRPERSON</p>
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
