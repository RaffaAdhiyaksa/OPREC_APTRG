<?php

namespace App\Http\Requests;

use App\Enums\DivisionType;
use App\Models\Material;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

// Also used for PUT (fields become optional). source_type is never accepted: the server derives it.
class StoreMaterialRequest extends FormRequest
{
    // Runs before validation, so interns get 403 (or 404 outside their division), never 422.
    public function authorize(): bool|Response
    {
        return $this->isMethod('post')
            ? $this->user()->can('create', Material::class)
            : Gate::inspect('update', $this->route('material'));
    }

    public function rules(): array
    {
        $optional = $this->isMethod('post') ? [] : ['sometimes'];

        return [
            'title' => [...$optional, 'required', 'string', 'max:255'],
            'description' => [...$optional, 'nullable', 'string', 'max:5000'],
            'url' => [...$optional, 'required', 'string', 'max:2048', 'url:http,https'],
            'is_published' => ['sometimes', 'boolean'],
            // Admin picks the division on create; asisten_aktif always uses their own (set in the controller).
            'division_id' => $this->isMethod('post') && $this->user()->isAdmin()
                ? ['required', 'integer', Rule::exists('divisions', 'id')->where('type', DivisionType::Research->value)]
                : ['exclude'],
        ];
    }
}
