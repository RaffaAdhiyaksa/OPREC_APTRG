<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

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
            'role' => $this->role,
            'is_coordinator' => $this->is_coordinator,
            'is_active' => $this->is_active,
            'must_change_password' => $this->must_change_password,
            'research_division' => $this->researchDivision?->only(['id', 'slug', 'name']),
            'competition_divisions' => $this->competitionDivisions->map->only(['id', 'name', 'team_name']),
            // UI hints only; the backend still authorizes every request.
            'permissions' => array_keys(array_filter([
                'material.manage' => $staff,
                'assignment.manage' => $staff,
                'grade.publish' => $staff,
                'announcement.send' => $this->isAdmin() || $this->isCoordinator(),
                'user.manage' => $this->isAdmin(),
            ])),
            'unread_notifications_count' => $this->whenCounted('unreadNotifications'),
        ];
    }
}
