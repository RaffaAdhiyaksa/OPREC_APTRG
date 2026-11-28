<?php

namespace App\Policies;

use App\Models\Assignment;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class AssignmentPolicy
{
    // Not visible (other division, or draft for interns) is a 404 so existence never leaks.
    public function view(User $user, Assignment $assignment): Response
    {
        return Assignment::visibleTo($user)->whereKey($assignment->getKey())->exists()
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    public function create(User $user): bool
    {
        return $user->isAdmin() || $user->isAktif();
    }

    // Also covers publish and delete.
    public function update(User $user, Assignment $assignment): Response
    {
        $view = $this->view($user, $assignment);
        if ($view->denied()) {
            return $view;
        }

        return $this->create($user) ? Response::allow() : Response::deny();
    }
}
