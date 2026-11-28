<?php

namespace App\Http\Resources;

use App\Models\Announcement;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Expects Announcement::withViewerState($viewer) to have been applied.
 *
 * @mixin Announcement
 */
class AnnouncementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'body' => $this->body,
            'author' => $this->author?->only(['id', 'name']),
            'target' => [
                'division' => $this->division?->only(['id', 'slug', 'name']),
                'role' => $this->target_role,
            ],
            'recipients_count' => (int) $this->recipients_count,
            'read_count' => (int) $this->read_count,
            // The author has read their own announcement by definition.
            'is_read' => $this->author_id === $request->user()->id || (bool) $this->is_read,
            'created_at' => $this->created_at,
        ];
    }
}
