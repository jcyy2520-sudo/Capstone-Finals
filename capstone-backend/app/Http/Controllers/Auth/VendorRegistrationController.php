<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Vendor;
use App\Models\Role;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class VendorRegistrationController extends Controller
{
    /**
     * POST /api/auth/vendor/register
     * Vendor self-registration per SRS Section 4.1.2
     */
    public function register(Request $request): JsonResponse
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
            'procurement_categories.*' => 'string|in:goods,services,works,consulting,it,medical,construction,office_supplies',
            'username' => 'required|string|min:6|max:30|unique:users,name',
            'password' => [
                'required', 'string', 'min:12', 'confirmed',
                'regex:/[A-Z]/', // uppercase
                'regex:/[a-z]/', // lowercase
                'regex:/[0-9]/', // number
                'regex:/[@$!%*?&#]/', // special char
            ],
        ], [
            'tin.regex' => 'TIN must be in format: 000-000-000-000',
            'philgeps_number.size' => 'PhilGEPS number must be exactly 7 digits',
            'contact_mobile.regex' => 'Mobile number must be in format: 09XX-XXX-XXXX',
            'password.regex' => 'Password must include uppercase, lowercase, number, and special character',
        ]);

        $result = DB::transaction(function () use ($request) {
            // Create user account
            $vendorRole = Role::where('name', Role::VENDOR)->first();
            $user = User::create([
                'name' => $request->username,
                'email' => $request->contact_email,
                'password' => $request->password, // Auto-hashed via cast
                'role_id' => $vendorRole?->id,
                'phone' => $request->contact_mobile,
                'status' => 'active',
            ]);

            // Create vendor record
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
                'status' => 'pending_secretariat_review', // Skip email verification for dev
                'email_verification_token' => Str::random(64),
            ]);

            AuditLog::log('VENDOR_REGISTRATION', $user->id, 'App\Models\Vendor', $vendor->id,
                null, ['business_name' => $vendor->business_name], true, 'New vendor registered');

            return ['user' => $user, 'vendor' => $vendor];
        });

        return response()->json([
            'message' => 'Registration successful. Your account is pending Secretariat review.',
            'vendor' => [
                'id' => $result['vendor']->id,
                'business_name' => $result['vendor']->business_name,
                'status' => $result['vendor']->status,
            ],
        ], 201);
    }
}
