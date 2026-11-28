<?php

namespace Tests\Feature\Admin;

use App\Enums\DivisionType;
use App\Enums\Role;
use App\Models\Division;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminUserTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private Division $system;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->admin()->create();
        $this->system = Division::factory()->create(['slug' => 'system']);
        $this->actingAsToken($this->admin);
    }

    public function test_non_admins_get_403_on_every_admin_endpoint(): void
    {
        $target = User::factory()->create();

        foreach ([User::factory()->coordinator()->create(), User::factory()->magang()->create()] as $user) {
            $this->actingAsToken($user);
            $this->getJson('/api/v1/admin/users')->assertForbidden()->assertJsonPath('code', 'FORBIDDEN');
            $this->postJson('/api/v1/admin/users', [])->assertForbidden();
            $this->putJson("/api/v1/admin/users/{$target->id}", [])->assertForbidden();
            $this->patchJson("/api/v1/admin/users/{$target->id}/status", ['is_active' => false])->assertForbidden();
            $this->postJson("/api/v1/admin/users/{$target->id}/reset-password")->assertForbidden();
            $this->deleteJson("/api/v1/admin/users/{$target->id}")->assertForbidden();
            $this->getJson('/api/v1/admin/dashboard')->assertForbidden();
        }

        $this->assertTrue($target->fresh()->is_active);
    }

    public function test_index_filters_and_paginates(): void
    {
        User::factory()->count(3)->magang()->create(['research_division_id' => $this->system->id]);
        User::factory()->aktif()->create(['name' => 'Ruddy Search', 'research_division_id' => $this->system->id]);
        User::factory()->magang()->create(['is_active' => false]);

        $this->getJson('/api/v1/admin/users?per_page=2')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.per_page', 2)
            ->assertJsonPath('meta.total', 6);

        $this->getJson('/api/v1/admin/users?search=ruddy')->assertJsonCount(1, 'data')->assertJsonPath('data.0.name', 'Ruddy Search');
        $this->getJson('/api/v1/admin/users?role=asisten_magang&division_id='.$this->system->id)->assertJsonCount(3, 'data');
        $this->getJson('/api/v1/admin/users?is_active=0')->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/admin/users?per_page=500')->assertJsonPath('meta.per_page', 100);
    }

    public function test_store_generates_temporary_password_once(): void
    {
        $response = $this->postJson('/api/v1/admin/users', [
            'name' => 'Syifa', 'email' => 'syifa@aptrg.test', 'nim' => '1202230011',
            'role' => 'asisten_magang', 'research_division_id' => $this->system->id,
        ])->assertCreated()
            ->assertJsonPath('data.user.email', 'syifa@aptrg.test')
            ->assertJsonPath('data.user.must_change_password', true)
            ->assertJsonPath('data.user.is_active', true)
            ->assertJsonPath('data.user.is_coordinator', false)
            ->assertJsonPath('data.user.research_division.slug', 'system');

        $password = $response->json('data.temporary_password');
        $this->assertSame(12, strlen($password));
        $user = User::where('email', 'syifa@aptrg.test')->sole();
        $this->assertTrue(Hash::check($password, $user->password));

        $this->getJson("/api/v1/admin/users/{$user->id}")->assertOk()->assertJsonMissingPath('data.temporary_password');
    }

    public function test_store_with_given_password_returns_null_temporary_password(): void
    {
        $this->postJson('/api/v1/admin/users', ['name' => 'A', 'email' => 'a@aptrg.test', 'role' => 'admin', 'password' => 'Rahasia2026'])
            ->assertCreated()
            ->assertJsonPath('data.temporary_password', null)
            ->assertJsonPath('data.user.research_division', null);
    }

    public function test_store_validation(): void
    {
        $competition = Division::factory()->competition()->create();
        User::factory()->create(['email' => 'dupe@aptrg.test'])->delete();

        $this->postJson('/api/v1/admin/users', ['name' => 'X', 'email' => 'x@aptrg.test', 'role' => 'asisten_magang'])
            ->assertStatus(422)->assertJsonValidationErrors('research_division_id');
        $this->postJson('/api/v1/admin/users', ['name' => 'X', 'email' => 'x@aptrg.test', 'role' => 'asisten_magang', 'research_division_id' => $competition->id])
            ->assertStatus(422)->assertJsonValidationErrors('research_division_id');
        $this->postJson('/api/v1/admin/users', ['name' => 'X', 'email' => 'x@aptrg.test', 'role' => 'superuser'])
            ->assertStatus(422)->assertJsonValidationErrors('role');
        // Email of a soft-deleted user is still taken.
        $this->postJson('/api/v1/admin/users', ['name' => 'X', 'email' => 'dupe@aptrg.test', 'role' => 'admin'])
            ->assertStatus(422)->assertJsonPath('errors.email.0', 'Email sudah digunakan.');
    }

    public function test_update_changes_fields_and_drops_competition_when_leaving_aktif(): void
    {
        $user = User::factory()->coordinator()->create();
        $user->competitionDivisions()->attach(Division::factory()->competition()->create());

        $this->putJson("/api/v1/admin/users/{$user->id}", ['role' => 'asisten_magang', 'name' => 'Ganti Nama'])
            ->assertOk()
            ->assertJsonPath('data.name', 'Ganti Nama')
            ->assertJsonPath('data.role', 'asisten_magang')
            ->assertJsonPath('data.is_coordinator', false)
            ->assertJsonPath('data.competition_divisions', []);

        $this->assertDatabaseCount('competition_members', 0);
    }

    public function test_update_requires_research_division_for_non_admin(): void
    {
        $otherAdmin = User::factory()->admin()->create();

        $this->putJson("/api/v1/admin/users/{$otherAdmin->id}", ['role' => 'asisten_aktif'])
            ->assertStatus(422)->assertJsonValidationErrors('research_division_id');
        $this->putJson("/api/v1/admin/users/{$otherAdmin->id}", ['role' => 'asisten_aktif', 'research_division_id' => $this->system->id])
            ->assertOk()->assertJsonPath('data.research_division.id', $this->system->id);

        $magang = User::factory()->magang()->create();
        $this->putJson("/api/v1/admin/users/{$magang->id}", ['research_division_id' => null])
            ->assertStatus(422)->assertJsonValidationErrors('research_division_id');
    }

    public function test_admin_cannot_change_own_role_deactivate_or_delete_self(): void
    {
        $this->putJson("/api/v1/admin/users/{$this->admin->id}", ['role' => 'asisten_aktif', 'research_division_id' => $this->system->id])
            ->assertStatus(422)->assertJsonPath('code', 'CANNOT_CHANGE_OWN_ROLE')->assertJsonValidationErrors('role');
        $this->patchJson("/api/v1/admin/users/{$this->admin->id}/status", ['is_active' => false])
            ->assertStatus(422)->assertJsonPath('code', 'CANNOT_DEACTIVATE_SELF');
        $this->deleteJson("/api/v1/admin/users/{$this->admin->id}")
            ->assertStatus(422)->assertJsonPath('code', 'CANNOT_DELETE_SELF');

        // Editing other own fields is still allowed.
        $this->putJson("/api/v1/admin/users/{$this->admin->id}", ['role' => 'admin', 'name' => 'Admin Baru'])->assertOk();
        $this->assertTrue($this->admin->fresh()->is_active);
        $this->assertNull($this->admin->fresh()->deleted_at);
    }

    public function test_status_deactivation_revokes_all_tokens(): void
    {
        $user = User::factory()->create();
        $user->createToken('a');
        $user->createToken('b');

        $this->patchJson("/api/v1/admin/users/{$user->id}/status", ['is_active' => false])
            ->assertOk()->assertJsonPath('data.is_active', false);
        $this->assertSame(0, $user->tokens()->count());

        $this->patchJson("/api/v1/admin/users/{$user->id}/status", ['is_active' => true])->assertOk()->assertJsonPath('data.is_active', true);
        $this->patchJson("/api/v1/admin/users/{$user->id}/status", [])->assertStatus(422)->assertJsonValidationErrors('is_active');
    }

    public function test_reset_password_sets_flag_revokes_tokens_and_returns_new_password(): void
    {
        $user = User::factory()->create();
        $user->createToken('a');

        $password = $this->postJson("/api/v1/admin/users/{$user->id}/reset-password")
            ->assertOk()
            ->assertJsonPath('data.user.must_change_password', true)
            ->json('data.temporary_password');

        $this->assertTrue(Hash::check($password, $user->fresh()->password));
        $this->assertSame(0, $user->tokens()->count());
    }

    public function test_sync_competition_divisions(): void
    {
        $user = User::factory()->aktif()->create();
        [$fw, $rp] = Division::factory()->competition()->count(2)->create();
        $inactive = Division::factory()->competition()->create(['is_active' => false]);

        $this->putJson("/api/v1/admin/users/{$user->id}/competition-divisions", ['members' => [
            ['division_id' => $fw->id, 'position' => 'Pilot'], ['division_id' => $rp->id],
        ]])->assertOk()
            ->assertJsonCount(2, 'data.competition_divisions')
            ->assertJsonPath('data.competition_divisions.0.position', 'Pilot');

        $this->putJson("/api/v1/admin/users/{$user->id}/competition-divisions", ['members' => [['division_id' => $rp->id]]])->assertOk();
        $this->assertSame([$rp->id], $user->competitionDivisions()->pluck('divisions.id')->all());

        $this->putJson("/api/v1/admin/users/{$user->id}/competition-divisions", ['members' => [['division_id' => $inactive->id]]])
            ->assertStatus(422)->assertJsonValidationErrors('members.0.division_id');
        $this->putJson("/api/v1/admin/users/{$user->id}/competition-divisions", ['members' => [['division_id' => $this->system->id]]])
            ->assertStatus(422)->assertJsonValidationErrors('members.0.division_id');

        $magang = User::factory()->magang()->create();
        $this->putJson("/api/v1/admin/users/{$magang->id}/competition-divisions", ['members' => [['division_id' => $fw->id]]])
            ->assertStatus(422)->assertJsonPath('code', 'NOT_ASISTEN_AKTIF');

        $this->putJson("/api/v1/admin/users/{$user->id}/competition-divisions", ['members' => []])->assertOk();
        $this->assertSame(0, $user->competitionDivisions()->count());
    }

    public function test_sync_keeps_membership_in_deactivated_division(): void
    {
        $user = User::factory()->aktif()->create();
        $fw = Division::factory()->competition()->create();
        $teknofest = Division::factory()->competition()->create(['is_optional' => true]);
        $user->competitionDivisions()->attach($teknofest, ['position' => 'Pilot']);
        $teknofest->update(['is_active' => false]);

        $this->putJson("/api/v1/admin/users/{$user->id}/competition-divisions", ['members' => [['division_id' => $fw->id]]])->assertOk();

        $this->assertEqualsCanonicalizing([$fw->id, $teknofest->id], $user->competitionDivisions()->pluck('divisions.id')->all());
        $this->assertSame('Pilot', $user->competitionDivisions()->find($teknofest->id)->pivot->position);
    }

    public function test_destroy_soft_deletes_and_revokes_tokens(): void
    {
        $user = User::factory()->create();
        $user->createToken('a');

        $this->deleteJson("/api/v1/admin/users/{$user->id}")->assertOk();

        $this->assertSoftDeleted($user);
        $this->assertSame(0, $user->tokens()->count());
        $this->getJson("/api/v1/admin/users/{$user->id}")->assertNotFound()->assertJsonPath('code', 'NOT_FOUND');
    }

    public function test_other_admin_can_be_demoted_deactivated_and_deleted_while_another_admin_remains(): void
    {
        $a = User::factory()->admin()->create();
        $b = User::factory()->admin()->create();
        $c = User::factory()->admin()->create();

        $this->putJson("/api/v1/admin/users/{$a->id}", ['role' => 'asisten_aktif', 'research_division_id' => $this->system->id])->assertOk();
        $this->patchJson("/api/v1/admin/users/{$b->id}/status", ['is_active' => false])->assertOk();
        $this->deleteJson("/api/v1/admin/users/{$c->id}")->assertOk();
    }

    public function test_is_last_active_admin(): void
    {
        // Through the API the acting admin always counts, so zero admins is only reachable by a race;
        // the model check (run under lockForUpdate) is tested directly.
        $this->assertTrue($this->admin->isLastActiveAdmin());

        $other = User::factory()->admin()->create();
        $this->assertFalse($this->admin->isLastActiveAdmin());

        $other->update(['is_active' => false]);
        $this->assertTrue($this->admin->isLastActiveAdmin());
        $this->assertFalse($other->isLastActiveAdmin());
        $this->assertFalse(User::factory()->aktif()->create()->isLastActiveAdmin());
    }
}
