<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

// Always scoped to $request->user()->notifications(), so another user's notification is a 404.
class NotificationController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();

        $notifications = $user->notifications()
            ->when($request->boolean('unread'), fn ($q) => $q->whereNull('read_at'))
            ->paginate($this->perPage($request))
            ->withQueryString();

        return NotificationResource::collection($notifications)
            ->additional(['meta' => ['unread_count' => $user->unreadNotifications()->count()]]);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        return response()->json(['data' => ['count' => $request->user()->unreadNotifications()->count()]]);
    }

    public function read(Request $request, string $id): NotificationResource
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->markAsRead();

        return new NotificationResource($notification);
    }

    public function readAll(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return response()->json(['message' => 'Semua notifikasi ditandai sudah dibaca.']);
    }
}
