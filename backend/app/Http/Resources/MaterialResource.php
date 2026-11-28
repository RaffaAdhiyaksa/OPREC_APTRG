<?php

namespace App\Http\Resources;

use App\Models\Material;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Material */
class MaterialResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'division' => $this->division->only(['id', 'slug', 'name']),
            'title' => $this->title,
            'description' => $this->description,
            'source_type' => $this->source_type,
            'url' => $this->url,
            'embed_url' => $this->embedUrl(),
            'sort_order' => $this->sort_order,
            'is_published' => $this->is_published,
            'author' => $this->creator->only(['id', 'name']),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
