<?php

namespace App\Policies;

use App\Models\Announcement;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class AnnouncementPolicy
{
    // Visible to its targets (visibleTo) and always to its author; anyone else gets 404.
    public function view(User $user, Announcement $announcement): Response
    {
        return $announcement->author_id === $user->id || Announcement::visibleTo($user)->whereKey($announcement->getKey())->exists()
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    // Admin, or asisten_aktif coordinator (CLAUDE.md §5.6). Also guards GET /announcements/sent.
    public function create(User $user): bool
    {
        return $user->isAdmin() || $user->isCoordinator();
    }

    public function delete(User $user, Announcement $announcement): Response
    {
        $view = $this->view($user, $announcement);
        if ($view->denied()) {
            return $view;
        }

        return $user->isAdmin() || $announcement->author_id === $user->id ? Response::allow() : Response::deny();
    }
}
