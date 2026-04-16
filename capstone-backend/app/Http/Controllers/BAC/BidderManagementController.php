<?php

namespace App\Http\Controllers\BAC;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Vendor;
use App\Models\Role;
use App\Models\AuditLog;
use App\Models\BlockchainEvent;
use App\Models\VendorPhysicalVerification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class BidderManagementController extends Controller
{
    /**
     * GET /api/bidders
     * List all registered bidders for the Secretariat.
     */
    public function index(): JsonResponse
    {
        $vendors = Vendor::with('user:id,name,email,status,requires_password_change,last_login_at')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($vendors);
    }

    /**
     * POST /api/bidders
     * Secretariat creates an approved bidder after physical verification.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'business_name' => 'required|string|max:200|unique:vendors,business_name',
            'business_type' => 'required|in:sole_proprietorship,partnership,corporation,joint_venture,foreign_company',
            'dti_sec_cda_number' => 'required|string|max:50',
            'philgeps_number' => 'required|string|size:7|unique:vendors,philgeps_number',
            'tin' => 'required|string|regex:/^\d{3}-\d{3}-\d{3}-\d{3}$/',
            'address' => 'required|string',
            'contact_person' => 'required|string|max:150',
            'contact_email' => 'required|email|unique:users,email',
            'contact_mobile' => 'required|string|regex:/^09\d{2}-?\d{3}-?\d{4}$/',
            'procurement_categories' => 'required|array|min:1',
            'procurement_categories.*' => 'string|in:goods,services,works,consulting,it,medical,construction,office_supplies,janitorial,security',
            'username' => 'required|string|min:6|max:30|unique:users,name',
        ], [
            'tin.regex' => 'TIN must be in format: 000-000-000-000',
            'philgeps_number.size' => 'PhilGEPS number must be exactly 7 digits',
            'contact_mobile.regex' => 'Mobile number must be in format: 09XX-XXX-XXXX',
        ]);

        $result = DB::transaction(function () use ($request) {
            $tempPassword = $this->generateStrongPassword();
            $vendorRole = Role::where('name', Role::VENDOR)->first();
            
            $user = User::create([
                'name' => $request->username,
                'email' => $request->contact_email,
                'password' => $tempPassword, // Auto-hashed via model cast
                'role_id' => $vendorRole?->id,
                'phone' => $request->contact_mobile,
                'status' => 'active',
                'requires_password_change' => true,
            ]);

            $vendor = Vendor::create([
                'user_id' => $user->id,
                'business_name' => $request->business_name,
                'business_type' => $request->business_type,
                'dti_sec_cda_number' => $request->dti_sec_cda_number,
                'philgeps_number' => $request->philgeps_number,
                'tin' => $request->tin,
                'address' => $request->address,
                'contact_person' => $request->contact_person,
                'contact_email' => $request->contact_email,
                'contact_mobile' => $request->contact_mobile,
                'procurement_categories' => $request->procurement_categories,
                'status' => 'approved', // Bypasses pending review because of physical verification
            ]);

            AuditLog::log('BIDDER_CREATED', request()->user()->id ?? $user->id, 'App\Models\Vendor', $vendor->id,
                null, ['business_name' => $vendor->business_name], true, 'Secretariat created physically verified bidder');

            return ['user' => $user, 'vendor' => $vendor, 'temp_password' => $tempPassword];
        });

        return response()->json([
            'message' => 'Bidder account created successfully.',
            'vendor' => [
                'id' => $result['vendor']->id,
                'business_name' => $result['vendor']->business_name,
                'status' => $result['vendor']->status,
            ],
            'credentials' => [
                'username' => $result['user']->name,
                'email' => $result['user']->email,
                'temporary_password' => $result['temp_password'],
            ]
        ], 201);
    }

    /**
     * POST /api/vendors/{vendor}/physical-verification
     * Secretariat records the physical verification of documents.
     */
    public function verifyPhysicalDocuments(Vendor $vendor, Request $request): JsonResponse
    {
        $request->validate([
            'checklist_results' => 'required|array|min:1',
            'checklist_results.*.item' => 'required|string',
            'checklist_results.*.status' => 'required|in:passed,not_presented,expired',
            'checklist_results.*.remarks' => 'nullable|string',
            'checklist_results.*.expiry_date' => 'nullable|date',
        ]);

        return DB::transaction(function () use ($vendor, $request) {
            $verification = VendorPhysicalVerification::create([
                'vendor_id' => $vendor->id,
                'verified_by' => $request->user()->id,
                'checklist_results' => $request->checklist_results,
                'session_ip' => $request->ip(),
                'verified_at' => now(),
            ]);

            // Update vendor status to mark documents as physically verified
            // In a real system, you might set a specific bitmask or field.
            // For this capstone, we rely on the relation or a badge logic.
            
            $docHash = hash('sha256', json_encode($verification->toArray()));

            BlockchainEvent::recordEvent(
                'VENDOR_PHYSICAL_VERIFICATION_COMPLETED',
                $request->user()->id,
                Vendor::class,
                $vendor->id,
                $docHash,
                [
                    'procurement_id' => 'VENDOR_VERIFICATION',
                    'business_name' => $vendor->business_name,
                    'result_summary' => count(array_filter($request->checklist_results, fn($r) => $r['status'] === 'passed')) . ' items passed',
                ]
            );

            return response()->json([
                'message' => 'Physical verification recorded successfully.',
                'verification' => $verification
            ]);
        });
    }

    private function generateStrongPassword(): string
    {
        // Require 1 uppercase, 1 lowercase, 1 number, 1 special char, min 16 length
        $upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $lower = 'abcdefghijklmnopqrstuvwxyz';
        $numbers = '0123456789';
        $special = '!@#$%^&*()-_+=<>?';
        
        $password = array(
            $upper[random_int(0, strlen($upper) - 1)],
            $lower[random_int(0, strlen($lower) - 1)],
            $numbers[random_int(0, strlen($numbers) - 1)],
            $special[random_int(0, strlen($special) - 1)]
        );
        
        $all = $upper . $lower . $numbers . $special;
        for ($i = 0; $i < 12; $i++) {
            $password[] = $all[random_int(0, strlen($all) - 1)];
        }
        
        shuffle($password);
        return implode('', $password);
    }
}
