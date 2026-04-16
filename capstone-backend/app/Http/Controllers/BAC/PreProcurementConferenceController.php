<?php

namespace App\Http\Controllers\BAC;

use App\Http\Controllers\Controller;
use App\Models\PreProcurementConference;
use App\Models\PurchaseRequisition;
use App\Models\BlockchainEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PreProcurementConferenceController extends Controller
{
    public function index(Request $request)
    {
        $query = PreProcurementConference::with(['purchaseRequisition', 'conductor']);

        if ($request->filled('purchase_requisition_id')) {
            $query->where('purchase_requisition_id', $request->purchase_requisition_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->orderByDesc('created_at')->paginate(20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'purchase_requisition_id' => 'required|exists:purchase_requisitions,id',
            'conference_date' => 'required|date|after:today',
            'venue' => 'required|string|max:500',
            'agenda' => 'required|string|min:20',
        ]);

        $pr = PurchaseRequisition::findOrFail($validated['purchase_requisition_id']);

        if ($pr->status !== 'accepted' && $pr->status !== 'mode_confirmed') {
            return response()->json(['message' => 'PR must be accepted before scheduling a pre-procurement conference.'], 400);
        }

        // Check if conference already exists for this PR
        $existing = PreProcurementConference::where('purchase_requisition_id', $pr->id)
            ->whereNotIn('outcome', ['cancelled'])
            ->first();

        if ($existing) {
            return response()->json(['message' => 'A pre-procurement conference already exists for this PR.'], 400);
        }

        $conference = PreProcurementConference::create([
            'purchase_requisition_id' => $pr->id,
            'conference_date' => $validated['conference_date'],
            'venue' => $validated['venue'],
            'agenda' => $validated['agenda'],
            'status' => 'scheduled',
            'conducted_by' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Pre-procurement conference scheduled.',
            'conference' => $conference,
        ], 201);
    }

    public function show(PreProcurementConference $preProcurementConference)
    {
        return response()->json(
            $preProcurementConference->load(['purchaseRequisition', 'conductor'])
        );
    }

    public function conduct(Request $request, PreProcurementConference $preProcurementConference)
    {
        if ($preProcurementConference->status !== 'scheduled') {
            return response()->json(['message' => 'Conference must be in scheduled status to conduct.'], 400);
        }

        $validated = $request->validate([
            'attendees' => 'required|array|min:1',
            'attendees.*.user_id' => 'required|exists:users,id',
            'attendees.*.role' => 'required|string',
            'attendees.*.present' => 'required|boolean',
            'abc_validated' => 'required|boolean',
            'specs_validated' => 'required|boolean',
            'bidding_docs_validated' => 'required|boolean',
            'minutes' => 'required|string|min:50',
            'remarks' => 'nullable|string',
        ]);

        $preProcurementConference->update([
            'attendees' => $validated['attendees'],
            'abc_validated' => $validated['abc_validated'],
            'specs_validated' => $validated['specs_validated'],
            'bidding_docs_validated' => $validated['bidding_docs_validated'],
            'minutes' => $validated['minutes'],
            'remarks' => $validated['remarks'] ?? null,
            'status' => 'conducted',
            'outcome' => 'conducted',
        ]);

        return response()->json([
            'message' => 'Conference conducted successfully. Pending chairperson approval.',
            'conference' => $preProcurementConference,
        ]);
    }

    public function approve(Request $request, PreProcurementConference $preProcurementConference)
    {
        if ($preProcurementConference->status !== 'conducted') {
            return response()->json(['message' => 'Conference must be conducted before approval.'], 400);
        }

        if (!$preProcurementConference->abc_validated || !$preProcurementConference->specs_validated || !$preProcurementConference->bidding_docs_validated) {
            return response()->json(['message' => 'All validations (ABC, specs, bidding docs) must be confirmed before approval.'], 400);
        }

        DB::beginTransaction();
        try {
            $preProcurementConference->update([
                'status' => 'approved',
                'outcome' => 'approved',
            ]);

            BlockchainEvent::recordEvent(
                BlockchainEvent::PRE_PROCUREMENT_CONFERENCE_APPROVED,
                $request->user()->id,
                PreProcurementConference::class,
                $preProcurementConference->id,
                hash('sha256', json_encode($preProcurementConference->toArray())),
                [
                    'procurement_id' => (string) $preProcurementConference->purchase_requisition_id,
                    'conference_date' => $preProcurementConference->conference_date->toDateString(),
                ]
            );

            DB::commit();

            return response()->json([
                'message' => 'Pre-procurement conference approved. Invitation can now be created.',
                'conference' => $preProcurementConference,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to approve conference.', 'error' => $e->getMessage()], 500);
        }
    }
}
