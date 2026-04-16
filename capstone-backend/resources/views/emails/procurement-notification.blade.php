<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: #1e40af; color: #fff; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .priority-critical { border-left: 4px solid #dc2626; padding-left: 16px; }
        .priority-high { border-left: 4px solid #f59e0b; padding-left: 16px; }
        .btn { display: inline-block; padding: 10px 20px; background: #1e40af; color: #fff; text-decoration: none; border-radius: 4px; margin-top: 16px; }
        .footer { padding: 20px; font-size: 12px; color: #666; border-top: 1px solid #e5e7eb; }
    </style>
</head>
<body>
    <div class="header">
        <h2>ProcureSeal Notification</h2>
    </div>
    <div class="content">
        <div class="{{ $notification->priority === 'critical' ? 'priority-critical' : ($notification->priority === 'high' ? 'priority-high' : '') }}">
            <h3>{{ $notification->title }}</h3>
            <p>{{ $notification->message }}</p>
        </div>

        @if($notification->action_url)
            <a href="{{ $notification->action_url }}" class="btn">View Details</a>
        @endif
    </div>
    <div class="footer">
        <p>This is an automated notification from ProcureSeal. Do not reply to this email.</p>
    </div>
</body>
</html>
