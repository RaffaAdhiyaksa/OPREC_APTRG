<?php

namespace App\Http\Requests;

use App\Enums\DivisionType;
use App\Enums\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            // Unique among non-deleted users: a deleted account frees its email/NIM (DB index on active_email/active_nim).
            'email' => ['required', 'email', 'max:255', Rule::unique('users')->withoutTrashed()],
            'nim' => ['nullable', 'string', 'max:30', Rule::unique('users')->withoutTrashed()],
            'phone' => ['nullable', 'string', 'max:30'],
            'role' => ['required', Rule::enum(Role::class)],
            'research_division_id' => [
                Rule::requiredIf($this->input('role') !== Role::Admin->value),
                'nullable', 'integer',
                Rule::exists('divisions', 'id')->where('type', DivisionType::Research->value),
            ],
            'is_coordinator' => ['sometimes', 'boolean'],
            'password' => ['nullable', 'string', Password::min(8)->letters()->numbers()],
        ];
    }
}
