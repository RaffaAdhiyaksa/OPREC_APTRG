<?php

namespace App\Http\Resources;

use App\Models\Submission;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Submission */
class SubmissionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'method' => match (true) {
                $this->file_path !== null && $this->drive_link !== null => 'both',
                $this->file_path !== null => 'file',
                default => 'drive',
            },
            'file_name' => $this->file_name,
            'file_size' => $this->file_size,
            'mime_type' => $this->mime_type,
            'drive_link' => $this->drive_link,
            'note' => $this->note,
            'is_late' => $this->is_late,
            'submitted_at' => $this->submitted_at,
            // API path (needs the Bearer token), not a public URL.
            'download_url' => $this->file_path !== null ? "/api/v1/submissions/{$this->id}/download" : null,
        ];
    }
}
