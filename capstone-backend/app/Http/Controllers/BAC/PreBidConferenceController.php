<?php

namespace App\Http\Controllers\BAC;

use App\Http\Controllers\Controller;
use App\Models\PreBidConference;
use App\Models\Invitation;
use Illuminate\Http\Request;

class PreBidConferenceController extends Controller
{
    public function show(Invitation $invitation)
    {
        $conference = PreBidConference::where('invitation_id', $invitation->id)->first();

        if (!$conference) {
            // Auto-create if invitation has pre_bid_conference_date
            if ($invitation->pre_bid_conference_date) {
                $conference = PreBidConference::create([
                    'invitation_id' => $invitation->id,
                    'conference_date' => $invitation->pre_bid_conference_date,
                    'status' => 'scheduled',
                ]);
            } else {
                return response()->json(['message' => 'No pre-bid conference scheduled for this invitation.'], 404);
            }
        }

        return response()->json($conference->load(['invitation', 'conductor']));
    }

    public function conduct(Request $request, Invitation $invitation)
    {
        $conference = PreBidConference::where('invitation_id', $invitation->id)->first();

        if (!$conference) {
            return response()->json(['message' => 'No pre-bid conference found for this invitation.'], 404);
        }

        if ($conference->status !== 'scheduled') {
            return response()->json(['message' => 'Conference must be in scheduled status to conduct.'], 400);
        }

        $validated = $request->validate([
            'attendees' => 'required|array',
            'attendees.*.vendor_id' => 'required|integer',
            'attendees.*.representative_name' => 'required|string',
            'attendees.*.present' => 'required|boolean',
            'queries_raised' => 'nullable|array',
            'queries_raised.*.query' => 'required|string',
            'queries_raised.*.raised_by_vendor_id' => 'required|integer',
            'queries_raised.*.bac_response' => 'required|string',
            'queries_raised.*.response_date' => 'nullable|date',
            'minutes' => 'required|string|min:50',
            'venue' => 'nullable|string',
        ]);

        $conference->update([
            'attendees' => $validated['attendees'],
            'queries_raised' => $validated['queries_raised'] ?? [],
            'minutes' => $validated['minutes'],
            'venue' => $validated['venue'] ?? $conference->venue,
            'status' => 'conducted',
            'conducted_by' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Pre-bid conference conducted successfully.',
            'conference' => $conference,
        ]);
    }

    public function finalizeMinutes(Request $request, Invitation $invitation)
    {
        $conference = PreBidConference::where('invitation_id', $invitation->id)->first();

        if (!$conference) {
            return response()->json(['message' => 'No pre-bid conference found.'], 404);
        }

        if ($conference->status !== 'conducted') {
            return response()->json(['message' => 'Conference must be conducted before minutes can be finalized.'], 400);
        }

        $validated = $request->validate([
            'supplemental_bid_bulletins' => 'nullable|array',
        ]);

        $conference->update([
            'supplemental_bid_bulletins' => $validated['supplemental_bid_bulletins'] ?? [],
            'status' => 'minutes_finalized',
        ]);

        return response()->json([
            'message' => 'Pre-bid conference minutes finalized.',
            'conference' => $conference,
        ]);
    }
}
