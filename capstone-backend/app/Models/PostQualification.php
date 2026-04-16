<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class PostQualification extends Model
{
    use HasFactory;

    protected $fillable = [
        'bid_opening_id', 'invitation_id', 'vendor_id', 'rank',
        'invitation_reference',
        'document_results', 'required_documents', 'submitted_documents',
        'twg_evaluation', 'twg_recommendation', 'twg_remarks',
        'result', 'workflow_status', 'failure_reason', 'non_compliance_reason',
        'report_path', 'bac_resolution_id',
        'evaluated_by',
        'invitation_sent_at', 'acknowledged_at',
        'submission_deadline_at', 'extension_deadline_at',
        'documents_submitted_at', 'completed_at', 'finalized_at',
    ];

    protected function casts(): array
    {
        return [
            'document_results' => 'array',
            'required_documents' => 'array',
            'submitted_documents' => 'array',
            'twg_evaluation' => 'array',
            'invitation_sent_at' => 'datetime',
            'acknowledged_at' => 'datetime',
            'submission_deadline_at' => 'datetime',
            'extension_deadline_at' => 'datetime',
            'documents_submitted_at' => 'datetime',
            'completed_at' => 'datetime',
            'finalized_at' => 'datetime',
        ];
    }

    public function bidOpening(): BelongsTo { return $this->belongsTo(BidOpening::class); }
    public function invitation(): BelongsTo { return $this->belongsTo(Invitation::class); }
    public function vendor(): BelongsTo { return $this->belongsTo(Vendor::class); }
    public function evaluator(): BelongsTo { return $this->belongsTo(User::class, 'evaluated_by'); }
    public function bacResolution(): BelongsTo { return $this->belongsTo(BacResolution::class, 'bac_resolution_id'); }
}
