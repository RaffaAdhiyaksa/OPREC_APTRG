<?php

namespace App\Enums;

enum MaterialSourceType: string
{
    case Youtube = 'youtube';
    case Drive = 'drive';
    case Other = 'other';
}
