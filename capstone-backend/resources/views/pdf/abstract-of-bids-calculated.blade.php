<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Abstract of Bids As Calculated</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 11pt; color: #333; line-height: 1.4; }
        .header { text-align: center; margin-bottom: 15px; }
        .header .agency { font-weight: bold; font-size: 13pt; display: block; }
        .header .address { font-size: 9pt; }
        .doc-title { text-align: center; text-transform: uppercase; font-weight: bold; font-size: 14pt; margin: 15px 0; text-decoration: underline; }
        .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        .meta-table td { padding: 4px 6px; vertical-align: top; }
        .meta-label { font-weight: bold; width: 180px; }
        table.bids { width: 100%; border-collapse: collapse; margin-top: 10px; }
        table.bids th, table.bids td { border: 1px solid #333; padding: 6px 8px; text-align: left; font-size: 10pt; }
        table.bids th { background-color: #e8e8e8; font-weight: bold; text-align: center; }
        table.bids td.amount { text-align: right; }
        table.bids td.center { text-align: center; }
        .section-title { font-weight: bold; font-size: 12pt; margin-top: 20px; margin-bottom: 8px; text-decoration: underline; }
        .responsive { color: #16a34a; font-weight: bold; }
        .non-responsive { color: #dc2626; font-weight: bold; }
        .signature-section { margin-top: 40px; }
        .signature-box { display: inline-block; width: 45%; vertical-align: top; }
        .signature-line { border-bottom: 1px solid #000; margin-top: 40px; margin-bottom: 4px; }
        .signature-name { font-weight: bold; text-transform: uppercase; }
        .signature-title { font-size: 9pt; }
        .footer { position: fixed; bottom: 0; width: 100%; font-size: 8pt; border-top: 1px solid #ccc; padding-top: 4px; text-align: center; }
        .note { font-size: 9pt; font-style: italic; margin-top: 8px; }
    </style>
</head>
<body>
    <div class="header">
        <span class="agency">BIDS AND AWARDS COMMITTEE</span>
        <span class="address">ProcureSeal Procurement Management System</span>
    </div>

    <div class="doc-title">Abstract of Bids As Calculated</div>

    <table class="meta-table">
        <tr>
            <td class="meta-label">Session Reference:</td>
            <td>{{ $bidOpening->session_reference }}</td>
            <td class="meta-label">Date of Opening:</td>
            <td>{{ $bidOpening->session_date ? $bidOpening->session_date->format('F d, Y h:i A') : '—' }}</td>
        </tr>
        <tr>
            <td class="meta-label">Invitation Reference:</td>
            <td>{{ $invitation->reference_number }}</td>
            <td class="meta-label">Procurement Mode:</td>
            <td>{{ str_replace('_', ' ', ucwords($invitation->procurement_mode, '_')) }}</td>
        </tr>
        <tr>
            <td class="meta-label">Project Title:</td>
            <td colspan="3">{{ $invitation->project_title }}</td>
        </tr>
        <tr>
            <td class="meta-label">Approved Budget (ABC):</td>
            <td colspan="3">₱{{ number_format($invitation->abc, 2) }}</td>
        </tr>
    </table>

    <div class="section-title">Ranked Bidders — As Calculated</div>

    <table class="bids">
        <thead>
            <tr>
                <th style="width: 60px;">Rank</th>
                <th>Bidder / Supplier</th>
                <th style="width: 140px;">Bid As Read (₱)</th>
                <th style="width: 140px;">Bid As Calculated (₱)</th>
                <th style="width: 120px;">Recommendation</th>
            </tr>
        </thead>
        <tbody>
            @forelse($rankedBidders as $bidder)
                @php
                    $vendor = $bidOpening->bidPrices->firstWhere('vendor_id', $bidder['vendor_id'])?->vendor;
                    $bidPrice = $bidOpening->bidPrices->firstWhere('vendor_id', $bidder['vendor_id']);
                @endphp
                <tr>
                    <td class="center">{{ $bidder['rank'] }}</td>
                    <td>{{ $vendor->business_name ?? 'Vendor #' . $bidder['vendor_id'] }}</td>
                    <td class="amount">{{ number_format($bidPrice->amount_as_read ?? 0, 2) }}</td>
                    <td class="amount">{{ number_format($bidder['calculated_price'], 2) }}</td>
                    <td class="center responsive">RESPONSIVE</td>
                </tr>
            @empty
                <tr>
                    <td colspan="5" class="center">No responsive bidders found.</td>
                </tr>
            @endforelse

            {{-- Non-responsive vendors --}}
            @foreach($bidOpening->bidPrices as $bp)
                @php
                    $isRanked = collect($rankedBidders)->contains('vendor_id', $bp->vendor_id);
                @endphp
                @if(!$isRanked)
                    <tr>
                        <td class="center">—</td>
                        <td>{{ $bp->vendor->business_name ?? 'Vendor #' . $bp->vendor_id }}</td>
                        <td class="amount">{{ number_format($bp->amount_as_read, 2) }}</td>
                        <td class="amount">—</td>
                        <td class="center non-responsive">NON-RESPONSIVE</td>
                    </tr>
                @endif
            @endforeach
        </tbody>
    </table>

    <p class="note">
        Lowest Calculated Bid (LCB): {{ $rankedBidders[0]['vendor_id'] ?? '—' }}
        — ₱{{ isset($rankedBidders[0]) ? number_format($rankedBidders[0]['calculated_price'], 2) : '0.00' }}
    </p>

    <div class="signature-section">
        <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-name">BAC Chairperson</div>
            <div class="signature-title">Bids and Awards Committee</div>
        </div>
        <div class="signature-box" style="margin-left: 8%;">
            <div class="signature-line"></div>
            <div class="signature-name">BAC Secretariat</div>
            <div class="signature-title">Prepared by</div>
        </div>
    </div>

    <div class="footer">
        Generated by ProcureSeal &mdash; {{ now()->format('F d, Y h:i A') }}
    </div>
</body>
</html>
