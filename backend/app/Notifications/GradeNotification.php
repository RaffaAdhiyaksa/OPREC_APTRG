<?php

namespace App\Notifications;

use App\Models\Grade;
use Illuminate\Notifications\Notification;

// grade_published and grade_updated share one shape; sent synchronously (no ShouldQueue).
class GradeNotification extends Notification
{
    public function __construct(public Grade $grade, public string $type) {}

    public static function published(Grade $grade): self
    {
        return new self($grade, 'grade_published');
    }

    public static function updated(Grade $grade): self
    {
        return new self($grade, 'grade_updated');
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function databaseType(object $notifiable): string
    {
        return $this->type;
    }

    public function toArray(object $notifiable): array
    {
        $title = $this->grade->assignment->title;

        return [
            'title' => $this->type === 'grade_published' ? "Nilai {$title} sudah keluar" : "Nilai {$title} diperbarui",
            'excerpt' => 'Skor: '.(float) $this->grade->score,
            'link' => '/assignments/'.$this->grade->assignment_id,
            'assignment_id' => $this->grade->assignment_id,
            'grade_id' => $this->grade->id,
        ];
    }
}
