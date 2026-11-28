<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

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
}
