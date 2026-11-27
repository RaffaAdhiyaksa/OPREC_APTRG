<?php

namespace App\Models;

use App\Enums\AssignmentStatus;
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
}
