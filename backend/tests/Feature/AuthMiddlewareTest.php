<?php

namespace Tests\Feature;

use App\Http\Resources\UserResource;
use App\Models\Material;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class AuthMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Route::middleware(['api', 'auth:sanctum', 'active', 'pwd.changed'])->prefix('api/test')->group(function () {
            Route::get('/default', fn () => 'ok');
            Route::get('/staff', fn () => 'ok')->middleware('role:asisten_aktif,admin');
            Route::get('/coordinator', fn () => 'ok')->middleware('coordinator');
            Route::get('/materials/{material}', fn (Material $material) => 'ok');
        });
    }

    private function as(User $user): static
    {
        return $this->withToken($user->createToken('t')->plainTextToken);
    }

    public function test_pwd_changed_blocks_users_who_must_change_password(): void
    {
        $this->as(User::factory()->create(['must_change_password' => true]))
            ->getJson('/api/test/default')
            ->assertForbidden()
            ->assertJsonPath('code', 'PASSWORD_CHANGE_REQUIRED');

        $this->app['auth']->forgetGuards();
        $this->as(User::factory()->create())->getJson('/api/test/default')->assertOk();
    }

    public function test_role_middleware_allows_listed_roles_only(): void
    {
        foreach ([User::factory()->admin(), User::factory()->aktif(), User::factory()->coordinator()] as $factory) {
            $this->app['auth']->forgetGuards();
            $this->as($factory->create())->getJson('/api/test/staff')->assertOk();
        }

        $this->app['auth']->forgetGuards();
        $this->as(User::factory()->magang()->create())
            ->getJson('/api/test/staff')
            ->assertForbidden()
            ->assertExactJson(['message' => 'Anda tidak memiliki akses.', 'code' => 'FORBIDDEN']);
    }

    public function test_coordinator_middleware_requires_coordinator_aktif(): void
    {
        $this->as(User::factory()->coordinator()->create())->getJson('/api/test/coordinator')->assertOk();

        foreach ([User::factory()->admin(), User::factory()->aktif(), User::factory()->magang()] as $factory) {
            $this->app['auth']->forgetGuards();
            $this->as($factory->create())->getJson('/api/test/coordinator')->assertForbidden()->assertJsonPath('code', 'FORBIDDEN');
        }
    }

    public function test_missing_model_returns_generic_404(): void
    {
        $this->as(User::factory()->create())
            ->getJson('/api/test/materials/999')
            ->assertNotFound()
            ->assertExactJson(['message' => 'Data tidak ditemukan.', 'code' => 'NOT_FOUND']);
    }

    public function test_permissions_are_computed_per_role(): void
    {
        $permissions = fn (User $user) => (new UserResource($user))->resolve()['permissions'];

        $this->assertSame(
            ['material.manage', 'assignment.manage', 'grade.publish', 'announcement.send', 'user.manage'],
            $permissions(User::factory()->admin()->create()),
        );
        $this->assertSame(
            ['material.manage', 'assignment.manage', 'grade.publish', 'announcement.send'],
            $permissions(User::factory()->coordinator()->create()),
        );
        $this->assertSame(
            ['material.manage', 'assignment.manage', 'grade.publish'],
            $permissions(User::factory()->aktif()->create()),
        );
        $this->assertSame([], $permissions(User::factory()->magang()->create()));
    }
}
