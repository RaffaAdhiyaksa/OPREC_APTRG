<?php

namespace App\Http\Requests;

use App\Enums\DivisionType;
use App\Enums\Role;
use App\Models\Announcement;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAnnouncementRequest extends FormRequest
{
    // 403 before validation for anyone but admin and coordinators.
    public function authorize(): bool
    {
        return $this->user()->can('create', Announcement::class);
    }

    public function rules(): array
    {
        // Coordinators cannot choose a target: the controller forces their division + interns.
        $admin = $this->user()->isAdmin();

        return [
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string', 'max:10000'],
            'research_division_id' => $admin
                ? ['nullable', 'integer', Rule::exists('divisions', 'id')->where('type', DivisionType::Research->value)]
                : ['exclude'],
            'target_role' => $admin ? ['nullable', Rule::enum(Role::class)] : ['exclude'],
        ];
    }
}
