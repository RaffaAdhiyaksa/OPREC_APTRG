<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

abstract class Controller
{
    // Business-rule error in the API envelope { message, code, errors?, meta? } (PRD §6.1).
    protected function fail(int $status, string $code, string $message, ?string $field = null, array $meta = []): JsonResponse
    {
        return response()->json(array_filter([
            'message' => $message,
            'code' => $code,
            'errors' => $field ? [$field => [$message]] : null,
            'meta' => $meta ?: null,
        ]), $status);
    }

    // ?per_page for paginated lists: default 15, clamped to 1..100 (CLAUDE.md §6).
    protected function perPage(Request $request): int
    {
        return min(max($request->integer('per_page', 15), 1), 100);
    }
}
