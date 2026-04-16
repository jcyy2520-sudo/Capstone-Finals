<?php

namespace App\Http\Controllers\Vendor;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Vendor;
use App\Models\Invitation;
use App\Models\BidOpening;
use App\Models\BidSubmission;
use App\Models\Award;
use App\Models\Contract;
use App\Models\PostQualification;
use App\Models\ProcurementNotification;
use App\Models\VendorDocument;

class VendorController extends Controller
{
    public function getDashboardStats(Request $request): JsonResponse
    {
        $user = $request->user();
        $vendor = Vendor::where('user_id', $user->id)->first();
        
        if (!$vendor) {
            return response()->json(['message' => 'Vendor profile not found'], 404);
        }

        // Gather real stats
        $openInvitationsCount = Invitation::where('status', 'posted')->count();
        $bidsSubmittedCount = BidSubmission::where('vendor_id', $vendor->id)->count();
        $activeContractsCount = Contract::where('vendor_id', $vendor->id)
                                        ->whereIn('status', ['active', 'ongoing'])
                                        ->count();

        $recentNotifications = ProcurementNotification::where('recipient_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(function ($notification) {
                return [
                    'id' => $notification->id,
                    'title' => $notification->title,
                    'message' => $notification->message,
                    'priority' => $notification->priority,
                    'action_url' => $notification->action_url,
                    'read_at' => optional($notification->read_at)->toIso8601String(),
                    'created_at' => optional($notification->created_at)->toIso8601String(),
                ];
            })
            ->values();

        return response()->json([
            'open_invitations' => $openInvitationsCount,
            'bids_submitted' => $bidsSubmittedCount,
            'active_contracts' => $activeContractsCount,
            'recent_notifications' => $recentNotifications,
        ]);
    }

    public function getOpportunities(Request $request): JsonResponse
    {
        // Fetch posted invitations
        $invitations = Invitation::where('status', 'posted')
            ->with(['purchaseRequisition.department', 'purchaseRequisition.appEntry'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($inv) {
                $appEntry = $inv->purchaseRequisition?->appEntry;
                $department = $inv->purchaseRequisition?->department;

                return [
                    'id' => $inv->id,
                    'reference_number' => $inv->reference_number,
                    'title' => $appEntry?->project_title ?? $inv->project_title ?? 'N/A',
                    'department' => $department?->name ?? 'N/A',
                    'abc' => $appEntry?->abc ?? $inv->abc ?? 0,
                    'mode' => $appEntry?->mode ?? $inv->procurement_mode ?? 'N/A',
                    'closing_date' => $inv->submission_deadline,
                ];
            });

        return response()->json($invitations);
    }

    public function getOpportunityDetails(Request $request, $id): JsonResponse
    {
        $invitation = Invitation::with(['purchaseRequisition.department', 'purchaseRequisition.appEntry'])
            ->where('id', $id)
            ->firstOrFail();

        $appEntry = $invitation->purchaseRequisition?->appEntry;
        $department = $invitation->purchaseRequisition?->department;

        return response()->json([
            'id' => $invitation->id,
            'reference_number' => $invitation->reference_number,
            'title' => $appEntry?->project_title ?? $invitation->project_title ?? 'N/A',
            'department' => $department?->name ?? 'N/A',
            'description' => $appEntry?->description ?? $invitation->special_conditions ?? '',
            'abc' => $appEntry?->abc ?? $invitation->abc ?? 0,
            'mode' => $appEntry?->mode ?? $invitation->procurement_mode ?? 'N/A',
            'closing_date' => $invitation->submission_deadline,
            'status' => $invitation->status,
            'requirements' => [
                'Mayor\'s/Business Permit',
                'PhilGEPS Registration Number',
                'Income/Business Tax Return',
                'Omnibus Sworn Statement'
            ],
            'bid_documents_url' => '#' // Placeholder for actual document download
        ]);
    }

    public function getBids(Request $request): JsonResponse
    {
        // Mock data. In a real system, we would query vendor->bids or bid_submissions
        $bids = [
            [
                'id' => 1,
                'reference_number' => 'ITB-2026-001',
                'title' => 'Supply and Delivery of IT Equipment',
                'department' => 'DILG',
                'status' => 'post_qualification', // eligible, ranked_1st, post_qualification, awarded, failed
                'rank' => 1,
                'submitted_at' => now()->subDays(5)->toISOString(),
                'updated_at' => now()->subDays(1)->toISOString(),
            ],
            [
                'id' => 2,
                'reference_number' => 'RFQ-2026-045',
                'title' => 'Catering Services for Quarterly Meeting',
                'department' => 'HR',
                'status' => 'eligible',
                'rank' => null,
                'submitted_at' => now()->subDays(2)->toISOString(),
                'updated_at' => now()->subDays(2)->toISOString(),
            ]
        ];

        return response()->json($bids);
    }

    public function uploadPostQual(Request $request, $id): JsonResponse
    {
        $request->validate([
            'files' => 'required|array|min:1',
            'files.*' => 'file|mimes:pdf|max:25600',
        ]);

        $vendor = Vendor::where('user_id', $request->user()->id)->first();
        if (!$vendor) {
            return response()->json(['message' => 'Vendor profile not found'], 404);
        }

        $pq = PostQualification::where('id', $id)
            ->where('vendor_id', $vendor->id)
            ->first();

        if (!$pq) {
            return response()->json(['message' => 'Post-qualification invitation not found for this vendor.'], 404);
        }

        if (in_array($pq->workflow_status, ['passed', 'failed', 'resolution_finalized'])) {
            return response()->json(['message' => 'Post-qualification submission is already finalized.'], 422);
        }

        $deadline = $pq->extension_deadline_at ?? $pq->submission_deadline_at;
        if ($deadline && now()->greaterThan($deadline)) {
            $pq->update([
                'workflow_status' => 'non_compliant',
                'non_compliance_reason' => 'Submission attempted beyond post-qualification deadline.',
            ]);

            return response()->json(['message' => 'Submission window has lapsed.'], 422);
        }

        $submittedDocuments = [];
        foreach ($request->file('files') as $docType => $file) {
            $storedPath = $file->store("post-qualification/{$pq->id}", 'local');

            $submittedDocuments[] = [
                'doc_type' => (string) $docType,
                'original_name' => $file->getClientOriginalName(),
                'path' => $storedPath,
                'size' => $file->getSize(),
                'mime' => $file->getMimeType(),
                'hash' => hash_file('sha256', $file->getRealPath()),
                'uploaded_at' => now()->toIso8601String(),
            ];
        }

        $pq->update([
            'submitted_documents' => $submittedDocuments,
            'documents_submitted_at' => now(),
            'workflow_status' => 'submitted',
        ]);

        return response()->json([
            'message' => 'Post-qualification documents submitted successfully.',
            'post_qualification' => $pq->fresh(),
        ]);
    }

    public function getPostQualifications(Request $request): JsonResponse
    {
        $vendor = Vendor::where('user_id', $request->user()->id)->first();
        if (!$vendor) {
            return response()->json([]);
        }

        $records = PostQualification::with(['invitation:id,reference_number,project_title,procurement_mode', 'bidOpening:id,session_reference'])
            ->where('vendor_id', $vendor->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($pq) {
                $deadline = $pq->extension_deadline_at ?? $pq->submission_deadline_at;

                return [
                    'id' => $pq->id,
                    'invitation_reference' => $pq->invitation_reference,
                    'invitation' => $pq->invitation,
                    'bid_opening' => $pq->bidOpening,
                    'rank' => $pq->rank,
                    'workflow_status' => $pq->workflow_status,
                    'result' => $pq->result,
                    'required_documents' => $pq->required_documents,
                    'documents_submitted_at' => $pq->documents_submitted_at,
                    'submission_deadline_at' => $deadline,
                    'acknowledged_at' => $pq->acknowledged_at,
                ];
            });

        return response()->json($records);
    }

    public function getContracts(Request $request): JsonResponse
    {
        $vendor = Vendor::where('user_id', $request->user()->id)->first();
        if (!$vendor) return response()->json([]);

        $contracts = Contract::with(['award.invitation.purchaseRequisition.department', 'purchaseRequisition.department'])
            ->where('vendor_id', $vendor->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($contract) {
                $invitation = $contract->award?->invitation;
                $department = $invitation?->purchaseRequisition?->department ?? $contract->purchaseRequisition?->department;

                return [
                    'id' => $contract->id,
                    'reference' => $contract->contract_reference ?? 'CON-' . str_pad($contract->id, 5, '0', STR_PAD_LEFT),
                    'title' => $invitation?->project_title ?? $contract->purchaseRequisition?->appEntry?->project_title ?? 'N/A',
                    'department' => $department?->name ?? 'N/A',
                    'amount' => $contract->contract_amount,
                    'status' => $contract->status,
                    'delivery_deadline' => $contract->end_date,
                    'signed_at' => $contract->ntp_date,
                ];
            });

        return response()->json($contracts);
    }

    // ── Vendor Profile ──────────────────────────────────

    public function getAwards(Request $request): JsonResponse
    {
        $vendor = Vendor::where('user_id', $request->user()->id)->first();
        if (!$vendor) return response()->json([]);

        $awards = Award::with(['invitation'])
            ->where('vendor_id', $vendor->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($awards);
    }

    public function getProfile(Request $request): JsonResponse
    {
        $vendor = Vendor::where('user_id', $request->user()->id)
            ->with('documents')
            ->first();

        if (!$vendor) {
            return response()->json(['message' => 'Vendor profile not found'], 404);
        }

        return response()->json([
            'id' => $vendor->id,
            'business_name' => $vendor->business_name,
            'business_type' => $vendor->business_type,
            'dti_sec_cda_number' => $vendor->dti_sec_cda_number,
            'philgeps_number' => $vendor->philgeps_number,
            'tin' => $vendor->tin,
            'address' => $vendor->address,
            'contact_person' => $vendor->contact_person,
            'contact_email' => $vendor->contact_email,
            'contact_mobile' => $vendor->contact_mobile,
            'procurement_categories' => $vendor->procurement_categories,
            'status' => $vendor->status,
            'is_blacklisted' => $vendor->is_blacklisted,
            'email_verified_at' => $vendor->email_verified_at,
            'documents' => $vendor->documents->map(fn ($doc) => [
                'id' => $doc->id,
                'doc_type' => $doc->doc_type,
                'file_name' => $doc->file_name,
                'file_size' => $doc->file_size,
                'expiry_date' => $doc->expiry_date?->toDateString(),
                'status' => $doc->status,
                'verified_at' => $doc->verified_at?->toIso8601String(),
                'created_at' => $doc->created_at->toIso8601String(),
            ]),
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $vendor = Vendor::where('user_id', $request->user()->id)->first();

        if (!$vendor) {
            return response()->json(['message' => 'Vendor profile not found'], 404);
        }

        $validated = $request->validate([
            'address' => 'sometimes|string|max:500',
            'contact_person' => 'sometimes|string|max:255',
            'contact_email' => 'sometimes|email|max:255',
            'contact_mobile' => 'sometimes|string|max:20',
            'procurement_categories' => 'sometimes|array|min:1',
            'procurement_categories.*' => 'string',
        ]);

        $vendor->update($validated);

        return response()->json([
            'message' => 'Profile updated successfully.',
            'vendor' => $vendor->fresh(),
        ]);
    }

    public function uploadDocument(Request $request): JsonResponse
    {
        $vendor = Vendor::where('user_id', $request->user()->id)->first();

        if (!$vendor) {
            return response()->json(['message' => 'Vendor profile not found'], 404);
        }

        $request->validate([
            'doc_type' => 'required|string|in:dti_sec_cda,mayors_permit,tax_clearance,philgeps_certificate,audited_financial_statements,pcab_license,ongoing_contracts,slcc,bid_security,other',
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:25600',
            'expiry_date' => 'nullable|date|after:today',
        ]);

        $file = $request->file('file');
        $storedPath = $file->store("vendor-documents/{$vendor->id}", 'local');

        $document = VendorDocument::create([
            'vendor_id' => $vendor->id,
            'doc_type' => $request->doc_type,
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $storedPath,
            'file_hash' => hash_file('sha256', $file->getRealPath()),
            'file_size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
            'expiry_date' => $request->expiry_date,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Document uploaded successfully.',
            'document' => [
                'id' => $document->id,
                'doc_type' => $document->doc_type,
                'file_name' => $document->file_name,
                'file_size' => $document->file_size,
                'expiry_date' => $document->expiry_date?->toDateString(),
                'status' => $document->status,
                'created_at' => $document->created_at->toIso8601String(),
            ],
        ]);
    }
}
