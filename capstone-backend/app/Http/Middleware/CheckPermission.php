<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware to check if the authenticated user has a specific permission.
 * Usage in routes: ->middleware('permission:purchase_requisition,create')
 */
class CheckPermission
{
    public function handle(Request $request, Closure $next, string $module, string $action): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if (!$user->hasPermission($module, $action)) {
            return response()->json([
                'message' => "Access denied. You do not have permission: {$module}.{$action}",
            ], 403);
        }

        return $next($request);
    }
}
