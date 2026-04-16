<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = AuditLog::with(['user.role'])->orderByDesc('created_at');

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->integer('user_id'));
        }

        if ($request->filled('action')) {
            $query->where('action', 'like', '%' . $request->string('action') . '%');
        }

        if ($request->filled('entity_type')) {
            $query->where('entity_type', 'like', '%' . $request->string('entity_type') . '%');
        }

        if ($request->filled('success')) {
            $query->where('success', filter_var($request->input('success'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE));
        }

        if ($search = trim((string) $request->input('search', ''))) {
            $query->where(function ($builder) use ($search) {
                $builder->where('action', 'like', '%' . $search . '%')
                    ->orWhere('description', 'like', '%' . $search . '%')
                    ->orWhere('entity_type', 'like', '%' . $search . '%')
                    ->orWhere('ip_address', 'like', '%' . $search . '%');
            });
        }

        $logs = $query->paginate($request->integer('per_page', 20));

        return response()->json([
            'data' => $logs->getCollection()->map(function (AuditLog $log) {
                return $this->transformAuditLog($log);
            })->values(),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
                'from' => $logs->firstItem(),
                'to' => $logs->lastItem(),
            ],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        return response()->json(['message' => 'Audit logs are read-only.'], 405);
    }

    /**
     * Display the specified resource.
     */
    public function show(AuditLog $auditLog): JsonResponse
    {
        return response()->json([
            'data' => $this->transformAuditLog($auditLog->load(['user.role'])),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        return response()->json(['message' => 'Audit logs are read-only.'], 405);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        return response()->json(['message' => 'Audit logs are read-only.'], 405);
    }

    private function transformAuditLog(AuditLog $log): array
    {
        return [
            'id' => $log->id,
            'action' => $log->action,
            'entity_type' => $log->entity_type,
            'entity_id' => $log->entity_id,
            'description' => $log->description,
            'success' => (bool) $log->success,
            'ip_address' => $log->ip_address,
            'user_agent' => $log->user_agent,
            'old_values' => $log->old_values,
            'new_values' => $log->new_values,
            'created_at' => optional($log->created_at)->toIso8601String(),
            'user' => $log->user ? [
                'id' => $log->user->id,
                'name' => $log->user->name,
                'role' => $log->user->role ? [
                    'id' => $log->user->role->id,
                    'name' => $log->user->role->name,
                    'display_name' => $log->user->role->display_name,
                ] : null,
            ] : null,
        ];
    }
}
