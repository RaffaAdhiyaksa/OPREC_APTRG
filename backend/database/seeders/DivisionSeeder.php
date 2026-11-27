<?php

namespace Database\Seeders;

use App\Enums\DivisionType;
use App\Models\Division;
use Illuminate\Database\Seeder;

class DivisionSeeder extends Seeder
{
    public function run(): void
    {
        $divisions = [
            ['slug' => 'mechanic', 'name' => 'Mechanic', 'type' => DivisionType::Research],
            ['slug' => 'system', 'name' => 'System', 'type' => DivisionType::Research],
            ['slug' => 'gcs', 'name' => 'Ground Control Station (GCS)', 'type' => DivisionType::Research],
            ['slug' => 'non-technical', 'name' => 'Non-Technical', 'type' => DivisionType::Research],
            ['slug' => 'fixed-wing', 'name' => 'Fixed Wing', 'type' => DivisionType::Competition, 'team_name' => 'Bangau Team'],
            ['slug' => 'racing-plane', 'name' => 'Racing Plane', 'type' => DivisionType::Competition, 'team_name' => 'Frigate Team'],
            ['slug' => 'lela', 'name' => 'LELA', 'type' => DivisionType::Competition, 'team_name' => 'Strix Team'],
            ['slug' => 'teknofest', 'name' => 'Teknofest', 'type' => DivisionType::Competition, 'team_name' => 'Avalerion Team', 'is_optional' => true, 'is_active' => false],
        ];

        foreach ($divisions as $i => $division) {
            Division::updateOrCreate(
                ['slug' => $division['slug']],
                $division + ['team_name' => null, 'is_optional' => false, 'is_active' => true, 'sort_order' => $i + 1],
            );
        }
    }
}
