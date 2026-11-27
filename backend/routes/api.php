<?php

use App\Http\Controllers\Api\V1\AuthController;
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

    // Default group for every following feature endpoint.
    Route::middleware(['auth:sanctum', 'active', 'pwd.changed'])->group(function () {
        //
    });
});
