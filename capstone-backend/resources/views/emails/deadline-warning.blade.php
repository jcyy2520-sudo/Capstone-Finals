<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: #dc2626; color: #fff; padding: 20px; text-align: center; }
        .header.warning { background: #f59e0b; }
        .content { padding: 20px; }
        .deadline-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .deadline-box.warning { background: #fffbeb; border-color: #fde68a; }
        .progress-bar { background: #e5e7eb; border-radius: 4px; height: 8px; margin: 8px 0; }
        .progress-fill { background: #dc2626; border-radius: 4px; height: 8px; }
        .progress-fill.warning { background: #f59e0b; }
        .btn { display: inline-block; padding: 10px 20px; background: #1e40af; color: #fff; text-decoration: none; border-radius: 4px; margin-top: 16px; }
        .footer { padding: 20px; font-size: 12px; color: #666; border-top: 1px solid #e5e7eb; }
    </style>
</head>
<body>
    <div class="header {{ $percentElapsed < 100 ? 'warning' : '' }}">
        <h2>{{ $percentElapsed >= 100 ? 'DEADLINE OVERDUE' : 'Deadline Warning' }}</h2>
    </div>
    <div class="content">
        <h3>{{ $entityLabel }}</h3>

        <div class="deadline-box {{ $percentElapsed < 100 ? 'warning' : '' }}">
            <p><strong>{{ $deadlineLabel }}:</strong> {{ $deadlineDate }}</p>
            <p><strong>Status:</strong> {{ $percentElapsed }}% of time elapsed</p>
            <div class="progress-bar">
                <div class="progress-fill {{ $percentElapsed < 100 ? 'warning' : '' }}" style="width: {{ min($percentElapsed, 100) }}%"></div>
            </div>
        </div>

        @if($percentElapsed >= 100)
            <p><strong>This deadline has passed.</strong> Immediate action is required.</p>
        @elseif($percentElapsed >= 90)
            <p><strong>Less than 10% of time remains.</strong> Please take action immediately.</p>
        @else
            <p>Please review and take necessary action before the deadline.</p>
        @endif

        <a href="{{ $actionUrl }}" class="btn">Take Action</a>
    </div>
    <div class="footer">
        <p>This is an automated deadline alert from ProcureSeal. Do not reply to this email.</p>
    </div>
</body>
</html>
