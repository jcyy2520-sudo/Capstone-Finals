<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Models\User;
use App\Models\AuditLog;
use App\Services\TwoFactorService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(
        protected TwoFactorService $twoFactorService
    ) {}

    /**
     * POST /api/auth/login
     * Authenticate user and return Sanctum token.
     * If role requires 2FA, return a limited token and send OTP.
     */
    public function login(LoginRequest $request): JsonResponse
    {

        $user = User::with('role', 'department')->where('email', $request->email)->first();

        // Check if user exists
        if (!$user) {
            AuditLog::log('LOGIN_FAILED', null, null, null, null, null, false, "Unknown email: {$request->email}");
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Check if account is locked
        if ($user->isLocked()) {
            $minutes = $user->locked_until ? now()->diffInMinutes($user->locked_until) : 30;
            AuditLog::log('LOGIN_BLOCKED', $user->id, 'App\Models\User', $user->id, null, null, false, 'Account locked');
            return response()->json([
                'message' => "Account is locked. Try again in {$minutes} minute(s).",
                'locked' => true,
            ], 423);
        }

        // Check if account is suspended/inactive
        if (in_array($user->status, ['suspended', 'inactive'])) {
            return response()->json([
                'message' => 'Your account has been ' . $user->status . '. Contact the System Administrator.',
            ], 403);
        }

        // Verify password
        if (!Hash::check($request->password, $user->password)) {
            $this->handleFailedLogin($user);
            $remaining = 3 - $user->failed_login_attempts;
            throw ValidationException::withMessages([
                'email' => ["Invalid credentials. {$remaining} attempt(s) remaining before lockout."],
            ]);
        }

        // Password is correct — reset failed attempts
        $user->update([
            'failed_login_attempts' => 0,
            'locked_until' => null,
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
        ]);

        // Check if forced password change is required
        if ($user->requires_password_change) {
            $token = $user->createToken('password-change-pending', ['password_change_pending'])->plainTextToken;
            AuditLog::log('LOGIN_PASSWORD_CHANGE_REQUIRED', $user->id, 'App\Models\User', $user->id);
            return response()->json([
                'message' => 'Password change required.',
                'requires_password_change' => true,
                'token' => $token,
                'user' => $this->formatUserResponse($user),
            ]);
        }

        // Check if 2FA is required
        if ($user->requires2FA()) {
            // Generate OTP and return limited token
            $otp = $this->twoFactorService->generateOTP($user);

            // Create a limited token (cannot access protected routes)
            $token = $user->createToken('2fa-pending', ['2fa_pending'])->plainTextToken;

            AuditLog::log('LOGIN_2FA_PENDING', $user->id, 'App\Models\User', $user->id);

            return response()->json([
                'message' => 'Two-factor authentication required. OTP sent to your email.',
                'requires_2fa' => true,
                'token' => $token,
                'user' => $this->formatUserResponse($user),
                // Include OTP in dev mode for testing convenience
                'dev_otp' => config('app.debug') ? $otp : null,
            ]);
        }

        // No 2FA needed — issue full token
        $token = $user->createToken('procureseal-auth', ['2fa_verified'])->plainTextToken;

        AuditLog::log('LOGIN_SUCCESS', $user->id, 'App\Models\User', $user->id);

        return response()->json([
            'message' => 'Login successful.',
            'token' => $token,
            'user' => $this->formatUserResponse($user),
        ]);
    }

    /**
     * POST /api/auth/verify-2fa
     * Verify OTP code and upgrade token to full access.
     */
    public function verify2FA(Request $request): JsonResponse
    {
        $request->validate([
            'otp' => 'required|string|size:6',
        ]);

        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if (!$this->twoFactorService->verifyOTP($user, $request->otp)) {
            AuditLog::log('2FA_FAILED', $user->id, 'App\Models\User', $user->id, null, null, false);
            return response()->json([
                'message' => 'Invalid or expired OTP code.',
            ], 422);
        }

        // Revoke the limited 2FA-pending token
        $user->currentAccessToken()->delete();

        // Issue full-access token
        $token = $user->createToken('procureseal-auth', ['2fa_verified'])->plainTextToken;

        AuditLog::log('2FA_VERIFIED', $user->id, 'App\Models\User', $user->id);

        return response()->json([
            'message' => 'Two-factor authentication verified.',
            'token' => $token,
            'user' => $this->formatUserResponse($user),
        ]);
    }

    /**
     * POST /api/auth/change-password
     * Force user to change password on first login
     */
    public function forceChangePassword(ChangePasswordRequest $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || !$user->currentAccessToken()->can('password_change_pending')) {
            return response()->json(['message' => 'Invalid or missing password change token.'], 403);
        }

        $user->update([
            'password' => $request->password, // cast handles hashing
            'requires_password_change' => false,
        ]);

        // Revoke the limited password-change token
        $user->currentAccessToken()->delete();

        // Check if 2FA is required after password change
        if ($user->requires2FA()) {
            $otp = $this->twoFactorService->generateOTP($user);
            $token = $user->createToken('2fa-pending', ['2fa_pending'])->plainTextToken;
            AuditLog::log('LOGIN_2FA_PENDING', $user->id, 'App\Models\User', $user->id);

            return response()->json([
                'message' => 'Password changed. Two-factor authentication required.',
                'requires_2fa' => true,
                'token' => $token,
                'user' => $this->formatUserResponse($user),
                'dev_otp' => config('app.debug') ? $otp : null,
            ]);
        }

        // No 2FA needed - issue full token
        $token = $user->createToken('procureseal-auth', ['2fa_verified'])->plainTextToken;

        AuditLog::log('PASSWORD_CHANGED_INITIAL', $user->id, 'App\Models\User', $user->id);

        return response()->json([
            'message' => 'Password updated successfully.',
            'token' => $token,
            'user' => $this->formatUserResponse($user),
        ]);
    }

    /**
     * POST /api/auth/logout
     * Revoke the current token.
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        // Revoke current token
        $user->currentAccessToken()->delete();

        AuditLog::log('LOGOUT', $user->id, 'App\Models\User', $user->id);

        return response()->json(['message' => 'Logged out successfully.']);
    }

    /**
     * GET /api/auth/me
     * Return current authenticated user with role and permissions.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('role', 'department');

        return response()->json([
            'user' => $this->formatUserResponse($user),
        ]);
    }

    // ─── Private Helpers ────────────────────────────────

    /**
     * Handle failed login attempt — increment counter, lock if threshold reached.
     */
    private function handleFailedLogin(User $user): void
    {
        $attempts = $user->failed_login_attempts + 1;
        $updateData = ['failed_login_attempts' => $attempts];

        // Lock after 3 failed attempts (30-minute lock per SRS)
        if ($attempts >= 3) {
            $updateData['status'] = 'locked';
            $updateData['locked_until'] = now()->addMinutes(30);

            AuditLog::log('ACCOUNT_LOCKED', $user->id, 'App\Models\User', $user->id, null, null, false,
                "Account locked after {$attempts} failed attempts");
        }

        $user->update($updateData);

        AuditLog::log('LOGIN_FAILED', $user->id, 'App\Models\User', $user->id, null, null, false,
            "Failed attempt #{$attempts}");
    }

    /**
     * Format user response with role, department, and permissions.
     */
    private function formatUserResponse(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'designation' => $user->designation,
            'phone' => $user->phone,
            'status' => $user->status,
            'role' => $user->role ? [
                'id' => $user->role->id,
                'name' => $user->role->name,
                'display_name' => $user->role->display_name,
                'permissions' => $user->role->permissions,
                'requires_2fa' => $user->role->requires_2fa,
            ] : null,
            'department' => $user->department ? [
                'id' => $user->department->id,
                'name' => $user->department->name,
                'code' => $user->department->code,
            ] : null,
        ];
    }
}
