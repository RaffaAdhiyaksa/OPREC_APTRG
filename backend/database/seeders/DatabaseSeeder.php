<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

// No WithoutModelEvents: the User saving event enforces RBAC invariants.
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            DivisionSeeder::class,
            UserSeeder::class,
        ]);
    }
}
