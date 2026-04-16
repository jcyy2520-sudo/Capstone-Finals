<?php

namespace App\Http\Controllers\BAC;

use App\Http\Controllers\Controller;
use App\Http\Requests\BAC\StoreInvitationRequest;
use App\Http\Requests\BAC\UpdateInvitationRequest;
use App\Models\Invitation;
use App\Models\PurchaseRequisition;
use App\Services\InvitationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class InvitationController extends Controller
{
    protected $invitationService;

    public function __construct(InvitationService $invitationService)
    {
        $this->invitationService = $invitationService;
    }

    public function index(Request $request)
    {
        $query = Invitation::with(['creator', 'approver', 'purchaseRequisition', 'rfqInvitations.vendor']);
        
        if ($request->filled('type')) {
            $query->where('type', strtolower((string) $request->type));
        }

        if ($request->filled('status')) {
            $query->where('status', strtolower((string) $request->status));
        }

        if ($request->user()->hasRole('vendor')) {
            $vendorId = $request->user()->vendor?->id;

            $query->where(function ($q) use ($vendorId) {
                $q->where('status', 'posted');
                if ($vendorId) {
                    $q->orWhereHas('rfqInvitations', function ($sub) use ($vendorId) {
                        $sub->where('vendor_id', $vendorId);
                    });
                }
            });
        }

        return response()->json($query->orderBy('created_at', 'desc')->paginate(20));
    }

    public function show(Invitation $invitation)
    {
        $invitation->load(['creator', 'approver', 'purchaseRequisition', 'rfqInvitations.vendor']);
        return response()->json($invitation);
    }

    public function store(StoreInvitationRequest $request)
    {
        $validated = $request->validated();

        try {
            $pr = PurchaseRequisition::with('appEntry', 'lineItems')->findOrFail($validated['purchase_requisition_id']);
            $invitation = $this->invitationService->createFromPr($pr, $validated, $request->user());
            return response()->json($invitation, 201);
        } catch (\Exception $e) {
            Log::error('Invitation Store Error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    public function update(UpdateInvitationRequest $request, Invitation $invitation)
    {
        if (!in_array($invitation->status, ['draft'], true)) {
            return response()->json(['error' => 'Cannot edit an invitation that is already in progress.'], 403);
        }

        $invitation->update($request->validated());
        return response()->json($invitation);
    }

    public function submit(Invitation $invitation, Request $request)
    {
        try {
            $updated = $this->invitationService->submitForApproval($invitation, $request->user());
            return response()->json($updated);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage(), 'message' => $e->getMessage()], 400);
        }
    }

    public function approve(Invitation $invitation, Request $request)
    {
        try {
            $updated = $this->invitationService->approve($invitation, $request->user());
            return response()->json($updated);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage(), 'message' => $e->getMessage()], 400);
        }
    }

    public function post(Invitation $invitation, Request $request)
    {
        try {
            $updated = $this->invitationService->post($invitation, $request->user());
            return response()->json($updated);
        } catch (\Exception $e) {
            Log::error('Invitation Post Error:', ['message' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to release/post: ' . $e->getMessage()], 400);
        }
    }

    public function generatePdf(Invitation $invitation)
    {
        $invitation->load(['purchaseRequisition.appEntry', 'purchaseRequisition.lineItems', 'creator', 'approver', 'hopeApprover']);
        
        $mode = $invitation->procurement_mode;
        $view = 'pdf.invitations.generic';
        
        // Select template based on mode
        $modeTemplates = [
            Invitation::MODE_COMPETITIVE_BIDDING => 'pdf.invitations.itb',
            Invitation::MODE_SVP => 'pdf.invitations.rfq',
            Invitation::MODE_SHOPPING_A => 'pdf.invitations.shopping',
            Invitation::MODE_SHOPPING_B => 'pdf.invitations.shopping',
            Invitation::MODE_LIMITED_SOURCE => 'pdf.invitations.limited_source',
            Invitation::MODE_DIRECT_CONTRACTING => 'pdf.invitations.direct_contracting',
            Invitation::MODE_NEGOTIATED => 'pdf.invitations.negotiated',
            Invitation::MODE_REPEAT_ORDER => 'pdf.invitations.repeat_order',
            Invitation::MODE_DIRECT_ACQUISITION => 'pdf.invitations.direct_acquisition',
            Invitation::MODE_DIRECT_SALES => 'pdf.invitations.direct_sales',
            Invitation::MODE_STI => 'pdf.invitations.sti',
        ];

        if (isset($modeTemplates[$mode]) && view()->exists($modeTemplates[$mode])) {
            $view = $modeTemplates[$mode];
        }

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView($view, [
            'invitation' => $invitation,
            'timestamp' => now()->format('M d, Y h:i A'),
        ]);

        return $pdf->stream("Invitation-{$invitation->reference_number}.pdf");
    }

    public function returnInvitation(Invitation $invitation, Request $request)
    {
        $request->validate([
            'remarks' => 'required|string|min:10|max:1000',
        ]);

        try {
            $updated = $this->invitationService->returnInvitation($invitation, $request->user(), $request->remarks);
            return response()->json($updated);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage(), 'message' => $e->getMessage()], 400);
        }
    }

    public function sendRfq(Invitation $invitation, Request $request)
    {
        $request->validate([
            'vendor_ids' => 'required|array|min:3',
            'vendor_ids.*' => 'exists:vendors,id'
        ]);

        try {
            $updated = $this->invitationService->sendRfq($invitation, $request->vendor_ids, $request->user());
            return response()->json($updated);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage(), 'message' => $e->getMessage()], 400);
        }
    }
}
