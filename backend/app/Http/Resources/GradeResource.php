<?php

namespace App\Http\Resources;

use App\Models\Grade;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Grade */
class GradeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'score' => (float) $this->score,
            'feedback' => $this->feedback,
            'status' => $this->status,
            'published_at' => $this->published_at,
            'graded_by' => $this->grader?->only(['id', 'name']),
            'updated_at' => $this->updated_at,
        ];
    }
}
