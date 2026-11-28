<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Notifications\DatabaseNotification;

/** @mixin DatabaseNotification */
class NotificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->data['type'] ?? $this->type,
            'title' => $this->data['title'] ?? '',
            'excerpt' => $this->data['excerpt'] ?? '',
            'link' => $this->data['link'] ?? '/',
            'read_at' => $this->read_at,
            'created_at' => $this->created_at,
        ];
    }
}
