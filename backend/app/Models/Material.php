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

    protected function casts(): array
    {
        return [
            'source_type' => MaterialSourceType::class,
            'sort_order' => 'integer',
            'is_published' => 'boolean',
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
