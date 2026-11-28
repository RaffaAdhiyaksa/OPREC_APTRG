<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAnnouncementRequest;
use App\Http\Resources\AnnouncementResource;
use App\Models\Announcement;
use App\Notifications\AnnouncementPublished;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Notification;

class AnnouncementController extends Controller
{
    // GET /announcements: what targets me (admin: everything), newest first.
    public function index(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();

        $announcements = Announcement::visibleTo($user)
            ->withViewerState($user)
            ->when($request->boolean('unread'), fn ($q) => $q
                ->where('author_id', '!=', $user->id)
                ->whereDoesntHave('readers', fn ($r) => $r->whereKey($user->id)))
            ->latest()->latest('id')
            ->paginate($this->perPage($request))
            ->withQueryString();

        return AnnouncementResource::collection($announcements);
    }

    // GET /announcements/sent: what I wrote (admin and coordinators only).
    public function sent(Request $request): AnonymousResourceCollection
    {
        Gate::authorize('create', Announcement::class);

        $announcements = Announcement::where('author_id', $request->user()->id)
            ->withViewerState($request->user())
            ->latest()->latest('id')
            ->paginate($this->perPage($request))
            ->withQueryString();

        return AnnouncementResource::collection($announcements);
    }

    public function store(StoreAnnouncementRequest $request): JsonResponse
    {
        $user = $request->user();

        // Coordinators always reach the interns of their own research division (CLAUDE.md §5.6).
        $target = $user->isAdmin()
            ? ['research_division_id' => $request->validated('research_division_id'), 'target_role' => $request->validated('target_role')]
            : ['research_division_id' => $user->research_division_id, 'target_role' => Role::AsistenMagang];

        // One transaction: if any notification fails, the announcement is rolled back too.
        $announcement = DB::transaction(function () use ($request, $target, $user) {
            $announcement = new Announcement([...$request->safe()->only(['title', 'body']), ...$target, 'author_id' => $user->id]);
            $recipients = $announcement->recipients()->get();
            $announcement->recipients_count = $recipients->count();
            $announcement->save();
            Notification::send($recipients, new AnnouncementPublished($announcement));

            return $announcement;
        });

        return $this->present($announcement, $request)->response()->setStatusCode(201);
    }

    public function show(Request $request, Announcement $announcement): AnnouncementResource
    {
        Gate::authorize('view', $announcement);

        return $this->present($announcement, $request);
    }

    // POST /announcements/{announcement}/read: idempotent; also clears the matching notification.
    public function read(Request $request, Announcement $announcement): JsonResponse
    {
        Gate::authorize('view', $announcement);
        $user = $request->user();

        DB::table('announcement_reads')->insertOrIgnore([
            'announcement_id' => $announcement->id, 'user_id' => $user->id,
            'read_at' => now(), 'created_at' => now(), 'updated_at' => now(),
        ]);
        $user->unreadNotifications()
            ->where('type', 'announcement')
            ->where('data->announcement_id', $announcement->id)
            ->update(['read_at' => now()]);

        return response()->json(['message' => 'Pengumuman ditandai sudah dibaca.']);
    }

    public function destroy(Announcement $announcement): JsonResponse
    {
        Gate::authorize('delete', $announcement);

        DB::transaction(function () use ($announcement) {
            DatabaseNotification::where('type', 'announcement')->where('data->announcement_id', $announcement->id)->delete();
            $announcement->delete(); // announcement_reads cascade
        });

        return response()->json(['message' => 'Pengumuman dihapus.']);
    }

    private function present(Announcement $announcement, Request $request): AnnouncementResource
    {
        return new AnnouncementResource(Announcement::whereKey($announcement->id)->withViewerState($request->user())->firstOrFail());
    }
}
