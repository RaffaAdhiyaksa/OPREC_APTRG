<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

// Self-service profile: only name, phone and avatar. Email, role and division stay admin-only.
class UpdateProfileRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'avatar' => ['sometimes', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ];
    }
}
