<?php

namespace App\Http\Controllers;

use App\Models\ProcurementNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class NotificationController extends Controller
{
    private const UNREAD_COUNT_CACHE_TTL_SECONDS = 10;

    /**
     * List notifications for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $query = ProcurementNotification::where('recipient_id', $request->user()->id)
            ->orderByDesc('created_at');

        if ($request->has('unread_only') && $request->boolean('unread_only')) {
            $query->unread();
        }

        if ($request->has('priority')) {
            $query->byPriority($request->input('priority'));
        }

        $notifications = $query->paginate($request->input('per_page', 20));

        return response()->json($notifications);
    }

    /**
     * Get unread count.
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $count = Cache::remember(
            $this->unreadCountCacheKey($userId),
            now()->addSeconds(self::UNREAD_COUNT_CACHE_TTL_SECONDS),
            fn () => ProcurementNotification::where('recipient_id', $userId)->unread()->count()
        );

        return response()->json(['unread_count' => $count]);
    }

    /**
     * Mark a single notification as read.
     */
    public function markAsRead(Request $request, ProcurementNotification $notification): JsonResponse
    {
        if ($notification->recipient_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $notification->markAsRead();
        $this->forgetUnreadCountCache($request->user()->id);

        return response()->json(['message' => 'Marked as read']);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllRead(Request $request): JsonResponse
    {
        ProcurementNotification::where('recipient_id', $request->user()->id)
            ->unread()
            ->update(['read_at' => now()]);

        $this->forgetUnreadCountCache($request->user()->id);

        return response()->json(['message' => 'All notifications marked as read']);
    }

    /**
     * Delete a notification.
     */
    public function destroy(Request $request, ProcurementNotification $notification): JsonResponse
    {
        if ($notification->recipient_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $notification->delete();
        $this->forgetUnreadCountCache($request->user()->id);

        return response()->json(['message' => 'Notification deleted']);
    }

    private function unreadCountCacheKey(int $userId): string
    {
        return "notifications:unread-count:user:{$userId}";
    }

    private function forgetUnreadCountCache(int $userId): void
    {
        Cache::forget($this->unreadCountCacheKey($userId));
    }
}
