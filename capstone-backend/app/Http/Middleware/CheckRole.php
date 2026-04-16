<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware to check if the authenticated user has one of the required roles.
 * Usage in routes: ->middleware('role:system_admin,hope,bac_secretariat')
 */
class CheckRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if (!$user->role) {
            return response()->json(['message' => 'No role assigned to this account.'], 403);
        }

        if (!in_array($user->role->name, $roles)) {
            return response()->json([
                'message' => 'Access denied. Required role(s): ' . implode(', ', $roles),
            ], 403);
        }

        return $next($request);
    }
}
