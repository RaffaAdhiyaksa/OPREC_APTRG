<?php

namespace App\Enums;

enum MaterialSourceType: string
{
    case Youtube = 'youtube';
    case Drive = 'drive';
    case Other = 'other';

    // Same host rule as the frontend (lib/materialSource.ts); the client never chooses the type.
    public static function fromUrl(string $url): self
    {
        $host = preg_replace('/^(www|m)\./', '', strtolower((string) parse_url($url, PHP_URL_HOST)));

        return match ($host) {
            'youtube.com', 'youtu.be' => self::Youtube,
            'drive.google.com', 'docs.google.com' => self::Drive,
            default => self::Other,
        };
    }
}
