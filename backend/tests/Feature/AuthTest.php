<?php

namespace Tests\Feature;

use App\Models\Division;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Str;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    private function login(string $login, string $password = 'password')
    {
        return $this->postJson('/api/v1/auth/login', ['login' => $login, 'password' => $password, 'device_name' => 'test']);
    }

    // The test app keeps the resolved user between requests; reset it so each request authenticates fresh.
    private function freshRequest(): static
    {
        $this->app['auth']->forgetGuards();

        return $this;
    }

    public function test_login_with_email_returns_token_and_user(): void
    {
        $user = User::factory()->create();

        $this->login($user->email)
            ->assertOk()
            ->assertJsonPath('data.token_type', 'Bearer')
            ->assertJsonPath('data.user.id', $user->id)
            ->assertJsonPath('data.user.role', 'asisten_magang')
            ->assertJsonStructure(['data' => ['token', 'token_type', 'user' => [
                'id', 'name', 'email', 'nim', 'role', 'is_coordinator', 'is_active', 'must_change_password',
                'research_division' => ['id', 'slug', 'name'], 'competition_divisions', 'permissions',
            ]]]);

        $this->assertNotNull($user->fresh()->last_login_at);
    }

    public function test_login_with_nim_works(): void
    {
        $user = User::factory()->create();

        $this->login($user->nim)->assertOk()->assertJsonPath('data.user.email', $user->email);
    }

    public function test_login_with_wrong_password_returns_generic_422(): void
    {
        $user = User::factory()->create();

        $this->login($user->email, 'wrong-password')
            ->assertStatus(422)
            ->assertExactJson([
                'message' => 'Email/NIM atau password salah.',
                'code' => 'VALIDATION_ERROR',
                'errors' => ['login' => ['Email/NIM atau password salah.']],
            ]);

        $this->login('nobody@aptrg.test')->assertStatus(422)->assertJsonPath('message', 'Email/NIM atau password salah.');
    }

    public function test_inactive_user_cannot_login(): void
    {
        $user = User::factory()->create(['is_active' => false]);

        $this->login($user->email)->assertForbidden()->assertJsonPath('code', 'ACCOUNT_INACTIVE');
        $this->assertSame(0, $user->tokens()->count());
    }

    public function test_sixth_login_attempt_within_a_minute_is_throttled(): void
    {
        foreach (range(1, 5) as $_) {
            $this->login('someone@aptrg.test', 'x')->assertStatus(422);
        }

        $this->login('someone@aptrg.test', 'x')
            ->assertStatus(429)
            ->assertJsonPath('code', 'TOO_MANY_REQUESTS')
            ->assertHeader('Retry-After');
    }

    public function test_me_without_token_returns_401_json(): void
    {
        $this->getJson('/api/v1/auth/me')
            ->assertUnauthorized()
            ->assertExactJson(['message' => 'Tidak terautentikasi.', 'code' => 'UNAUTHENTICATED']);
    }

    public function test_me_returns_user_with_unread_notifications_count(): void
    {
        $user = User::factory()->create(['must_change_password' => true]);
        DatabaseNotification::create(['id' => Str::uuid(), 'type' => 'announcement', 'notifiable_type' => User::class, 'notifiable_id' => $user->id, 'data' => []]);
        DatabaseNotification::create(['id' => Str::uuid(), 'type' => 'announcement', 'notifiable_type' => User::class, 'notifiable_id' => $user->id, 'data' => [], 'read_at' => now()]);

        // must_change_password users can still reach /me.
        $this->withToken($user->createToken('t')->plainTextToken)
            ->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.unread_notifications_count', 1);
    }

    public function test_inactive_user_token_is_rejected_and_revoked(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('t')->plainTextToken;
        $user->update(['is_active' => false]);

        $this->withToken($token)->getJson('/api/v1/auth/me')->assertForbidden()->assertJsonPath('code', 'ACCOUNT_INACTIVE');
        $this->assertSame(0, $user->tokens()->count());
    }

    public function test_logout_revokes_current_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('t')->plainTextToken;

        $this->withToken($token)->postJson('/api/v1/auth/logout')->assertOk();

        $this->freshRequest()->withToken($token)->getJson('/api/v1/auth/me')->assertUnauthorized();
    }

    public function test_change_password_clears_flag_and_revokes_other_tokens_only(): void
    {
        $user = User::factory()->create(['must_change_password' => true]);
        $current = $user->createToken('current')->plainTextToken;
        $other = $user->createToken('other')->plainTextToken;

        $this->withToken($current)->putJson('/api/v1/auth/password', [
            'current_password' => 'password',
            'password' => 'BaruKuat2026',
            'password_confirmation' => 'BaruKuat2026',
        ])->assertOk();

        $this->assertFalse($user->fresh()->must_change_password);
        $this->assertSame(1, $user->tokens()->count());
        $this->freshRequest()->withToken($current)->getJson('/api/v1/auth/me')->assertOk();
        $this->freshRequest()->withToken($other)->getJson('/api/v1/auth/me')->assertUnauthorized();
        $this->freshRequest()->login($user->email, 'BaruKuat2026')->assertOk();
    }

    public function test_change_password_validates_input(): void
    {
        $user = User::factory()->create();
        $this->withToken($user->createToken('t')->plainTextToken);

        $this->putJson('/api/v1/auth/password', ['current_password' => 'wrong', 'password' => 'BaruKuat2026', 'password_confirmation' => 'BaruKuat2026'])
            ->assertStatus(422)->assertJsonValidationErrors('current_password');
        $this->putJson('/api/v1/auth/password', ['current_password' => 'password', 'password' => 'password', 'password_confirmation' => 'password'])
            ->assertStatus(422)->assertJsonValidationErrors('password');
        $this->putJson('/api/v1/auth/password', ['current_password' => 'password', 'password' => 'onlyletters', 'password_confirmation' => 'onlyletters'])
            ->assertStatus(422)->assertJsonValidationErrors('password');
        $this->putJson('/api/v1/auth/password', ['current_password' => 'password', 'password' => 'BaruKuat2026', 'password_confirmation' => 'Mismatch2026'])
            ->assertStatus(422)->assertJsonValidationErrors('password');
    }

    public function test_one_ip_is_throttled_after_30_logins_across_different_accounts(): void
    {
        // Real accounts with a wrong password: avoids the slow cost-12 dummy hash for unknown logins.
        $users = User::factory()->count(31)->for(Division::factory(), 'researchDivision')->create();

        foreach ($users->take(30) as $user) {
            $this->login($user->email, 'wrong-password')->assertStatus(422);
        }

        $this->login($users->last()->email, 'wrong-password')->assertStatus(429)->assertJsonPath('code', 'TOO_MANY_REQUESTS');
    }

    public function test_validation_messages_are_indonesian(): void
    {
        $this->postJson('/api/v1/auth/login', ['password' => 'x', 'device_name' => 'test'])
            ->assertStatus(422)
            ->assertJsonPath('errors.login.0', 'Email/NIM wajib diisi.');
    }

    public function test_token_expires_after_seven_days(): void
    {
        $this->assertSame(10080, config('sanctum.expiration'));
        $token = User::factory()->create()->createToken('t')->plainTextToken;

        $this->travel(10079)->minutes();
        $this->withToken($token)->getJson('/api/v1/auth/me')->assertOk();

        $this->travel(2)->minutes();
        $this->freshRequest()->withToken($token)->getJson('/api/v1/auth/me')->assertUnauthorized();
    }
}
