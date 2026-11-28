<?php

namespace Tests\Feature\Admin;

use App\Models\Division;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserImportTest extends TestCase
{
    use RefreshDatabase;

    private const HEADER = 'name,email,nim,phone,role,division_slug';

    protected function setUp(): void
    {
        parent::setUp();

        Division::factory()->create(['slug' => 'system']);
        Division::factory()->competition()->create(['slug' => 'fixed-wing']);
        $this->actingAsToken(User::factory()->admin()->create());
    }

    private function import(string $csv)
    {
        return $this->post('/api/v1/admin/users/import', ['file' => UploadedFile::fake()->createWithContent('users.csv', $csv)], ['Accept' => 'application/json']);
    }

    public function test_imports_all_rows_and_returns_temporary_passwords(): void
    {
        $csv = "\xEF\xBB\xBF".self::HEADER."\n"
            ."Syifa,syifa@aptrg.test,1202230011,0812,asisten_magang,system\n"
            ."\n"
            ."\"Budi, S.T.\",budi@aptrg.test,,,asisten_aktif,system\n"
            ."Kalab,kalab@aptrg.test,,,admin,\n";

        $response = $this->import($csv)
            ->assertCreated()
            ->assertJsonPath('data.created_count', 3)
            ->assertJsonCount(3, 'data.users');

        $budi = collect($response->json('data.users'))->firstWhere('email', 'budi@aptrg.test');
        $user = User::where('email', 'budi@aptrg.test')->sole();
        $this->assertSame('Budi, S.T.', $user->name);
        $this->assertTrue($user->must_change_password);
        $this->assertSame('system', $user->researchDivision->slug);
        $this->assertTrue(Hash::check($budi['temporary_password'], $user->password));
        $this->assertNull(User::where('email', 'kalab@aptrg.test')->value('research_division_id'));
    }

    public function test_any_invalid_row_creates_nothing_and_reports_rows(): void
    {
        User::factory()->create(['email' => 'ada@aptrg.test']);
        $csv = self::HEADER."\n"
            ."Ok,ok@aptrg.test,111,,asisten_magang,system\n"     // line 2: valid
            ."Ada,ada@aptrg.test,,,asisten_magang,system\n"      // line 3: email taken
            ."X,bukan-email,,,superuser,\n"                      // line 4: email, role, division
            ."Lomba,lomba@aptrg.test,,,asisten_magang,fixed-wing\n" // line 5: not a research division
            ."Dup,dup@aptrg.test,111,,asisten_magang,system\n";  // line 6: NIM duplicates line 2

        $errors = $this->import($csv)->assertStatus(422)->assertJsonPath('code', 'IMPORT_INVALID')->json('errors');

        $this->assertSame(['3', '4', '5', '6'], array_map('strval', array_keys($errors)));
        $this->assertStringContainsString('sudah digunakan', $errors['3'][0]);
        $this->assertCount(3, $errors['4']); // email, role, and the division a non-admin role needs
        $this->assertStringContainsString('baris 2', implode(' ', $errors['6']));
        $this->assertSame(2, User::count()); // the acting admin and the pre-existing user only
        $this->assertDatabaseMissing('users', ['email' => 'ok@aptrg.test']);
    }

    public function test_reuses_email_of_a_deleted_user(): void
    {
        User::factory()->create(['email' => 'lama@aptrg.test'])->delete();

        $this->import(self::HEADER."\nLama,lama@aptrg.test,,,asisten_magang,system\n")->assertCreated();
    }

    public function test_rejects_wrong_header_empty_file_and_more_than_200_rows(): void
    {
        $this->import("nama,email\nX,x@aptrg.test\n")->assertStatus(422)->assertJsonPath('code', 'IMPORT_INVALID');
        $this->import(self::HEADER."\n")->assertStatus(422)->assertJsonPath('code', 'IMPORT_INVALID');

        $rows = collect(range(1, 201))->map(fn ($i) => "U{$i},u{$i}@aptrg.test,,,asisten_magang,system")->implode("\n");
        $this->import(self::HEADER."\n".$rows)->assertStatus(422)->assertJsonPath('code', 'IMPORT_TOO_LARGE');

        $this->post('/api/v1/admin/users/import', [], ['Accept' => 'application/json'])->assertStatus(422)->assertJsonValidationErrors('file');
        $this->assertSame(1, User::count());
    }

    public function test_import_is_admin_only(): void
    {
        $this->actingAsToken(User::factory()->coordinator()->create())
            ->post('/api/v1/admin/users/import', ['file' => UploadedFile::fake()->createWithContent('u.csv', self::HEADER."\n")], ['Accept' => 'application/json'])
            ->assertForbidden();
    }
}
