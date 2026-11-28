<?php

namespace App\Http\Resources;

use App\Enums\DivisionType;
use App\Models\Division;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Division */
class DivisionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->name,
            'type' => $this->type,
            'team_name' => $this->team_name,
            'is_optional' => $this->is_optional,
            'is_active' => $this->is_active,
            'sort_order' => $this->sort_order,
            // Loaded only for admins (see DivisionController@index).
            'members_count' => $this->when(
                isset($this->research_members_count),
                fn () => $this->type === DivisionType::Research ? $this->research_members_count : $this->competition_members_count,
            ),
        ];
    }
}
