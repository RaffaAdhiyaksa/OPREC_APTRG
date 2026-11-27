<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// All endpoints live under /api/v1 and return JSON only.
Route::prefix('v1')->group(function () {
    Route::get('/health', fn () => response()->json(['data' => ['status' => 'ok']]));

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/auth/me', fn (Request $request) => response()->json(['data' => $request->user()]));
    });
});
