<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware to ensure 2FA verification is completed for roles that require it.
 * Applied after auth:sanctum. Checks if the user's token has 2fa_verified ability.
 */
class Ensure2FAVerified
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // 1. Check if user requires a forced password change
        if ($user->requires_password_change) {
            return response()->json([
                'message' => 'Password change required.',
                'requires_password_change' => true,
            ], 403);
        }

        // 2. If user's role requires 2FA and token doesn't have 2fa_verified ability
        if ($user->requires2FA()) {
            $token = $user->currentAccessToken();
            if ($token && !$token->can('2fa_verified')) {
                return response()->json([
                    'message' => 'Two-factor authentication required.',
                    'requires_2fa' => true,
                ], 403);
            }
        }

        return $next($request);
    }
}
