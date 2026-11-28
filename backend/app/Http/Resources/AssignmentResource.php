<?php

namespace App\Http\Resources;

use App\Enums\AssignmentStatus;
use App\Enums\GradeStatus;
use App\Models\Assignment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Staff (aktif/admin) get `stats`. Interns get their own submission and their own *published*
 * grade instead (CLAUDE.md §5.5). The controller eager-loads exactly those rows; the filters
 * below repeat the rule so a missing eager load can never expose another intern's or a draft grade.
 *
 * @mixin Assignment
 */
class AssignmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();
        $intern = $user->isMagang();
        $submission = $intern ? $this->submissions->firstWhere('user_id', $user->id) : null;
        $grade = $intern
            ? $this->grades->first(fn ($g) => $g->user_id === $user->id && $g->status === GradeStatus::Published)
            : null;

        return [
            'id' => $this->id,
            'division' => $this->division->only(['id', 'slug', 'name']),
            'title' => $this->title,
            'description' => $this->description,
            'due_at' => $this->due_at,
            'allow_late' => $this->allow_late,
            'max_file_size_mb' => $this->max_file_size_mb,
            'allowed_extensions' => $this->allowed_extensions,
            'max_score' => $this->max_score,
            'status' => $this->status,
            'published_at' => $this->published_at,
            'author' => $this->creator->only(['id', 'name']),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            $this->mergeUnless($intern, fn () => ['stats' => [
                'total_interns' => $this->total_interns,
                'submitted' => $this->submitted,
                'late' => $this->late,
                'graded_draft' => $this->graded_draft,
                'graded_published' => $this->graded_published,
            ]]),
            $this->mergeWhen($intern, fn () => [
                'is_overdue' => $this->isOverdue(),
                'can_submit' => $this->status === AssignmentStatus::Published && (! $this->isOverdue() || $this->allow_late) && $grade === null,
                'my_submission' => $submission ? new SubmissionResource($submission) : null,
                'my_grade' => $grade ? new GradeResource($grade) : null,
            ]),
        ];
    }
}
