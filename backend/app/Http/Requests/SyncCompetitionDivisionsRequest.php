<?php

namespace App\Http\Requests;

use App\Enums\DivisionType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SyncCompetitionDivisionsRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'members' => ['present', 'array'],
            'members.*.division_id' => [
                'required', 'integer', 'distinct',
                Rule::exists('divisions', 'id')->where('type', DivisionType::Competition->value)->where('is_active', true),
            ],
            'members.*.position' => ['nullable', 'string', 'max:100'],
        ];
    }
}
