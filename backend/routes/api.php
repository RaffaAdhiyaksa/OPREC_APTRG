<?php

use App\Http\Controllers\Api\V1\Admin\DashboardController;
use App\Http\Controllers\Api\V1\Admin\UserController;
use App\Http\Controllers\Api\V1\AnnouncementController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\AssignmentController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\DivisionController;
use App\Http\Controllers\Api\V1\GradeController;
use App\Http\Controllers\Api\V1\MaterialController;
use App\Http\Controllers\Api\V1\SubmissionController;
use Illuminate\Support\Facades\Route;

// All endpoints live under /api/v1 and return JSON only.
Route::prefix('v1')->group(function () {
    Route::get('/health', fn () => response()->json(['data' => ['status' => 'ok']]));

    Route::prefix('auth')->controller(AuthController::class)->group(function () {
        Route::post('/login', 'login')->middleware('throttle:login');

        Route::middleware('auth:sanctum')->group(function () {
            Route::post('/logout', 'logout');

            // No pwd.changed here: a user who must change their password still needs these two.
            Route::middleware('active')->group(function () {
                Route::get('/me', 'me');
                Route::put('/password', 'updatePassword');
            });
        });
    });

    // Default group for every feature endpoint.
    Route::middleware(['auth:sanctum', 'active', 'pwd.changed'])->group(function () {
        Route::get('/divisions', [DivisionController::class, 'index']);

        Route::patch('/materials/reorder', [MaterialController::class, 'reorder']);
        Route::apiResource('materials', MaterialController::class);

        Route::post('/assignments/{assignment}/publish', [AssignmentController::class, 'publish']);
        Route::apiResource('assignments', AssignmentController::class);

        Route::middleware('role:asisten_magang')->controller(SubmissionController::class)->group(function () {
            Route::post('/assignments/{assignment}/submission', 'store');
            Route::get('/assignments/{assignment}/submission', 'show');
            Route::delete('/assignments/{assignment}/submission', 'destroy');
        });
        Route::get('/assignments/{assignment}/submissions', [SubmissionController::class, 'index'])->middleware('role:asisten_aktif,admin');
        Route::get('/submissions/{submission}/download', [SubmissionController::class, 'download']);

        Route::middleware('role:asisten_aktif,admin')->controller(GradeController::class)->group(function () {
            Route::put('/assignments/{assignment}/grades/{user}', 'upsert');
            Route::post('/assignments/{assignment}/grades/publish', 'publish');
            Route::post('/grades/{grade}/unpublish', 'unpublish');
        });
        Route::get('/me/grades', [GradeController::class, 'mine'])->middleware('role:asisten_magang');

        Route::controller(AnnouncementController::class)->prefix('announcements')->group(function () {
            Route::get('/', 'index');
            Route::get('/sent', 'sent');
            Route::post('/', 'store');
            Route::get('/{announcement}', 'show');
            Route::post('/{announcement}/read', 'read');
            Route::delete('/{announcement}', 'destroy');
        });

        Route::controller(NotificationController::class)->prefix('notifications')->group(function () {
            Route::get('/', 'index');
            Route::get('/unread-count', 'unreadCount');
            Route::post('/read-all', 'readAll');
            Route::patch('/{id}/read', 'read');
        });

        Route::prefix('admin')->middleware('role:admin')->group(function () {
            Route::get('/dashboard', DashboardController::class);

            Route::controller(UserController::class)->prefix('users')->group(function () {
                Route::get('/', 'index');
                Route::post('/', 'store');
                Route::get('/{user}', 'show');
                Route::put('/{user}', 'update');
                Route::delete('/{user}', 'destroy');
                Route::patch('/{user}/status', 'updateStatus');
                Route::post('/{user}/reset-password', 'resetPassword');
                Route::put('/{user}/competition-divisions', 'syncCompetitionDivisions');
            });

            Route::patch('/divisions/{division}', [DivisionController::class, 'update']);
        });
    });
});
