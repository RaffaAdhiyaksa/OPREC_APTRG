<?php

namespace App\Http\Requests;

use App\Enums\AssignmentStatus;
use App\Enums\DivisionType;
use App\Models\Assignment;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

// Also used for PUT (fields become optional, due_at may stay in the past). Status changes only via /publish.
class StoreAssignmentRequest extends FormRequest
{
    // Runs before validation, so interns get 403 (or 404 outside their division), never 422.
    public function authorize(): bool|Response
    {
        return $this->isMethod('post')
            ? $this->user()->can('create', Assignment::class)
            : Gate::inspect('update', $this->route('assignment'));
    }

    // An empty list would mean "no file type allowed"; null is the documented "whole whitelist".
    protected function prepareForValidation(): void
    {
        if ($this->input('allowed_extensions') === []) {
            $this->merge(['allowed_extensions' => null]);
        }
    }

    public function rules(): array
    {
        $creating = $this->isMethod('post');
        $optional = $creating ? [] : ['sometimes'];

        return [
            'title' => [...$optional, 'required', 'string', 'max:255'],
            'description' => [...$optional, 'required', 'string', 'max:50000'],
            'due_at' => [...$optional, 'required', 'date', ...($creating ? ['after:now'] : [])],
            'allow_late' => ['sometimes', 'boolean'],
            'max_file_size_mb' => ['sometimes', 'integer', 'min:1', 'max:'.config('lms.max_upload_mb')],
            'allowed_extensions' => ['sometimes', 'nullable', 'array'],
            'allowed_extensions.*' => ['string', 'distinct', Rule::in(config('lms.submission_extensions'))],
            'max_score' => ['sometimes', 'integer', 'min:1', 'max:1000'],
            'status' => $creating ? ['sometimes', Rule::in([AssignmentStatus::Draft->value])] : ['exclude'],
            'division_id' => $creating && $this->user()->isAdmin()
                ? ['required', 'integer', Rule::exists('divisions', 'id')->where('type', DivisionType::Research->value)]
                : ['exclude'],
        ];
    }
}
