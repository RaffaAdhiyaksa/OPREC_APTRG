<?php

namespace App\Policies;

use App\Models\Material;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class MaterialPolicy
{
    // Not visible (other division, or unpublished for interns) is a 404 so existence never leaks.
    public function view(User $user, Material $material): Response
    {
        return Material::visibleTo($user)->whereKey($material->getKey())->exists()
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    public function create(User $user): bool
    {
        return $user->isAdmin() || $user->isAktif();
    }

    // Also covers delete and reorder.
    public function update(User $user, Material $material): Response
    {
        $view = $this->view($user, $material);
        if ($view->denied()) {
            return $view;
        }

        return $this->create($user) ? Response::allow() : Response::deny();
    }
}
