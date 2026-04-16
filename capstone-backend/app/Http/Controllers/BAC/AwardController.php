<?php

namespace App\Http\Controllers\BAC;

use App\Http\Controllers\Controller;
use App\Http\Requests\BAC\StoreAwardRequest;
use App\Models\Award;
use App\Models\BacResolution;
use App\Services\AwardService;
use Illuminate\Http\Request;

class AwardController extends Controller
{
    public function __construct(private AwardService $awardService)
    {
    }

    /**
     * HOPE reviews and approves the BAC Resolution recommending award.
     */
    public function hopeApproveResolution(StoreAwardRequest $request, BacResolution $bacResolution)
    {
        $validated = $request->validated();

        try {
            $award = $this->awardService->approveResolution(
                $bacResolution,
                $request->user()->id,
                $validated['performance_security_percentage']
            );

            return response()->json([
                'message' => 'Resolution Approved. DRAFT Notice of Award auto-generated.',
                'award' => $award,
            ], 201);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to approve resolution.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * HOPE digitally signs and formally issues the NOA to the winning bidder.
     */
    public function issueNoa(Request $request, Award $award)
    {
        try {
            $award = $this->awardService->issueNoa($award, $request->user()->id);

            return response()->json([
                'message' => 'Notice of Award digitally signed and issued successfully.',
                'award' => $award,
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to issue NOA.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Vendor acknowledges the NOA (simulated).
     */
    public function vendorAcknowledge(Request $request, Award $award)
    {
        try {
            $award = $this->awardService->vendorAcknowledge($award, $request->user()->id);

            return response()->json([
                'message' => "Vendor Acknowledgment logged. Security deadline set to {$award->performance_security_deadline}.",
                'award' => $award,
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to log acknowledgment.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Cancel the award (requires formal justification).
     */
    public function cancelAward(Request $request, Award $award)
    {
        $validated = $request->validate([
            'cancellation_grounds' => 'required|string|min:20',
        ]);

        try {
            $this->awardService->cancelAward($award, $request->user()->id, $validated['cancellation_grounds']);

            return response()->json(['message' => 'Award formally cancelled. Proceed back to BAC for next LCB verification.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Cancellation operation failed.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Index dashboard retrieval.
     */
    public function index(Request $request)
    {
        $resolutions = BacResolution::with('invitation')->whereIn('status', ['signed', 'approved_by_hope'])->get();
        $awards = Award::with(['vendor', 'invitation'])->get();

        return response()->json([
            'bac_resolutions' => $resolutions,
            'awards' => $awards,
        ]);
    }
}
