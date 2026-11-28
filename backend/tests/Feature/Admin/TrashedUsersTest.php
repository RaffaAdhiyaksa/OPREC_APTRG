<?php

namespace Tests\Feature\Admin;

use App\Models\Division;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TrashedUsersTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $active;

    private User $deleted;

    protected function setUp(): void
    {
        parent::setUp();

        $division = Division::factory()->create();
        $this->admin = User::factory()->admin()->create(['name' => 'A Admin']);
        $this->active = User::factory()->create(['name' => 'B Aktif', 'research_division_id' => $division->id]);
        $this->deleted = User::factory()->create(['name' => 'C Terhapus', 'research_division_id' => $division->id]);
        $this->deleted->delete();
    }

    private function ids(string $query = ''): array
    {
        $this->actingAsToken($this->admin);

        return $this->getJson('/api/v1/admin/users'.$query)->assertOk()->json('data.*.id');
    }

    public function test_default_list_excludes_deleted_users(): void
    {
        $this->assertEqualsCanonicalizing([$this->admin->id, $this->active->id], $this->ids());
    }

    public function test_trashed_only_lists_only_deleted_users_with_deleted_at(): void
    {
        $this->actingAsToken($this->admin);

        $response = $this->getJson('/api/v1/admin/users?trashed=only')->assertOk();

        $this->assertSame([$this->deleted->id], $response->json('data.*.id'));
        $this->assertNotNull($response->json('data.0.deleted_at'));
    }

    public function test_trashed_with_lists_everyone_and_active_users_have_null_deleted_at(): void
    {
        $this->actingAsToken($this->admin);

        $response = $this->getJson('/api/v1/admin/users?trashed=with')->assertOk();

        $this->assertEqualsCanonicalizing([$this->admin->id, $this->active->id, $this->deleted->id], $response->json('data.*.id'));
        $this->assertNull(collect($response->json('data'))->firstWhere('id', $this->active->id)['deleted_at']);
    }

    public function test_invalid_trashed_value_is_rejected(): void
    {
        $this->actingAsToken($this->admin);

        $this->getJson('/api/v1/admin/users?trashed=all')->assertUnprocessable()->assertJsonValidationErrors('trashed');
    }

    public function test_non_admin_cannot_list_deleted_users(): void
    {
        $this->actingAsToken($this->active);

        $this->getJson('/api/v1/admin/users?trashed=only')->assertForbidden();
    }
}
