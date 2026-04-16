<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Abstract of Bids As Read</title>
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
        .eligibility-pass { color: #16a34a; font-weight: bold; }
        .eligibility-fail { color: #dc2626; font-weight: bold; }
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

    <div class="doc-title">Abstract of Bids As Read</div>

    <table class="meta-table">
        <tr>
            <td class="meta-label">Session Reference:</td>
            <td>{{ $bidOpening->session_reference }}</td>
            <td class="meta-label">Date of Opening:</td>
            <td>{{ $bidOpening->session_date->format('F d, Y h:i A') }}</td>
        </tr>
        <tr>
            <td class="meta-label">Invitation Reference:</td>
            <td>{{ $invitation->reference_number }}</td>
            <td class="meta-label">Procurement Mode:</td>
            <td>{{ ucwords(str_replace('_', ' ', $invitation->procurement_mode)) }}</td>
        </tr>
        <tr>
            <td class="meta-label">Purpose:</td>
            <td colspan="3">{{ $invitation->purchaseRequisition->purpose ?? 'N/A' }}</td>
        </tr>
        <tr>
            <td class="meta-label">Approved Budget (ABC):</td>
            <td colspan="3">₱{{ number_format($invitation->purchaseRequisition->total_value ?? 0, 2) }}</td>
        </tr>
    </table>

    <div class="section-title">I. BAC Members Present</div>
    <p>
        @if($bidOpening->bac_members_present && count($bidOpening->bac_members_present) > 0)
            {{ count($bidOpening->bac_members_present) }} BAC member(s) present — Quorum {{ $bidOpening->quorum_confirmed ? 'CONFIRMED' : 'NOT MET' }}.
        @else
            No attendance data recorded.
        @endif
    </p>

    <div class="section-title">II. Eligibility Check Results</div>
    @php
        $vendorGroups = $bidOpening->eligibilityResults->groupBy('vendor_id');
    @endphp
    @if($vendorGroups->count() > 0)
    <table class="bids">
        <thead>
            <tr>
                <th>Bidder</th>
                <th>Document Type</th>
                <th>Result</th>
                <th>Remarks</th>
                <th>Overall Eligible</th>
            </tr>
        </thead>
        <tbody>
            @foreach($vendorGroups as $vendorId => $results)
                @foreach($results as $i => $result)
                <tr>
                    @if($i === 0)
                    <td rowspan="{{ $results->count() }}">{{ $result->vendor->business_name ?? "Vendor #{$vendorId}" }}</td>
                    @endif
                    <td>{{ $result->doc_type }}</td>
                    <td class="center {{ $result->result === 'pass' ? 'eligibility-pass' : 'eligibility-fail' }}">{{ strtoupper($result->result) }}</td>
                    <td>{{ $result->remarks ?? '—' }}</td>
                    @if($i === 0)
                    <td rowspan="{{ $results->count() }}" class="center {{ $result->overall_eligible ? 'eligibility-pass' : 'eligibility-fail' }}">{{ $result->overall_eligible ? 'ELIGIBLE' : 'INELIGIBLE' }}</td>
                    @endif
                </tr>
                @endforeach
            @endforeach
        </tbody>
    </table>
    @else
    <p class="note">No eligibility results recorded.</p>
    @endif

    <div class="section-title">III. Bid Prices As Read</div>
    @if($bidPrices->count() > 0)
    <table class="bids">
        <thead>
            <tr>
                <th>Rank</th>
                <th>Bidder</th>
                <th>Amount As Read</th>
                <th>Amount As Calculated</th>
                <th>Arithmetic Correction</th>
            </tr>
        </thead>
        <tbody>
            @foreach($bidPrices as $price)
            <tr>
                <td class="center">{{ $price->rank ?? '—' }}</td>
                <td>{{ $price->vendor->business_name ?? "Vendor #{$price->vendor_id}" }}</td>
                <td class="amount">₱{{ number_format($price->amount_as_read, 2) }}</td>
                <td class="amount">₱{{ number_format($price->amount_as_calculated, 2) }}</td>
                <td>{{ $price->arithmetic_correction ?? 'None' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @else
    <p class="note">No bid prices recorded.</p>
    @endif

    <div class="signature-section">
        <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-name">{{ $bidOpening->conductor->name ?? 'BAC Secretariat' }}</div>
            <div class="signature-title">Bid Opening Conductor</div>
        </div>
        <div class="signature-box" style="margin-left: 8%;">
            <div class="signature-line"></div>
            <div class="signature-name">BAC Chairperson</div>
            <div class="signature-title">Chairperson, Bids and Awards Committee</div>
        </div>
    </div>

    <div class="footer">
        Generated by ProcureSeal — {{ now()->format('F d, Y h:i A') }} | This document is system-generated.
    </div>
</body>
</html>
