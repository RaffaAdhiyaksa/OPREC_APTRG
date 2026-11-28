<?php

namespace Tests\Feature;

use App\Enums\DivisionType;
use App\Enums\Role;
use App\Models\Division;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeederTest extends TestCase
{
    use RefreshDatabase;

    // Not `$seed = true`: that only seeds on the first migration of the run, which another test class may own.
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_divisions_are_seeded(): void
    {
        $this->assertSame(8, Division::count());
        $this->assertSame(4, Division::where('type', DivisionType::Research)->count());
        $this->assertSame(4, Division::where('type', DivisionType::Competition)->count());

        $teknofest = Division::where('slug', 'teknofest')->sole();
        $this->assertTrue($teknofest->is_optional);
        $this->assertFalse($teknofest->is_active);
        $this->assertSame(1, Division::where('is_optional', true)->count());
        $this->assertSame(7, Division::where('is_active', true)->count());
    }

    public function test_dummy_users_are_seeded_with_correct_role_division_and_flags(): void
    {
        $this->assertSame(6, User::count());

        $expected = [
            'admin@aptrg.test' => [Role::Admin, null, false, false],
            'koordinator@aptrg.test' => [Role::AsistenAktif, 'system', true, false],
            'aktif@aptrg.test' => [Role::AsistenAktif, 'mechanic', false, false],
            'magang1@aptrg.test' => [Role::AsistenMagang, 'system', false, false],
            'magang2@aptrg.test' => [Role::AsistenMagang, 'mechanic', false, false],
            'baru@aptrg.test' => [Role::AsistenMagang, 'system', false, true],
        ];

        foreach ($expected as $email => [$role, $divisionSlug, $isCoordinator, $mustChangePassword]) {
            $user = User::where('email', $email)->sole();
            $this->assertSame($role, $user->role, $email);
            $this->assertSame($divisionSlug, $user->researchDivision?->slug, $email);
            $this->assertSame($isCoordinator, $user->is_coordinator, $email);
            $this->assertTrue($user->is_active, $email);
            $this->assertSame($mustChangePassword, $user->must_change_password, $email);
        }

        $koordinator = User::where('email', 'koordinator@aptrg.test')->sole();
        $this->assertSame(['fixed-wing'], $koordinator->competitionDivisions->pluck('slug')->all());
    }

    public function test_seeding_twice_is_idempotent(): void
    {
        $this->seed();

        $this->assertSame(8, Division::count());
        $this->assertSame(6, User::count());
        $this->assertDatabaseCount('competition_members', 1);
    }
}
