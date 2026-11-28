<?php

namespace App\Models;

use App\Enums\AssignmentStatus;
use App\Enums\GradeStatus;
use App\Enums\Role;
use Database\Factories\AssignmentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'division_id', 'created_by', 'title', 'description', 'due_at', 'allow_late',
    'max_file_size_mb', 'allowed_extensions', 'max_score', 'status', 'published_at',
])]
class Assignment extends Model
{
    /** @use HasFactory<AssignmentFactory> */
    use HasFactory, SoftDeletes;

    protected $attributes = [
        'allow_late' => false,
        'max_file_size_mb' => 10,
        'max_score' => 100,
        'status' => 'draft',
    ];

    // withCount/loadCount spec for the staff `stats` block.
    // Every count is limited to interns who are active and *currently* in the assignment's division,
    // so an intern who moved division or was deactivated no longer skews the numbers.
    public static function statsCounts(): array
    {
        $current = fn (Builder $q) => $q->whereHas('user', fn (Builder $u) => $u
            ->where('role', Role::AsistenMagang)
            ->where('is_active', true)
            ->whereColumn('users.research_division_id', 'assignments.division_id'));

        return [
            'interns as total_interns',
            'submissions as submitted' => $current,
            'submissions as late' => fn (Builder $q) => $current($q)->where('is_late', true),
            'grades as graded_draft' => fn (Builder $q) => $current($q)->where('status', GradeStatus::Draft),
            'grades as graded_published' => fn (Builder $q) => $current($q)->where('status', GradeStatus::Published),
        ];
    }

    public function isOverdue(): bool
    {
        return $this->due_at->isPast();
    }

    // Same visibility rule as Material::visibleTo, with interns limited to published assignments.
    #[Scope]
    protected function visibleTo(Builder $query, User $user): void
    {
        if ($user->isAdmin()) {
            return;
        }

        $query->where('division_id', $user->research_division_id)
            ->when($user->isMagang(), fn (Builder $q) => $q->where('status', AssignmentStatus::Published));
    }

    protected function casts(): array
    {
        return [
            'due_at' => 'datetime',
            'allow_late' => 'boolean',
            'max_file_size_mb' => 'integer',
            'allowed_extensions' => 'array',
            'max_score' => 'integer',
            'status' => AssignmentStatus::class,
            'published_at' => 'datetime',
        ];
    }

    #[Scope]
    protected function forDivision(Builder $query, int $divisionId): void
    {
        $query->where('division_id', $divisionId);
    }

    #[Scope]
    protected function published(Builder $query): void
    {
        $query->where('status', AssignmentStatus::Published);
    }

    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(Submission::class);
    }

    public function grades(): HasMany
    {
        return $this->hasMany(Grade::class);
    }

    // Active asisten_magang of the assignment's division: stats denominator and notification recipients.
    public function interns(): HasMany
    {
        return $this->hasMany(User::class, 'research_division_id', 'division_id')
            ->where('role', Role::AsistenMagang)
            ->where('is_active', true);
    }
}
