<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\Division;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CreateAdminCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_creates_admin_and_prints_a_working_temporary_password_once(): void
    {
        $exit = Artisan::call('lms:create-admin', ['name' => 'Kepala Lab', 'email' => 'kalab@aptrg.id']);
        preg_match('/Password sementara \(hanya ditampilkan sekali\): (\S+)/', Artisan::output(), $match);

        $this->assertSame(0, $exit);
        $this->assertSame(16, strlen($match[1] ?? ''));

        $admin = User::where('email', 'kalab@aptrg.id')->sole();
        $this->assertSame(Role::Admin, $admin->role);
        $this->assertTrue($admin->must_change_password);
        $this->assertNull($admin->research_division_id);
        $this->assertTrue(Hash::check($match[1], $admin->password));
    }

    public function test_asks_for_missing_arguments(): void
    {
        $this->artisan('lms:create-admin')
            ->expectsQuestion('Nama', 'Admin Dua')
            ->expectsQuestion('Email', 'dua@aptrg.id')
            ->expectsOutputToContain('Password sementara')
            ->assertSuccessful();

        $this->assertDatabaseHas('users', ['email' => 'dua@aptrg.id', 'role' => 'admin']);
    }

    public function test_rejects_existing_or_invalid_email(): void
    {
        User::factory()->create(['email' => 'ada@aptrg.id'])->delete();

        $this->artisan('lms:create-admin', ['name' => 'X', 'email' => 'ada@aptrg.id'])->assertFailed();
        $this->artisan('lms:create-admin', ['name' => 'X', 'email' => 'bukan-email'])->assertFailed();
        $this->assertSame(0, User::where('role', 'admin')->count());
    }

    public function test_production_seed_creates_divisions_but_no_accounts(): void
    {
        $this->app['env'] = 'production';

        // Exactly what the deploy runs; without --force production asks for confirmation.
        $this->artisan('db:seed', ['--force' => true])->assertSuccessful();

        $this->assertSame(8, Division::count());
        $this->assertSame(0, User::count());
    }
}
