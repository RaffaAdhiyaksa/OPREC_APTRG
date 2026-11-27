<?php

namespace App\Models;

use App\Enums\GradeStatus;
use Database\Factories\GradeFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['assignment_id', 'user_id', 'submission_id', 'graded_by', 'score', 'feedback', 'status', 'published_at'])]
class Grade extends Model
{
    /** @use HasFactory<GradeFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'score' => 'decimal:2',
            'status' => GradeStatus::class,
            'published_at' => 'datetime',
        ];
    }

    #[Scope]
    protected function published(Builder $query): void
    {
        $query->where('status', GradeStatus::Published);
    }

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(Assignment::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function submission(): BelongsTo
    {
        return $this->belongsTo(Submission::class);
    }

    public function grader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'graded_by');
    }
}
