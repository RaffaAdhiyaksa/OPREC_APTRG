<?php

namespace App\Console\Commands;

use App\Enums\AssignmentStatus;
use App\Models\Assignment;
use App\Models\User;
use App\Notifications\DeadlineReminder;
use Illuminate\Console\Command;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\Notification;

// Scheduled hourly (routes/console.php). Safe to run any number of times: an intern who already
// got a reminder for an assignment is skipped.
class RemindDeadlines extends Command
{
    protected $signature = 'lms:remind-deadlines';

    protected $description = 'Notify interns who have not submitted an assignment due within 24 hours';

    public function handle(): int
    {
        $sent = 0;

        $assignments = Assignment::where('status', AssignmentStatus::Published)
            ->whereBetween('due_at', [now(), now()->addDay()])
            ->get();

        foreach ($assignments as $assignment) {
            $alreadyReminded = DatabaseNotification::where('type', 'deadline_reminder')
                ->where('data->assignment_id', $assignment->id)
                ->pluck('notifiable_id');

            $interns = $assignment->interns()
                ->whereDoesntHave('submissions', fn ($q) => $q->where('assignment_id', $assignment->id))
                ->whereNotIn('users.id', $alreadyReminded)
                ->get();

            Notification::send($interns, new DeadlineReminder($assignment));
            $sent += $interns->count();
        }

        $this->info("{$sent} pengingat deadline dikirim.");

        return self::SUCCESS;
    }
}
