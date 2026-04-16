@extends('pdf.layouts.invitation', ['title' => 'Invitation to Bid'])

@section('content')
    <div class="doc-title">Invitation to Bid</div>

    <p style="text-align: center; font-weight: bold; margin-bottom: 30px;">
        Project: {{ $invitation->project_title }} <br>
        Reference No.: {{ $invitation->reference_number }}
    </p>

    <div class="content">
        <p>1. The <strong>{{ $invitation->procuring_entity }}</strong>, through the {{ $invitation->fund_source }}, intends to apply the sum of <strong>{{ number_format($invitation->abc, 2) }}</strong> being the Approved Budget for the Contract (ABC) to payments under the contract for <em>{{ $invitation->project_title }}</em>. Bids received in excess of the ABC shall be automatically rejected at bid opening.</p>

        <p>2. The <strong>{{ $invitation->procuring_entity }}</strong> now invites bids for the above Procurement Project. Delivery of the Goods/Works is required by {{ $invitation->delivery_schedule ?? 'as specified in the Section VI. Schedule of Requirements' }}. Bidders should have completed, within {{ $invitation->eligibility_period ?? 'five (5) years' }} from the date of submission and receipt of bids, a contract similar to the Project.</p>

        <p>3. Bidding will be conducted through open competitive bidding procedures using a non-discretionary "pass/fail" criterion as specified in the 2016 Revised Implementing Rules and Regulations (IRR) of Republic Act (RA) No. 9184.</p>

        <p>4. Bidding is restricted to Filipino citizens/sole proprietorships, partnerships, or organizations with at least sixty percent (60%) interest or outstanding capital stock belonging to citizens of the Philippines, and to citizens or organizations of a country the laws or regulations of which grant similar rights or privileges to Filipino citizens, pursuant to RA No. 5183.</p>

        <p>5. A complete set of Bidding Documents may be acquired by interested Bidders on {{ $invitation->created_at->format('M d, Y') }} from the given address and website(s) below and upon payment of the applicable fee for the Bidding Documents, pursuant to the latest Guidelines issued by the GPPB, in the amount of <strong>{{ number_format($invitation->bid_document_cost, 2) }}</strong>.</p>

        <p>6. The <strong>{{ $invitation->procuring_entity }}</strong> will hold a Pre-Bid Conference on <strong>{{ $invitation->pre_bid_conference_date ? $invitation->pre_bid_conference_date->format('M d, Y') : 'N/A' }}</strong> at {{ $invitation->opening_venue }}, which shall be open to prospective bidders.</p>

        <p>7. Bids must be duly received by the BAC Secretariat through manual submission at the office address indicated below on or before <strong>{{ $invitation->submission_deadline->format('M d, Y h:i A') }}</strong>. Late bids shall not be accepted.</p>

        <p>8. All Bids must be accompanied by a bid security in any of the acceptable forms and in the amount stated in ITB Clause 14.</p>

        <p>9. Bid opening shall be on <strong>{{ $invitation->opening_date->format('M d, Y h:i A') }}</strong> at the given address below. Bids will be opened in the presence of the bidders' representatives who choose to attend the activity.</p>
    </div>
@endsection

@section('signatures')
    <div class="signature-box" style="float: right;">
        <div class="signature-line"></div>
        <div class="signature-name">{{ $invitation->approver ? $invitation->approver->name : 'NAME OF BAC CHAIRPERSON' }}</div>
        <div class="signature-title">Chairperson, Bids and Awards Committee</div>
    </div>
    <div class="clearfix"></div>
@endsection
