import React from 'react';

export default function InvitationPreviewITB({ data }) {
  const abc = parseFloat(data.abc) || 0;
  const today = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="bg-white text-gray-900 font-serif text-[11px] leading-relaxed">
      {/* Header */}
      <div className="text-center mb-6 border-b pb-4">
        <p className="text-[10px] tracking-widest uppercase text-gray-500">Republic of the Philippines</p>
        <p className="font-bold text-sm mt-1">{data.procuring_entity || 'City Government of ProcureSeal'}</p>
        <p className="text-[10px] text-gray-500">Procurement Management Office</p>
      </div>

      {/* Title */}
      <h1 className="text-center font-bold text-base uppercase underline mb-1">Invitation to Bid</h1>
      <p className="text-center font-semibold text-xs mb-6">
        Project: {data.project_title || <span className="text-gray-300 italic">[ Project Title ]</span>}
        <br />
        Reference No.: <span className="font-mono text-gray-500">ITB-{new Date().getFullYear()}-XXXX</span>
      </p>

      {/* Body Clauses */}
      <div className="space-y-3 text-justify px-1">
        <p>
          1. The <strong>{data.procuring_entity || 'City Government of ProcureSeal'}</strong>, through the{' '}
          {data.fund_source || <span className="bg-yellow-100 px-1 italic">[ Fund Source ]</span>}, intends to apply the sum of{' '}
          <strong>₱{abc.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong> being the Approved Budget for the Contract (ABC) 
          to payments under the contract for <em>{data.project_title || '[ Project Title ]'}</em>. 
          Bids received in excess of the ABC shall be automatically rejected at bid opening.
        </p>

        <p>
          2. The <strong>{data.procuring_entity || 'City Government of ProcureSeal'}</strong> now invites bids for the above 
          Procurement Project. Delivery of the Goods/Works is required as specified in the Section VI. Schedule of Requirements. 
          Bidders should have completed, within five (5) years from the date of submission and receipt of bids, a contract similar to the Project.
        </p>

        <p>
          3. Bidding will be conducted through open competitive bidding procedures using a non-discretionary 
          &ldquo;pass/fail&rdquo; criterion as specified in the 2016 Revised Implementing Rules and Regulations (IRR) of 
          Republic Act (RA) No. 9184.
        </p>

        <p>
          4. Bidding is restricted to Filipino citizens/sole proprietorships, partnerships, or organizations with at least 
          sixty percent (60%) interest or outstanding capital stock belonging to citizens of the Philippines, pursuant to RA No. 5183.
        </p>

        <p>
          5. A complete set of Bidding Documents may be acquired by interested Bidders on {today} from the given address and 
          website(s) below and upon payment of the applicable fee for the Bidding Documents, in the amount of{' '}
          <strong>₱{(parseFloat(data.bid_document_cost) || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong>.
        </p>

        <p>
          6. The <strong>{data.procuring_entity || 'City Government of ProcureSeal'}</strong> will hold a Pre-Bid Conference on{' '}
          <strong>{data.pre_bid_conference_date ? new Date(data.pre_bid_conference_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</strong>{' '}
          at {data.opening_venue || '[ Venue ]'}, which shall be open to prospective bidders.
        </p>

        <p>
          7. Bids must be duly received by the BAC Secretariat through manual submission at the office address indicated below on or before{' '}
          <strong>{data.submission_deadline ? new Date(data.submission_deadline).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : <span className="bg-yellow-100 px-1 italic">[ Deadline ]</span>}</strong>. 
          Late bids shall not be accepted.
        </p>

        <p>
          8. All Bids must be accompanied by a bid security in any of the acceptable forms and in the amount stated in ITB Clause 14.
        </p>

        <p>
          9. Bid opening shall be on{' '}
          <strong>{data.opening_date ? new Date(data.opening_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : <span className="bg-yellow-100 px-1 italic">[ Opening Date ]</span>}</strong>{' '}
          at {data.opening_venue || '[ Venue ]'}. Bids will be opened in the presence of the bidders&apos; representatives who choose to attend the activity.
        </p>
      </div>

      {/* Signature */}
      <div className="mt-12 text-right pr-8">
        <div className="inline-block text-center">
          <div className="border-b border-gray-900 w-48 mb-1 mt-10"></div>
          <p className="font-bold text-xs uppercase">NAME OF BAC CHAIRPERSON</p>
          <p className="text-[10px] text-gray-600">Chairperson, Bids and Awards Committee</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-3 border-t text-[9px] text-gray-400 text-center">
        ProcureSeal Audit Trail &bull; Generated: {today}
      </div>
    </div>
  );
}
