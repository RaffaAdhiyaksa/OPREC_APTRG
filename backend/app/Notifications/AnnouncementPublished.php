<?php

namespace App\Notifications;

use App\Models\Announcement;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

// Sent synchronously (no ShouldQueue) to every active recipient of the announcement.
class AnnouncementPublished extends Notification
{
    public function __construct(public Announcement $announcement) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function databaseType(object $notifiable): string
    {
        return 'announcement';
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'announcement',
            'title' => $this->announcement->title,
            'excerpt' => Str::limit($this->announcement->body, 120),
            // The frontend opens the announcement dialog from this query parameter.
            'link' => '/announcements?open='.$this->announcement->id,
            'announcement_id' => $this->announcement->id,
        ];
    }
}
