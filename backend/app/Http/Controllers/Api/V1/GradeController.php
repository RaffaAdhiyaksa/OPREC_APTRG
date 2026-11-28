<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\GradeStatus;
use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Resources\GradeResource;
use App\Models\Assignment;
use App\Models\Grade;
use App\Models\User;
use App\Notifications\GradeNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class GradeController extends Controller
{
    // PUT /assignments/{assignment}/grades/{user}: create (always draft) or edit a grade.
    public function upsert(Request $request, Assignment $assignment, User $user): JsonResponse
    {
        Gate::authorize('update', $assignment);
        abort_unless($user->role === Role::AsistenMagang && $user->research_division_id === $assignment->division_id, 404);

        $data = $request->validate([
            'score' => ['required', 'numeric', 'min:0', 'max:'.$assignment->max_score],
            'feedback' => ['nullable', 'string', 'max:5000'],
        ]);

        $values = [
            ...$data,
            'graded_by' => $request->user()->id,
            'submission_id' => $assignment->submissions()->where('user_id', $user->id)->value('id'),
        ];

        // firstOrCreate falls back to createOrFirst: if a concurrent request inserted the first grade
        // between our lookup and insert, the unique key violation is caught and that row is returned.
        $grade = Grade::firstOrCreate(
            ['assignment_id' => $assignment->id, 'user_id' => $user->id],
            [...$values, 'status' => GradeStatus::Draft],
        );
        if (! $grade->wasRecentlyCreated) {
            $grade->update($values);
        }

        // A published grade stays published; the intern is told it changed.
        if ($grade->status === GradeStatus::Published && $grade->wasChanged(['score', 'feedback'])) {
            $user->notify(GradeNotification::updated($grade));
        }

        // 200 for create and edit alike (PRD §7.5); a JsonResource would answer 201 for a new row.
        return (new GradeResource($grade->load('grader')))->response()->setStatusCode(200);
    }

    // POST /assignments/{assignment}/grades/publish { user_ids? }: publish drafts in one atomic step.
    public function publish(Request $request, Assignment $assignment): JsonResponse
    {
        Gate::authorize('update', $assignment);
        $userIds = $request->validate([
            'user_ids' => ['sometimes', 'array'],
            'user_ids.*' => ['integer'],
        ])['user_ids'] ?? [];

        $grades = DB::transaction(function () use ($assignment, $userIds) {
            $drafts = $assignment->grades()
                ->where('status', GradeStatus::Draft)
                ->when($userIds, fn ($q) => $q->whereIn('user_id', $userIds))
                ->lockForUpdate()
                ->get();
            Grade::whereKey($drafts->modelKeys())->update(['status' => GradeStatus::Published, 'published_at' => now()]);

            return $drafts;
        });

        // Notify only after commit, once per grade that this request actually published.
        $grades->load('user', 'assignment')->each(fn (Grade $grade) => $grade->user?->notify(GradeNotification::published($grade->refresh())));

        return response()->json([
            'data' => ['published_count' => $grades->count()],
            'message' => "{$grades->count()} nilai berhasil dipublikasikan.",
        ]);
    }

    // POST /grades/{grade}/unpublish: back to draft (hidden from the intern again).
    public function unpublish(Grade $grade): GradeResource
    {
        abort_unless($grade->assignment, 404);
        Gate::authorize('update', $grade->assignment);

        $grade->update(['status' => GradeStatus::Draft, 'published_at' => null]);

        return new GradeResource($grade->load('grader'));
    }

    // GET /me/grades: the intern's own published grades only.
    public function mine(Request $request): JsonResponse
    {
        $user = $request->user();
        $grades = $user->grades()
            ->where('status', GradeStatus::Published)
            ->whereHas('assignment')
            ->with('assignment:id,title,max_score')
            ->orderByDesc('published_at')
            ->get();

        // Percent of each assignment's max_score, so assignments with different scales average fairly.
        $average = $grades->avg(fn (Grade $g) => $g->score / $g->assignment->max_score * 100);

        return response()->json([
            'data' => $grades->map(fn (Grade $g) => [
                'id' => $g->id,
                'assignment' => $g->assignment->only(['id', 'title', 'max_score']),
                'score' => (float) $g->score,
                'feedback' => $g->feedback,
                'published_at' => $g->published_at,
            ]),
            'meta' => [
                'average' => $average === null ? null : round($average, 1),
                'published_count' => $grades->count(),
                'assignments_total' => Assignment::visibleTo($user)->count(),
            ],
        ]);
    }
}
