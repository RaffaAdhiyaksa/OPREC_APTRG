<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SecurityHeadersTest extends TestCase
{
    use RefreshDatabase;

    private function assertSecurityHeaders($response): void
    {
        $response->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('X-Frame-Options', 'DENY')
            ->assertHeader('Referrer-Policy', 'no-referrer');
    }

    public function test_api_success_and_error_responses_carry_security_headers(): void
    {
        $this->assertSecurityHeaders($this->getJson('/api/v1/health')->assertOk());
        $this->assertSecurityHeaders($this->getJson('/api/v1/auth/me')->assertUnauthorized());
        $this->assertSecurityHeaders($this->getJson('/api/v1/does-not-exist')->assertNotFound());
        $this->assertSecurityHeaders($this->actingAsToken(User::factory()->magang()->create())->getJson('/api/v1/admin/users')->assertForbidden());
    }

    public function test_non_api_routes_are_left_alone(): void
    {
        $this->get('/up')->assertOk()->assertHeaderMissing('X-Frame-Options');
    }
}
