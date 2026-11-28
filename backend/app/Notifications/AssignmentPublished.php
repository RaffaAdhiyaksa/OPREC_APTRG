<?php

namespace App\Notifications;

use App\Models\Assignment;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

// Sent synchronously (no ShouldQueue): one row per intern, small divisions.
class AssignmentPublished extends Notification
{
    public function __construct(public Assignment $assignment) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    // Stored in notifications.type; matches the frontend NotificationType.
    public function databaseType(object $notifiable): string
    {
        return 'assignment_published';
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Tugas baru: '.$this->assignment->title,
            'excerpt' => Str::limit($this->assignment->description, 120),
            'link' => '/assignments/'.$this->assignment->id,
            'assignment_id' => $this->assignment->id,
        ];
    }
}
