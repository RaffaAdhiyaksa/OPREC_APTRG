<?php

use App\Http\Middleware\EnsureCoordinator;
use App\Http\Middleware\EnsurePasswordChanged;
use App\Http\Middleware\EnsureRole;
use App\Http\Middleware\EnsureUserIsActive;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'active' => EnsureUserIsActive::class,
            'pwd.changed' => EnsurePasswordChanged::class,
            'role' => EnsureRole::class,
            'coordinator' => EnsureCoordinator::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // API error envelope: { message, code, errors? }. Before this runs, Laravel turns
        // AuthorizationException into a 403 and ModelNotFoundException into a 404 HttpException,
        // so matching on the HTTP status also covers abort(403/404) and never leaks model names.
        $exceptions->render(function (Throwable $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            if ($e instanceof AuthenticationException) {
                return response()->json(['message' => 'Tidak terautentikasi.', 'code' => 'UNAUTHENTICATED'], 401);
            }
            if ($e instanceof ValidationException) {
                return response()->json(['message' => $e->getMessage(), 'code' => 'VALIDATION_ERROR', 'errors' => $e->errors()], 422);
            }

            $known = [
                403 => ['Anda tidak memiliki akses.', 'FORBIDDEN'],
                404 => ['Data tidak ditemukan.', 'NOT_FOUND'],
                // PostTooLargeException: the body exceeded PHP post_max_size before Laravel could validate it.
                413 => ['Ukuran data melebihi batas server. Gunakan link Google Drive untuk file besar.', 'PAYLOAD_TOO_LARGE'],
                429 => ['Terlalu banyak percobaan. Coba lagi nanti.', 'TOO_MANY_REQUESTS'],
            ];
            if ($e instanceof HttpExceptionInterface && isset($known[$status = $e->getStatusCode()])) {
                [$message, $code] = $known[$status];

                return response()->json(['message' => $message, 'code' => $code], $status, $e->getHeaders());
            }

            return null;
        });
    })->create();
