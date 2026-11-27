<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\Announcement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AnnouncementVisibilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_magang_does_not_see_announcement_targeted_at_asisten_aktif(): void
    {
        $magang = User::factory()->magang()->create();
        $admin = User::factory()->admin()->create();

        $forAktif = Announcement::factory()->create(['target_role' => Role::AsistenAktif]);
        $global = Announcement::factory()->create();
        $ownDivisionMagang = Announcement::factory()->create([
            'research_division_id' => $magang->research_division_id,
            'target_role' => Role::AsistenMagang,
        ]);
        $otherDivision = Announcement::factory()->create([
            'research_division_id' => User::factory()->magang()->create()->research_division_id,
        ]);

        $visible = Announcement::visibleTo($magang)->pluck('id');

        $this->assertEqualsCanonicalizing([$global->id, $ownDivisionMagang->id], $visible->all());
        $this->assertNotContains($forAktif->id, $visible);
        $this->assertNotContains($otherDivision->id, $visible);
        $this->assertSame(4, Announcement::visibleTo($admin)->count());
    }
}
