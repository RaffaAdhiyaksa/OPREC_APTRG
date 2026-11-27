<?php

namespace App\Models;

use App\Enums\Role;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable([
    'name', 'email', 'nim', 'phone', 'password', 'role', 'research_division_id',
    'is_coordinator', 'is_active', 'must_change_password', 'avatar_path', 'last_login_at',
])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'role' => Role::class,
            'is_coordinator' => 'boolean',
            'is_active' => 'boolean',
            'must_change_password' => 'boolean',
            'last_login_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        // RBAC invariants (PRD §5.1–5.2): only asisten_aktif can coordinate; admin has no research division.
        static::saving(function (User $user) {
            if ($user->role !== Role::AsistenAktif) {
                $user->is_coordinator = false;
            }
            if ($user->role === Role::Admin) {
                $user->research_division_id = null;
            }
        });
    }

    public function isAdmin(): bool
    {
        return $this->role === Role::Admin;
    }

    public function isAktif(): bool
    {
        return $this->role === Role::AsistenAktif;
    }

    public function isMagang(): bool
    {
        return $this->role === Role::AsistenMagang;
    }

    public function isCoordinator(): bool
    {
        return $this->isAktif() && $this->is_coordinator;
    }

    #[Scope]
    protected function forDivision(Builder $query, int $divisionId): void
    {
        $query->where('research_division_id', $divisionId);
    }

    public function researchDivision(): BelongsTo
    {
        return $this->belongsTo(Division::class, 'research_division_id');
    }

    public function competitionDivisions(): BelongsToMany
    {
        return $this->belongsToMany(Division::class, 'competition_members')->withPivot('position')->withTimestamps();
    }

    public function createdMaterials(): HasMany
    {
        return $this->hasMany(Material::class, 'created_by');
    }

    public function createdAssignments(): HasMany
    {
        return $this->hasMany(Assignment::class, 'created_by');
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(Submission::class);
    }

    public function grades(): HasMany
    {
        return $this->hasMany(Grade::class);
    }

    public function givenGrades(): HasMany
    {
        return $this->hasMany(Grade::class, 'graded_by');
    }

    public function authoredAnnouncements(): HasMany
    {
        return $this->hasMany(Announcement::class, 'author_id');
    }

    public function readAnnouncements(): BelongsToMany
    {
        return $this->belongsToMany(Announcement::class, 'announcement_reads')->withPivot('read_at')->withTimestamps();
    }
}
