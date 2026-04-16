<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>ProcureSeal - {{ $title ?? 'Invitation' }}</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 12pt; color: #333; line-height: 1.5; }
        .header { text-align: center; margin-bottom: 20px; }
        .header img { height: 80px; }
        .header .agency { font-weight: bold; font-size: 14pt; display: block; }
        .header .address { font-size: 10pt; }
        .doc-title { text-align: center; text-transform: uppercase; font-weight: bold; font-size: 16pt; margin: 20px 0; text-decoration: underline; }
        .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .meta-table td { padding: 5px; vertical-align: top; }
        .meta-label { font-weight: bold; width: 150px; }
        .content { margin-top: 20px; text-align: justify; }
        .content p { margin-bottom: 10px; }
        .footer { position: fixed; bottom: 0; width: 100%; font-size: 8pt; border-top: 1px solid #ccc; padding-top: 5px; text-align: center; }
        .signature-section { margin-top: 50px; }
        .signature-box { float: left; width: 300px; }
        .signature-line { border-bottom: 1px solid #000; margin-top: 40px; margin-bottom: 5px; }
        .signature-name { font-weight: bold; text-transform: uppercase; }
        .signature-title { font-size: 10pt; }
        .clearfix { clear: both; }
        table.items { width: 100%; border-collapse: collapse; margin-top: 10px; }
        table.items th, table.items td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        table.items th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <span class="agency">Republic of the Philippines</span>
        <span class="agency">{{ $invitation->procuring_entity }}</span>
        <span class="address">Procurement Management Office</span>
    </div>

    @yield('content')

    <div class="signature-section">
        @yield('signatures')
    </div>

    <div class="footer">
        Reference: {{ $invitation->reference_number }} | Generated on: {{ $timestamp }} | ProcureSeal Audit Trail: {{ hash('sha256', $invitation->reference_number . $timestamp) }}
    </div>
</body>
</html>
