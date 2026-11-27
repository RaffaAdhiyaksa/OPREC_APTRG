<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_coordinator_changed_to_magang_loses_coordinator_flag(): void
    {
        $user = User::factory()->coordinator()->create();
        $this->assertTrue($user->isCoordinator());

        $user->update(['role' => Role::AsistenMagang]);

        $this->assertFalse($user->fresh()->is_coordinator);
        $this->assertNotNull($user->fresh()->research_division_id);
    }

    public function test_user_changed_to_admin_loses_research_division(): void
    {
        $user = User::factory()->coordinator()->create();

        $user->update(['role' => Role::Admin]);

        $fresh = $user->fresh();
        $this->assertNull($fresh->research_division_id);
        $this->assertFalse($fresh->is_coordinator);
        $this->assertTrue($fresh->isAdmin());
    }
}
