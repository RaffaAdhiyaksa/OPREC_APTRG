<?php

namespace App\Models;

use App\Enums\MaterialSourceType;
use Database\Factories\MaterialFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['division_id', 'created_by', 'title', 'description', 'source_type', 'url', 'sort_order', 'is_published'])]
class Material extends Model
{
    /** @use HasFactory<MaterialFactory> */
    use HasFactory;

    protected $attributes = ['is_published' => true, 'sort_order' => 0];

    protected function casts(): array
    {
        return [
            'source_type' => MaterialSourceType::class,
            'sort_order' => 'integer',
            'is_published' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        // source_type always follows the URL host (PRD §5.11), whatever the client sent.
        static::saving(fn (Material $material) => $material->source_type = MaterialSourceType::fromUrl($material->url));
    }

    // YouTube watch?v=, youtu.be/, shorts/ and embed/ links; null for anything else.
    public function embedUrl(): ?string
    {
        if ($this->source_type !== MaterialSourceType::Youtube) {
            return null;
        }

        $path = (string) parse_url($this->url, PHP_URL_PATH);
        parse_str((string) parse_url($this->url, PHP_URL_QUERY), $query);
        $id = match (true) {
            str_contains((string) parse_url($this->url, PHP_URL_HOST), 'youtu.be') => trim($path, '/'),
            (bool) preg_match('#^/(shorts|embed)/([^/?]+)#', $path, $m) => $m[2],
            default => $query['v'] ?? null,
        };

        return is_string($id) && preg_match('/^[\w-]{6,20}$/', $id) ? "https://www.youtube-nocookie.com/embed/{$id}" : null;
    }

    // Single visibility rule for lists, detail and writes (CLAUDE.md §5.1): own research division,
    // interns only published. Admin sees everything.
    #[Scope]
    protected function visibleTo(Builder $query, User $user): void
    {
        if ($user->isAdmin()) {
            return;
        }

        $query->where('division_id', $user->research_division_id)
            ->when($user->isMagang(), fn (Builder $q) => $q->where('is_published', true));
    }

    #[Scope]
    protected function forDivision(Builder $query, int $divisionId): void
    {
        $query->where('division_id', $divisionId);
    }

    #[Scope]
    protected function published(Builder $query): void
    {
        $query->where('is_published', true);
    }

    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
