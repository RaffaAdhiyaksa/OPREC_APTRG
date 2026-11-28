<?php

namespace Tests\Feature;

use App\Models\Division;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        $this->user = User::factory()->magang()->create(['name' => 'Lama', 'email' => 'me@aptrg.test']);
    }

    // Multipart with method spoofing, exactly as the browser sends it.
    private function updateProfile(array $data)
    {
        return $this->actingAsToken($this->user)->post('/api/v1/auth/profile', ['_method' => 'PUT', ...$data], ['Accept' => 'application/json']);
    }

    public function test_updates_name_phone_and_avatar(): void
    {
        $response = $this->updateProfile([
            'name' => 'Baru', 'phone' => '0812', 'avatar' => UploadedFile::fake()->image('me.png', 200, 200),
        ])->assertOk()->assertJsonPath('data.name', 'Baru')->assertJsonPath('data.phone', '0812');

        $path = $this->user->fresh()->avatar_path;
        $this->assertMatchesRegularExpression('#^avatars/[0-9a-f-]{36}\.png$#', $path);
        Storage::disk('public')->assertExists($path);
        $response->assertJsonPath('data.avatar_url', Storage::disk('public')->url($path));
    }

    public function test_new_avatar_replaces_and_deletes_the_old_file(): void
    {
        $this->updateProfile(['avatar' => UploadedFile::fake()->image('a.jpg')])->assertOk();
        $old = $this->user->fresh()->avatar_path;

        $this->updateProfile(['avatar' => UploadedFile::fake()->image('b.webp')])->assertOk();

        Storage::disk('public')->assertMissing($old);
        Storage::disk('public')->assertExists($this->user->fresh()->avatar_path);
        // A text-only update keeps the current avatar.
        $this->updateProfile(['name' => 'X'])->assertOk()->assertJsonPath('data.avatar_url', fn ($url) => $url !== null);
    }

    public function test_email_role_and_division_cannot_be_changed(): void
    {
        $other = Division::factory()->create();

        $this->updateProfile(['email' => 'hack@aptrg.test', 'role' => 'admin', 'research_division_id' => $other->id, 'is_coordinator' => true])->assertOk();

        $fresh = $this->user->fresh();
        $this->assertSame('me@aptrg.test', $fresh->email);
        $this->assertTrue($fresh->isMagang());
        $this->assertNotSame($other->id, $fresh->research_division_id);
    }

    public function test_avatar_validation(): void
    {
        $this->updateProfile(['avatar' => UploadedFile::fake()->create('a.pdf', 10, 'application/pdf')])->assertStatus(422)->assertJsonValidationErrors('avatar');
        $this->updateProfile(['avatar' => UploadedFile::fake()->image('big.jpg')->size(2049)])->assertStatus(422)->assertJsonValidationErrors('avatar');
        $this->updateProfile(['name' => ''])->assertStatus(422)->assertJsonValidationErrors('name');
        $this->assertNull($this->user->fresh()->avatar_path);
    }

    public function test_avatar_url_is_null_without_avatar_and_profile_needs_password_changed(): void
    {
        $this->actingAsToken($this->user)->getJson('/api/v1/auth/me')->assertJsonPath('data.avatar_url', null);

        $this->user->update(['must_change_password' => true]);
        $this->updateProfile(['name' => 'X'])->assertForbidden()->assertJsonPath('code', 'PASSWORD_CHANGE_REQUIRED');
    }
}
