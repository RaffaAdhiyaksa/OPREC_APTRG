<?php

use App\Http\Controllers\Api\V1\Admin\DashboardController;
use App\Http\Controllers\Api\V1\Admin\UserController;
use App\Http\Controllers\Api\V1\AssignmentController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\DivisionController;
use App\Http\Controllers\Api\V1\MaterialController;
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
