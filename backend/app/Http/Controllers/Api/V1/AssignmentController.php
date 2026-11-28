<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\AssignmentStatus;
use App\Enums\GradeStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAssignmentRequest;
use App\Http\Resources\AssignmentResource;
use App\Models\Assignment;
use App\Models\User;
use App\Notifications\AssignmentPublished;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Notification;

class AssignmentController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();

        $assignments = Assignment::visibleTo($user)
            ->with($this->relations($user))
            ->unless($user->isMagang(), fn ($q) => $q->withCount(Assignment::statsCounts()))
            ->when($user->isAdmin() && $request->filled('division_id'), fn ($q) => $q->where('division_id', $request->integer('division_id')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->status))
            ->when($request->filled('search'), fn ($q) => $q->where('title', 'like', '%'.$request->search.'%'))
            ->when($request->due === 'upcoming', fn ($q) => $q->where('due_at', '>=', now()))
            ->when($request->due === 'past', fn ($q) => $q->where('due_at', '<', now()))
            ->orderBy('due_at')->orderBy('id')
            ->paginate($this->perPage($request))
            ->withQueryString();

        return AssignmentResource::collection($assignments);
    }

    public function show(Request $request, Assignment $assignment): AssignmentResource
    {
        Gate::authorize('view', $assignment);

        return $this->present($assignment, $request->user());
    }

    public function store(StoreAssignmentRequest $request): JsonResponse
    {
        $assignment = Assignment::create([
            ...$request->safe()->except(['division_id', 'status']),
            'division_id' => $request->validated('division_id') ?? $request->user()->research_division_id,
            'created_by' => $request->user()->id,
            'status' => AssignmentStatus::Draft,
        ]);

        return $this->present($assignment, $request->user())->response()->setStatusCode(201);
    }

    public function update(StoreAssignmentRequest $request, Assignment $assignment): AssignmentResource
    {
        $assignment->update($request->validated());

        return $this->present($assignment, $request->user());
    }

    public function publish(Request $request, Assignment $assignment): JsonResponse|AssignmentResource
    {
        Gate::authorize('update', $assignment);

        // Atomic draft->published flip: of two concurrent publishes only one updates a row,
        // so interns are notified once.
        $published = Assignment::whereKey($assignment->getKey())
            ->where('status', AssignmentStatus::Draft)
            ->update(['status' => AssignmentStatus::Published, 'published_at' => now()]);

        if ($published === 0) {
            return response()->json([
                'message' => 'Tugas sudah dipublikasikan.',
                'code' => 'ALREADY_PUBLISHED',
                'errors' => ['status' => ['Tugas sudah dipublikasikan.']],
            ], 422);
        }

        $assignment->refresh();
        Notification::send($assignment->interns, new AssignmentPublished($assignment));

        return $this->present($assignment, $request->user());
    }

    public function destroy(Assignment $assignment): JsonResponse
    {
        Gate::authorize('update', $assignment);
        $assignment->delete();

        return response()->json(['message' => 'Tugas berhasil dihapus.']);
    }

    // Interns: only their own submission and their own *published* grade are loaded (CLAUDE.md §5.5).
    private function relations(User $user): array
    {
        return $user->isMagang()
            ? [
                'division', 'creator',
                'submissions' => fn ($q) => $q->where('user_id', $user->id),
                'grades' => fn ($q) => $q->where('user_id', $user->id)->where('status', GradeStatus::Published)->with('grader'),
            ]
            : ['division', 'creator'];
    }

    private function present(Assignment $assignment, User $user): AssignmentResource
    {
        $assignment->load($this->relations($user));
        if (! $user->isMagang()) {
            $assignment->loadCount(Assignment::statsCounts());
        }

        return new AssignmentResource($assignment);
    }
}
