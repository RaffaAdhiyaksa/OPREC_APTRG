<?php

namespace App\Http\Requests;

use App\Enums\DivisionType;
use App\Enums\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function rules(): array
    {
        $user = $this->route('user');
        $role = $this->input('role', $user->role->value);

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users')->ignore($user)->withoutTrashed()],
            'nim' => ['sometimes', 'nullable', 'string', 'max:30', Rule::unique('users')->ignore($user)->withoutTrashed()],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'role' => ['sometimes', 'required', Rule::enum(Role::class)],
            // Required for non-admins when sent, or when the user has none yet (e.g. admin becoming asisten).
            'research_division_id' => [
                Rule::requiredIf($role !== Role::Admin->value && ($this->has('research_division_id') || $user->research_division_id === null)),
                'nullable', 'integer',
                Rule::exists('divisions', 'id')->where('type', DivisionType::Research->value),
            ],
            'is_coordinator' => ['sometimes', 'boolean'],
        ];
    }
}
