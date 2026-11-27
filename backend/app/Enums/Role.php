<?php

namespace App\Enums;

enum Role: string
{
    case Admin = 'admin';
    case AsistenAktif = 'asisten_aktif';
    case AsistenMagang = 'asisten_magang';
}
