<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

// Shared by PATCH /admin/users/{user}/status and PATCH /admin/divisions/{division}: both take only { is_active }.
class UpdateActiveStatusRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'is_active' => ['required', 'boolean'],
        ];
    }
}
