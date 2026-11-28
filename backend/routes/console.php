<?php

use Illuminate\Support\Facades\Schedule;

// Needs the server cron `* * * * * php artisan schedule:run` (docs/DEPLOY.md).
Schedule::command('lms:remind-deadlines')->hourly()->withoutOverlapping();
