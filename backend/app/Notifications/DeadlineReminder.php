<?php

namespace App\Notifications;

use App\Models\Assignment;
use Illuminate\Notifications\Notification;

// Sent synchronously by lms:remind-deadlines, once per intern per assignment.
class DeadlineReminder extends Notification
{
    public function __construct(public Assignment $assignment) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function databaseType(object $notifiable): string
    {
        return 'deadline_reminder';
    }

    public function toArray(object $notifiable): array
    {
        $due = $this->assignment->due_at->timezone('Asia/Jakarta')->locale('id')->translatedFormat('d M Y H:i');

        return [
            'type' => 'deadline_reminder',
            'title' => 'Deadline: '.$this->assignment->title,
            'excerpt' => "Belum dikumpulkan. Batas pengumpulan {$due} WIB.",
            'link' => '/assignments/'.$this->assignment->id,
            'assignment_id' => $this->assignment->id,
        ];
    }
}
