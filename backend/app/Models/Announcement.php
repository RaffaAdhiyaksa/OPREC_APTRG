<?php

namespace App\Models;

use App\Enums\Role;
use Database\Factories\AnnouncementFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable(['author_id', 'title', 'body', 'research_division_id', 'target_role'])]
class Announcement extends Model
{
    /** @use HasFactory<AnnouncementFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'target_role' => Role::class,
        ];
    }

    // PRD §5.29: admin sees all; others see (own division OR global) AND (own role OR all roles).
    #[Scope]
    protected function visibleTo(Builder $query, User $user): void
    {
        if ($user->isAdmin()) {
            return;
        }

        $query
            ->where(fn (Builder $q) => $q->whereNull('research_division_id')->orWhere('research_division_id', $user->research_division_id))
            ->where(fn (Builder $q) => $q->whereNull('target_role')->orWhere('target_role', $user->role));
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class, 'research_division_id');
    }

    public function readers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'announcement_reads')->withPivot('read_at')->withTimestamps();
    }
}
