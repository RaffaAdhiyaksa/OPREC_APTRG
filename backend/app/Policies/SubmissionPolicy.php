<?php

namespace App\Policies;

use App\Models\Submission;
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Support\Facades\Gate;

class SubmissionPolicy
{
    // Download: the owner, staff who may edit the assignment (aktif of its division, admin).
    // Everyone else gets 404 so other interns cannot probe submission ids.
    public function view(User $user, Submission $submission): Response
    {
        $assignment = $submission->assignment;
        if ($assignment === null) {
            return Response::denyAsNotFound();
        }

        $allowed = $user->isMagang()
            ? $submission->user_id === $user->id && Gate::forUser($user)->allows('view', $assignment)
            : Gate::forUser($user)->allows('update', $assignment);

        return $allowed ? Response::allow() : Response::denyAsNotFound();
    }
}
