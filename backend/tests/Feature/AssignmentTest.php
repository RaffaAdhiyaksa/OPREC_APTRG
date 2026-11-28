<?php

namespace Tests\Feature;

use App\Models\Assignment;
use App\Models\Division;
use App\Models\Grade;
use App\Models\Submission;
use App\Models\User;
use App\Notifications\AssignmentPublished;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AssignmentTest extends TestCase
{
    use RefreshDatabase;

    private Division $system;

    private Division $mechanic;

    private User $aktif;

    private User $magang;

    protected function setUp(): void
    {
        parent::setUp();

        $this->system = Division::factory()->create(['slug' => 'system']);
        $this->mechanic = Division::factory()->create(['slug' => 'mechanic']);
        $this->aktif = User::factory()->aktif()->create(['research_division_id' => $this->system->id]);
        $this->magang = User::factory()->magang()->create(['research_division_id' => $this->system->id]);
    }

    private function assignment(array $attributes = []): Assignment
    {
        return Assignment::factory()->create(['division_id' => $this->system->id, 'created_by' => $this->aktif->id, ...$attributes]);
    }

    private function payload(array $overrides = []): array
    {
        return ['title' => 'Wiring diagram', 'description' => 'Buat wiring diagram.', 'due_at' => now()->addWeek()->toIso8601String(), ...$overrides];
    }

    public function test_aktif_crud_creates_draft_in_own_division_with_stats(): void
    {
        $this->actingAsToken($this->aktif);

        $id = $this->postJson('/api/v1/assignments', $this->payload(['division_id' => $this->mechanic->id, 'allowed_extensions' => ['pdf', 'zip']]))
            ->assertCreated()
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonPath('data.division.id', $this->system->id)
            ->assertJsonPath('data.max_file_size_mb', 10)
            ->assertJsonPath('data.max_score', 100)
            ->assertJsonPath('data.allowed_extensions', ['pdf', 'zip'])
            ->assertJsonPath('data.stats', ['total_interns' => 1, 'submitted' => 0, 'late' => 0, 'graded_draft' => 0, 'graded_published' => 0])
            ->assertJsonMissingPath('data.my_grade')
            ->json('data.id');

        // Updating keeps a past due_at allowed and never changes status.
        $this->putJson("/api/v1/assignments/{$id}", ['title' => 'Baru', 'due_at' => now()->subDay()->toIso8601String(), 'status' => 'published'])
            ->assertOk()->assertJsonPath('data.title', 'Baru')->assertJsonPath('data.status', 'draft');

        $this->deleteJson("/api/v1/assignments/{$id}")->assertOk();
        $this->assertSoftDeleted('assignments', ['id' => $id]);
        $this->getJson("/api/v1/assignments/{$id}")->assertNotFound();
    }

    public function test_create_validation(): void
    {
        $this->actingAsToken($this->aktif);

        $this->postJson('/api/v1/assignments', $this->payload(['due_at' => now()->subMinute()->toIso8601String()]))->assertStatus(422)->assertJsonValidationErrors('due_at');
        $this->postJson('/api/v1/assignments', $this->payload(['max_file_size_mb' => 0]))->assertStatus(422)->assertJsonValidationErrors('max_file_size_mb');
        $this->postJson('/api/v1/assignments', $this->payload(['max_file_size_mb' => 51]))->assertStatus(422)->assertJsonValidationErrors('max_file_size_mb');
        $this->postJson('/api/v1/assignments', $this->payload(['max_file_size_mb' => 50]))->assertCreated();
        $this->postJson('/api/v1/assignments', $this->payload(['allowed_extensions' => ['pdf', 'exe']]))->assertStatus(422)->assertJsonValidationErrors('allowed_extensions.1');
        $this->postJson('/api/v1/assignments', $this->payload(['max_score' => 1001]))->assertStatus(422)->assertJsonValidationErrors('max_score');
        $this->postJson('/api/v1/assignments', $this->payload(['status' => 'published']))->assertStatus(422)->assertJsonValidationErrors('status');
        // An empty list means "whole whitelist", never "nothing allowed".
        $this->postJson('/api/v1/assignments', $this->payload(['allowed_extensions' => []]))->assertCreated()->assertJsonPath('data.allowed_extensions', null);

        config(['lms.max_upload_mb' => 20]);
        $this->postJson('/api/v1/assignments', $this->payload(['max_file_size_mb' => 25]))->assertStatus(422)->assertJsonValidationErrors('max_file_size_mb');
    }

    public function test_magang_sees_only_published_in_own_division_and_cannot_write(): void
    {
        $published = $this->assignment(['status' => 'published', 'published_at' => now()]);
        $draft = $this->assignment();
        $other = Assignment::factory()->published()->create(['division_id' => $this->mechanic->id]);

        $this->actingAsToken($this->magang);
        $this->getJson('/api/v1/assignments')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $published->id)->assertJsonMissingPath('data.0.stats');
        $this->getJson('/api/v1/assignments?status=draft')->assertJsonCount(0, 'data');
        $this->getJson("/api/v1/assignments/{$draft->id}")->assertNotFound()->assertJsonPath('code', 'NOT_FOUND');
        $this->getJson("/api/v1/assignments/{$other->id}")->assertNotFound();

        $this->postJson('/api/v1/assignments', $this->payload())->assertForbidden();
        $this->putJson("/api/v1/assignments/{$published->id}", ['title' => 'X'])->assertForbidden();
        $this->postJson("/api/v1/assignments/{$draft->id}/publish")->assertNotFound();
        $this->postJson("/api/v1/assignments/{$published->id}/publish")->assertForbidden();
        $this->deleteJson("/api/v1/assignments/{$published->id}")->assertForbidden();
    }

    public function test_aktif_gets_404_for_other_division(): void
    {
        $other = Assignment::factory()->create(['division_id' => $this->mechanic->id]);
        $this->actingAsToken($this->aktif);

        $this->getJson('/api/v1/assignments')->assertJsonCount(0, 'data');
        $this->getJson("/api/v1/assignments/{$other->id}")->assertNotFound();
        $this->putJson("/api/v1/assignments/{$other->id}", ['title' => 'X'])->assertNotFound();
        $this->postJson("/api/v1/assignments/{$other->id}/publish")->assertNotFound();
        $this->deleteJson("/api/v1/assignments/{$other->id}")->assertNotFound();
    }

    public function test_admin_sees_all_and_must_pick_research_division(): void
    {
        $this->assignment();
        Assignment::factory()->create(['division_id' => $this->mechanic->id]);
        $this->actingAsToken(User::factory()->admin()->create());

        $this->getJson('/api/v1/assignments')->assertJsonCount(2, 'data');
        $this->getJson("/api/v1/assignments?division_id={$this->mechanic->id}")->assertJsonCount(1, 'data');
        $this->postJson('/api/v1/assignments', $this->payload())->assertStatus(422)->assertJsonValidationErrors('division_id');
        $this->postJson('/api/v1/assignments', $this->payload(['division_id' => $this->mechanic->id]))->assertCreated()->assertJsonPath('data.division.id', $this->mechanic->id);
    }

    public function test_filters_due_and_search(): void
    {
        $this->assignment(['title' => 'Avionik', 'due_at' => now()->addDay()]);
        $this->assignment(['title' => 'Struktur', 'due_at' => now()->subDay()]);
        $this->actingAsToken($this->aktif);

        $this->getJson('/api/v1/assignments?due=upcoming')->assertJsonCount(1, 'data')->assertJsonPath('data.0.title', 'Avionik');
        $this->getJson('/api/v1/assignments?due=past')->assertJsonCount(1, 'data')->assertJsonPath('data.0.title', 'Struktur');
        $this->getJson('/api/v1/assignments?search=avio')->assertJsonCount(1, 'data');
    }

    public function test_publish_notifies_only_active_interns_of_that_division(): void
    {
        Notification::fake();
        $inactive = User::factory()->magang()->create(['research_division_id' => $this->system->id, 'is_active' => false]);
        $otherDivision = User::factory()->magang()->create(['research_division_id' => $this->mechanic->id]);
        $assignment = $this->assignment();

        $this->actingAsToken($this->aktif)->postJson("/api/v1/assignments/{$assignment->id}/publish")
            ->assertOk()->assertJsonPath('data.status', 'published');

        $this->assertNotNull($assignment->fresh()->published_at);
        Notification::assertSentTo($this->magang, AssignmentPublished::class, fn ($n, $channels) => $channels === ['database']);
        Notification::assertNotSentTo([$inactive, $otherDivision, $this->aktif], AssignmentPublished::class);
        Notification::assertCount(1);

        $this->postJson("/api/v1/assignments/{$assignment->id}/publish")->assertStatus(422)->assertJsonPath('code', 'ALREADY_PUBLISHED');
    }

    public function test_publish_stores_database_notification_for_the_frontend(): void
    {
        $assignment = $this->assignment(['title' => 'Wiring']);

        $this->actingAsToken($this->aktif)->postJson("/api/v1/assignments/{$assignment->id}/publish")->assertOk();

        $notification = $this->magang->notifications()->sole();
        $this->assertSame('assignment_published', $notification->type);
        $this->assertSame('Tugas baru: Wiring', $notification->data['title']);
        $this->assertSame("/assignments/{$assignment->id}", $notification->data['link']);
    }

    public function test_magang_sees_own_submission_and_only_published_grade(): void
    {
        $assignment = $this->assignment(['status' => 'published', 'published_at' => now()]);
        $submission = Submission::factory()->create(['assignment_id' => $assignment->id, 'user_id' => $this->magang->id]);
        $grade = Grade::factory()->create(['assignment_id' => $assignment->id, 'user_id' => $this->magang->id, 'graded_by' => $this->aktif->id, 'score' => 85]);
        // Another intern's published grade must never show up as mine.
        Grade::factory()->published()->create(['assignment_id' => $assignment->id, 'graded_by' => $this->aktif->id]);

        $this->actingAsToken($this->magang);
        $this->getJson("/api/v1/assignments/{$assignment->id}")
            ->assertOk()
            ->assertJsonPath('data.my_submission.id', $submission->id)
            ->assertJsonPath('data.my_submission.method', 'drive')
            ->assertJsonPath('data.my_grade', null)
            ->assertJsonPath('data.can_submit', true)
            ->assertJsonPath('data.is_overdue', false)
            ->assertJsonMissingPath('data.stats');
        $this->assertStringNotContainsString('"score"', $this->getJson('/api/v1/assignments')->getContent());

        $grade->update(['status' => 'published', 'published_at' => now()]);
        $this->getJson("/api/v1/assignments/{$assignment->id}")
            ->assertJsonPath('data.my_grade.id', $grade->id)
            ->assertJsonPath('data.my_grade.score', 85)
            ->assertJsonPath('data.my_grade.graded_by.id', $this->aktif->id)
            ->assertJsonPath('data.can_submit', false);
    }

    public function test_can_submit_follows_deadline_and_allow_late(): void
    {
        $closed = $this->assignment(['status' => 'published', 'due_at' => now()->subHour()]);
        $late = $this->assignment(['status' => 'published', 'due_at' => now()->subHour(), 'allow_late' => true]);
        $this->actingAsToken($this->magang);

        $this->getJson("/api/v1/assignments/{$closed->id}")->assertJsonPath('data.is_overdue', true)->assertJsonPath('data.can_submit', false);
        $this->getJson("/api/v1/assignments/{$late->id}")->assertJsonPath('data.can_submit', true);
    }

    public function test_staff_stats_count_submissions_and_grades(): void
    {
        $assignment = $this->assignment(['status' => 'published']);
        User::factory()->magang()->create(['research_division_id' => $this->system->id]);
        Submission::factory()->create(['assignment_id' => $assignment->id, 'user_id' => $this->magang->id, 'is_late' => true]);
        Grade::factory()->create(['assignment_id' => $assignment->id, 'user_id' => $this->magang->id, 'graded_by' => $this->aktif->id]);

        $this->actingAsToken($this->aktif)->getJson('/api/v1/assignments')
            ->assertJsonPath('data.0.stats', ['total_interns' => 2, 'submitted' => 1, 'late' => 1, 'graded_draft' => 1, 'graded_published' => 0]);
    }
}
