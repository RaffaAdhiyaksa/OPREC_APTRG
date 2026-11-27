<?php

namespace App\Models;

use App\Enums\DivisionType;
use Database\Factories\DivisionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['slug', 'name', 'type', 'team_name', 'is_optional', 'is_active', 'sort_order'])]
class Division extends Model
{
    /** @use HasFactory<DivisionFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'type' => DivisionType::class,
            'is_optional' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function researchMembers(): HasMany
    {
        return $this->hasMany(User::class, 'research_division_id');
    }

    public function competitionMembers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'competition_members')->withPivot('position')->withTimestamps();
    }

    public function materials(): HasMany
    {
        return $this->hasMany(Material::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class);
    }

    public function announcements(): HasMany
    {
        return $this->hasMany(Announcement::class, 'research_division_id');
    }
}
