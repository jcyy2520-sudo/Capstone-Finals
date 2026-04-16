<?php

namespace App\Services;

use App\Models\User;
use App\Models\ProcurementNotification;
use Illuminate\Support\Facades\Cache;

/**
 * Two-Factor Authentication Service
 * Generates and verifies email-based OTP codes.
 * OTPs are stored in cache with 5-minute expiry per SRS Section 4.1.1.
 */
class TwoFactorService
{
    /**
     * Generate a 6-digit OTP for the user and store in cache.
     */
    public function generateOTP(User $user): string
    {
        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Store OTP in cache with 5-minute TTL
        Cache::put("2fa_otp_{$user->id}", $otp, now()->addMinutes(5));

        // In production, send via email/SMS. For now, log it.
        \Illuminate\Support\Facades\Log::info("2FA OTP for {$user->email}: {$otp}");

        return $otp;
    }

    /**
     * Verify an OTP code for the user.
     */
    public function verifyOTP(User $user, string $code): bool
    {
        $storedOTP = Cache::get("2fa_otp_{$user->id}");

        if (!$storedOTP || $storedOTP !== $code) {
            return false;
        }

        // OTP is single-use — remove after verification
        Cache::forget("2fa_otp_{$user->id}");

        return true;
    }

    /**
     * Check if an OTP exists (hasn't expired) for the user.
     */
    public function hasActiveOTP(User $user): bool
    {
        return Cache::has("2fa_otp_{$user->id}");
    }
}
