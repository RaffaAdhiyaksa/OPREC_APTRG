<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Per account+IP stops guessing one password; per IP stops spraying many accounts.
        RateLimiter::for('login', fn (Request $request) => [
            Limit::perMinute(5)->by('account:'.Str::lower((string) $request->input('login')).'|'.$request->ip()),
            Limit::perMinute(30)->by('ip:'.$request->ip()),
        ]);

        // Each submission can carry a 50 MB upload; 10 per minute per intern is plenty for retries.
        RateLimiter::for('submission', fn (Request $request) => Limit::perMinute(10)->by('submission:'.$request->user()?->id));
    }
}
