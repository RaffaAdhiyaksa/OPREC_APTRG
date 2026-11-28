<?php

namespace Tests\Feature;

use App\Models\Assignment;
use App\Models\Division;
use App\Models\Grade;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Exceptions\PostTooLargeException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SubmissionTest extends TestCase
{
    use RefreshDatabase;

    private const DRIVE = 'https://drive.google.com/file/d/abc123/view';

    private Division $system;

    private User $aktif;

    private User $magang;

    private Assignment $assignment;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');

        $this->system = Division::factory()->create(['slug' => 'system']);
        $this->aktif = User::factory()->aktif()->create(['research_division_id' => $this->system->id]);
        $this->magang = User::factory()->magang()->create(['name' => 'Budi', 'research_division_id' => $this->system->id]);
        $this->assignment = Assignment::factory()->published()->create([
            'division_id' => $this->system->id, 'created_by' => $this->aktif->id, 'max_file_size_mb' => 2,
        ]);
    }

    private function url(?Assignment $assignment = null): string
    {
        return '/api/v1/assignments/'.($assignment ?? $this->assignment)->id.'/submission';
    }

    private function submit(array $data, ?Assignment $assignment = null)
    {
        return $this->actingAsToken($this->magang)->post($this->url($assignment), $data, ['Accept' => 'application/json']);
    }

    public function test_upload_stores_private_file_and_returns_submission(): void
    {
        $response = $this->submit(['file' => UploadedFile::fake()->create('Laporan "akhir".pdf', 500, 'application/pdf'), 'note' => 'Revisi'])
            ->assertCreated()
            ->assertJsonPath('data.method', 'file')
            ->assertJsonPath('data.file_name', 'Laporan _akhir_.pdf')
            ->assertJsonPath('data.file_size', 500 * 1024)
            ->assertJsonPath('data.note', 'Revisi')
            ->assertJsonPath('data.is_late', false);

        $submission = Submission::sole();
        $this->assertMatchesRegularExpression("#^submissions/{$this->assignment->id}/[0-9a-f-]{36}\\.pdf$#", $submission->file_path);
        Storage::disk('local')->assertExists($submission->file_path);
        $response->assertJsonPath('data.download_url', "/api/v1/submissions/{$submission->id}/download")->assertJsonMissingPath('data.file_path');

        $this->getJson($this->url())->assertOk()->assertJsonPath('data.id', $submission->id);
    }

    public function test_drive_link_only_and_both(): void
    {
        $this->submit(['drive_link' => self::DRIVE])->assertCreated()->assertJsonPath('data.method', 'drive')->assertJsonPath('data.download_url', null);
        $this->submit(['drive_link' => self::DRIVE, 'file' => UploadedFile::fake()->create('a.pdf', 10, 'application/pdf')])
            ->assertOk()->assertJsonPath('data.method', 'both');
    }

    public function test_validation_errors(): void
    {
        $this->submit([])->assertStatus(422)->assertJsonValidationErrors(['file', 'drive_link']);
        $this->submit(['drive_link' => 'http://drive.google.com/x'])->assertStatus(422)->assertJsonValidationErrors('drive_link');
        $this->submit(['drive_link' => 'https://dropbox.com/x'])->assertStatus(422)->assertJsonValidationErrors('drive_link');
        $this->submit(['drive_link' => 'https://docs.google.com/document/d/x'])->assertCreated();
        $this->submit(['drive_link' => self::DRIVE, 'note' => str_repeat('a', 1001)])->assertStatus(422)->assertJsonValidationErrors('note');
    }

    public function test_file_too_large_returns_drive_fallback(): void
    {
        $this->submit(['file' => UploadedFile::fake()->create('big.pdf', 3 * 1024, 'application/pdf')])
            ->assertStatus(422)
            ->assertJsonPath('code', 'FILE_TOO_LARGE')
            ->assertJsonPath('meta', ['max_file_size_mb' => 2, 'fallback' => 'drive_link'])
            ->assertJsonValidationErrors('file');
        $this->assertSame(0, Submission::count());

        // PHP dropped the file for exceeding upload_max_filesize: same Drive hint.
        $dropped = new UploadedFile(UploadedFile::fake()->create('huge.pdf', 1)->getPathname(), 'huge.pdf', 'application/pdf', UPLOAD_ERR_INI_SIZE, true);
        $this->submit(['file' => $dropped])->assertStatus(422)->assertJsonPath('code', 'FILE_TOO_LARGE');
    }

    public function test_extension_must_match_assignment_and_file_content(): void
    {
        $this->assignment->update(['allowed_extensions' => ['pdf']]);

        $this->submit(['file' => UploadedFile::fake()->create('foto.png', 10, 'image/png')])->assertStatus(422)->assertJsonValidationErrors('file');
        // Renamed executable: the name says .pdf but the content does not.
        $this->submit(['file' => UploadedFile::fake()->create('virus.pdf', 10, 'application/x-msdownload')])->assertStatus(422)->assertJsonValidationErrors('file');
        $this->submit(['file' => UploadedFile::fake()->create('ok.pdf', 10, 'application/pdf')])->assertCreated();
    }

    public function test_submission_is_throttled_to_10_per_minute_per_user(): void
    {
        foreach (range(1, 10) as $_) {
            $this->submit(['drive_link' => self::DRIVE])->assertSuccessful();
        }

        $this->submit(['drive_link' => self::DRIVE])->assertStatus(429)->assertJsonPath('code', 'TOO_MANY_REQUESTS');

        // The limit is per user: another intern is not affected.
        $other = User::factory()->magang()->create(['research_division_id' => $this->system->id]);
        $this->actingAsToken($other)->post($this->url(), ['drive_link' => self::DRIVE], ['Accept' => 'application/json'])->assertCreated();
    }

    public function test_body_over_php_post_max_size_returns_413_json(): void
    {
        // ValidatePostSize throws this before routing when Content-Length exceeds post_max_size.
        Route::post('/api/test/too-large', fn () => throw new PostTooLargeException);

        $this->postJson('/api/test/too-large')
            ->assertStatus(413)
            ->assertJsonPath('code', 'PAYLOAD_TOO_LARGE');
    }

    public function test_deadline_passed_unless_allow_late(): void
    {
        $this->assignment->update(['due_at' => now()->subHour()]);
        $this->submit(['drive_link' => self::DRIVE])->assertStatus(409)->assertJsonPath('code', 'DEADLINE_PASSED');

        $this->assignment->update(['allow_late' => true]);
        $this->submit(['drive_link' => self::DRIVE])->assertCreated()->assertJsonPath('data.is_late', true);
    }

    public function test_grade_locked_after_publish(): void
    {
        Grade::factory()->published()->create(['assignment_id' => $this->assignment->id, 'user_id' => $this->magang->id, 'graded_by' => $this->aktif->id]);

        $this->submit(['drive_link' => self::DRIVE])->assertStatus(409)->assertJsonPath('code', 'GRADE_LOCKED');
    }

    public function test_resubmit_replaces_and_deletes_old_file(): void
    {
        $this->submit(['file' => UploadedFile::fake()->create('v1.pdf', 10, 'application/pdf')])->assertCreated();
        $oldPath = Submission::sole()->file_path;

        $this->submit(['file' => UploadedFile::fake()->create('v2.pdf', 10, 'application/pdf')])->assertOk()->assertJsonPath('data.file_name', 'v2.pdf');
        Storage::disk('local')->assertMissing($oldPath);
        Storage::disk('local')->assertExists(Submission::sole()->file_path);

        // Switching to a Drive link also removes the stored file.
        $path = Submission::sole()->file_path;
        $this->submit(['drive_link' => self::DRIVE])->assertOk()->assertJsonPath('data.method', 'drive');
        Storage::disk('local')->assertMissing($path);
        $this->assertSame(1, Submission::count());
    }

    public function test_withdraw(): void
    {
        $this->submit(['file' => UploadedFile::fake()->create('a.pdf', 10, 'application/pdf')])->assertCreated();
        $path = Submission::sole()->file_path;

        $this->deleteJson($this->url())->assertOk();
        $this->assertSame(0, Submission::count());
        Storage::disk('local')->assertMissing($path);
        $this->deleteJson($this->url())->assertNotFound();
        $this->getJson($this->url())->assertOk()->assertJsonPath('data', null);

        $this->submit(['drive_link' => self::DRIVE])->assertCreated();
        $this->assignment->update(['due_at' => now()->subMinute(), 'allow_late' => true]);
        $this->deleteJson($this->url())->assertStatus(409)->assertJsonPath('code', 'DEADLINE_PASSED');
    }

    public function test_other_division_draft_and_non_intern_are_rejected(): void
    {
        $other = Assignment::factory()->published()->create(['division_id' => Division::factory()]);
        $draft = Assignment::factory()->create(['division_id' => $this->system->id]);

        $this->submit(['drive_link' => self::DRIVE], $other)->assertNotFound()->assertJsonPath('code', 'NOT_FOUND');
        $this->submit(['drive_link' => self::DRIVE], $draft)->assertNotFound();
        $this->actingAsToken($this->aktif)->postJson($this->url(), ['drive_link' => self::DRIVE])->assertForbidden();
    }

    public function test_download_access(): void
    {
        $this->submit(['file' => UploadedFile::fake()->create('Wiring final.pdf', 10, 'application/pdf')])->assertCreated();
        $url = '/api/v1/submissions/'.Submission::sole()->id.'/download';

        foreach ([$this->magang, $this->aktif, User::factory()->admin()->create()] as $user) {
            $this->actingAsToken($user)->get($url)
                ->assertOk()
                ->assertHeader('X-Content-Type-Options', 'nosniff')
                ->assertDownload('Wiring final.pdf');
        }

        $otherIntern = User::factory()->magang()->create(['research_division_id' => $this->system->id]);
        $otherAktif = User::factory()->aktif()->create();
        $this->actingAsToken($otherIntern)->getJson($url)->assertNotFound();
        $this->actingAsToken($otherAktif)->getJson($url)->assertNotFound();

        $driveOnly = Submission::factory()->create(['assignment_id' => $this->assignment->id]);
        $this->actingAsToken($this->aktif)->getJson("/api/v1/submissions/{$driveOnly->id}/download")->assertNotFound();
    }

    public function test_staff_list_includes_missing_interns_and_counts(): void
    {
        $siti = User::factory()->magang()->create(['name' => 'Siti', 'research_division_id' => $this->system->id]);
        User::factory()->magang()->create(['name' => 'Nonaktif', 'research_division_id' => $this->system->id, 'is_active' => false]);
        Submission::factory()->create(['assignment_id' => $this->assignment->id, 'user_id' => $this->magang->id, 'is_late' => true]);
        Grade::factory()->create(['assignment_id' => $this->assignment->id, 'user_id' => $this->magang->id, 'graded_by' => $this->aktif->id]);

        $this->actingAsToken($this->aktif)->getJson("/api/v1/assignments/{$this->assignment->id}/submissions")
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.user.name', 'Budi')
            ->assertJsonPath('data.0.grade.status', 'draft')
            ->assertJsonPath('data.1.user.id', $siti->id)
            ->assertJsonPath('data.1.submission', null)
            ->assertJsonPath('meta', ['total' => 2, 'submitted' => 1, 'missing' => 1, 'late' => 1, 'graded_draft' => 1, 'graded_published' => 0]);

        $this->getJson("/api/v1/assignments/{$this->assignment->id}/submissions?status=missing")->assertJsonCount(1, 'data')->assertJsonPath('data.0.user.name', 'Siti');
        $this->getJson("/api/v1/assignments/{$this->assignment->id}/submissions?search=bud")->assertJsonCount(1, 'data');

        $this->actingAsToken($this->magang)->getJson("/api/v1/assignments/{$this->assignment->id}/submissions")->assertForbidden();
        $this->actingAsToken(User::factory()->aktif()->create())->getJson("/api/v1/assignments/{$this->assignment->id}/submissions")->assertNotFound();
    }
}
