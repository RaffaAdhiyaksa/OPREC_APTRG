<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\Division;
use App\Models\User;
use Illuminate\Database\Seeder;
use RuntimeException;

// Dummy accounts for local development and tests only.
class UserSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            $this->command?->info('UserSeeder skipped: only runs in local/testing.');

            return;
        }

        // Read via env() because seeders run from the CLI without a config cache.
        $password = env('SEED_DEFAULT_PASSWORD');
        if (blank($password)) {
            throw new RuntimeException('SEED_DEFAULT_PASSWORD is not set.');
        }

        $division = Division::pluck('id', 'slug');

        $users = [
            ['email' => 'admin@aptrg.test', 'name' => 'Admin APTRG', 'role' => Role::Admin, 'research_division_id' => null],
            ['email' => 'koordinator@aptrg.test', 'name' => 'Koordinator System', 'role' => Role::AsistenAktif, 'research_division_id' => $division['system'], 'is_coordinator' => true],
            ['email' => 'aktif@aptrg.test', 'name' => 'Asisten Aktif Mechanic', 'role' => Role::AsistenAktif, 'research_division_id' => $division['mechanic']],
            ['email' => 'magang1@aptrg.test', 'name' => 'Magang System', 'role' => Role::AsistenMagang, 'research_division_id' => $division['system']],
            ['email' => 'magang2@aptrg.test', 'name' => 'Magang Mechanic', 'role' => Role::AsistenMagang, 'research_division_id' => $division['mechanic']],
            // Exercises the forced password-change flow.
            ['email' => 'baru@aptrg.test', 'name' => 'Magang Baru', 'role' => Role::AsistenMagang, 'research_division_id' => $division['system'], 'must_change_password' => true],
        ];

        foreach ($users as $user) {
            User::updateOrCreate(
                ['email' => $user['email']],
                $user + ['password' => $password, 'is_coordinator' => false, 'is_active' => true, 'must_change_password' => false],
            );
        }

        User::where('email', 'koordinator@aptrg.test')->sole()
            ->competitionDivisions()->syncWithoutDetaching([$division['fixed-wing']]);
    }
}
