<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/** @mixin User */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $staff = $this->isAdmin() || $this->isAktif();

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'nim' => $this->nim,
            'phone' => $this->phone,
            'role' => $this->role,
            'is_coordinator' => $this->is_coordinator,
            'is_active' => $this->is_active,
            'must_change_password' => $this->must_change_password,
            'research_division' => $this->researchDivision?->only(['id', 'slug', 'name']),
            'competition_divisions' => $this->competitionDivisions->map(fn ($division) => [
                'id' => $division->id,
                'name' => $division->name,
                'team_name' => $division->team_name,
                'position' => $division->pivot->position,
            ]),
            // UI hints only; the backend still authorizes every request.
            'permissions' => array_keys(array_filter([
                'material.manage' => $staff,
                'assignment.manage' => $staff,
                'grade.publish' => $staff,
                'announcement.send' => $this->isAdmin() || $this->isCoordinator(),
                'user.manage' => $this->isAdmin(),
            ])),
            'avatar_url' => $this->avatar_path ? Storage::disk('public')->url($this->avatar_path) : null,
            'last_login_at' => $this->last_login_at,
            'created_at' => $this->created_at,
            'unread_notifications_count' => $this->whenCounted('unreadNotifications'),
        ];
    }
}
