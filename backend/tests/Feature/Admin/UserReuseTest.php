<?php

namespace Tests\Feature\Admin;

use App\Models\Division;
use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserReuseTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private Division $system;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->admin()->create();
        $this->system = Division::factory()->create();
        $this->actingAsToken($this->admin);
    }

    private function createIntern(string $email = 'syifa@aptrg.test', string $nim = '1202230011')
    {
        return $this->postJson('/api/v1/admin/users', [
            'name' => 'Syifa', 'email' => $email, 'nim' => $nim, 'role' => 'asisten_magang', 'research_division_id' => $this->system->id,
        ]);
    }

    public function test_deleted_users_email_and_nim_can_be_reused(): void
    {
        $first = $this->createIntern()->assertCreated()->json('data.user.id');
        $this->deleteJson("/api/v1/admin/users/{$first}")->assertOk();

        $second = $this->createIntern()->assertCreated()->json('data.user.id');

        $this->assertNotSame($first, $second);
        $this->assertSame(1, User::where('email', 'syifa@aptrg.test')->count());
        $this->assertSame(2, User::withTrashed()->where('nim', '1202230011')->count());
    }

    public function test_create_admin_command_reuses_a_deleted_email(): void
    {
        User::factory()->admin()->create(['email' => 'old@aptrg.id'])->delete();

        $this->artisan('lms:create-admin', ['name' => 'Admin Baru', 'email' => 'old@aptrg.id'])->assertSuccessful();

        $this->assertSame(1, User::where('email', 'old@aptrg.id')->count());
    }

    public function test_database_still_rejects_two_active_users_with_the_same_email(): void
    {
        User::factory()->create(['email' => 'dup@aptrg.test']);

        $this->expectException(UniqueConstraintViolationException::class);
        User::factory()->create(['email' => 'dup@aptrg.test']);
    }

    public function test_restore_brings_a_deleted_user_back(): void
    {
        $id = $this->createIntern()->json('data.user.id');
        $this->deleteJson("/api/v1/admin/users/{$id}")->assertOk();

        $this->postJson("/api/v1/admin/users/{$id}/restore")
            ->assertOk()->assertJsonPath('data.id', $id)->assertJsonPath('data.email', 'syifa@aptrg.test');

        $this->assertFalse(User::find($id)->trashed());
        $this->postJson("/api/v1/admin/users/{$id}/restore")->assertStatus(422)->assertJsonPath('code', 'NOT_DELETED');
    }

    public function test_restore_is_refused_when_email_or_nim_was_reused(): void
    {
        $old = $this->createIntern()->json('data.user.id');
        $this->deleteJson("/api/v1/admin/users/{$old}")->assertOk();
        $this->createIntern(nim: '9999')->assertCreated();

        $this->postJson("/api/v1/admin/users/{$old}/restore")
            ->assertStatus(422)->assertJsonPath('code', 'RESTORE_CONFLICT')->assertJsonValidationErrors('email');
        $this->assertTrue(User::withTrashed()->find($old)->trashed());

        $byNim = $this->createIntern('a@aptrg.test', '5555')->json('data.user.id');
        $this->deleteJson("/api/v1/admin/users/{$byNim}")->assertOk();
        $this->createIntern('b@aptrg.test', '5555')->assertCreated();
        $this->postJson("/api/v1/admin/users/{$byNim}/restore")->assertStatus(422)->assertJsonValidationErrors('nim');
    }

    public function test_restore_is_admin_only(): void
    {
        $user = User::factory()->create();
        $user->delete();

        $this->actingAsToken(User::factory()->coordinator()->create())->postJson("/api/v1/admin/users/{$user->id}/restore")->assertForbidden();
        $this->assertTrue($user->fresh()->trashed());
    }
}
