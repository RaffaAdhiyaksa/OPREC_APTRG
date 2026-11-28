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
use Illuminate\Notifications\DatabaseNotification;

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

    // Adds is_read (for $viewer), read_count and recipients_count (= notifications actually sent).
    #[Scope]
    protected function withViewerState(Builder $query, User $viewer): void
    {
        $query->with(['author:id,name', 'division:id,slug,name'])
            ->withExists(['readers as is_read' => fn (Builder $q) => $q->whereKey($viewer->id)])
            ->withCount('readers as read_count')
            ->addSelect(['recipients_count' => DatabaseNotification::query()
                ->selectRaw('count(*)')
                ->where('type', 'announcement')
                ->whereColumn('data->announcement_id', 'announcements.id')]);
    }

    // Active users the announcement targets, never its author (PRD §5.26–5.27).
    public function recipients(): Builder
    {
        return User::query()
            ->where('is_active', true)
            ->whereKeyNot($this->author_id)
            ->when($this->research_division_id, fn (Builder $q, int $id) => $q->where('research_division_id', $id))
            ->when($this->target_role, fn (Builder $q, Role $role) => $q->where('role', $role));
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
