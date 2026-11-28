<?php

namespace Tests\Feature;

use App\Models\Assignment;
use App\Models\Division;
use App\Models\Grade;
use App\Models\Submission;
use App\Models\User;
use App\Notifications\GradeNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class GradeTest extends TestCase
{
    use RefreshDatabase;

    private Division $system;

    private User $aktif;

    private User $magang;

    private Assignment $assignment;

    protected function setUp(): void
    {
        parent::setUp();

        $this->system = Division::factory()->create(['slug' => 'system']);
        $this->aktif = User::factory()->aktif()->create(['research_division_id' => $this->system->id]);
        $this->magang = User::factory()->magang()->create(['research_division_id' => $this->system->id]);
        $this->assignment = Assignment::factory()->published()->create(['division_id' => $this->system->id, 'created_by' => $this->aktif->id, 'title' => 'Wiring']);
    }

    private function gradeUrl(?User $user = null): string
    {
        return "/api/v1/assignments/{$this->assignment->id}/grades/".($user ?? $this->magang)->id;
    }

    public function test_new_grade_is_draft_and_hidden_from_intern(): void
    {
        $submission = Submission::factory()->create(['assignment_id' => $this->assignment->id, 'user_id' => $this->magang->id]);

        $this->actingAsToken($this->aktif)->putJson($this->gradeUrl(), ['score' => 87.5, 'feedback' => 'Rapi'])
            ->assertOk()
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonPath('data.score', 87.5)
            ->assertJsonPath('data.graded_by.id', $this->aktif->id);
        $this->assertSame($submission->id, Grade::sole()->submission_id);

        $this->actingAsToken($this->magang);
        $this->getJson('/api/v1/me/grades')->assertOk()->assertJsonCount(0, 'data')->assertJsonPath('meta.average', null);
        $this->getJson("/api/v1/assignments/{$this->assignment->id}")->assertJsonPath('data.my_grade', null);
    }

    public function test_score_validation_and_target_must_be_intern_of_division(): void
    {
        $this->actingAsToken($this->aktif);

        $this->putJson($this->gradeUrl(), ['score' => 101])->assertStatus(422)->assertJsonValidationErrors('score');
        $this->putJson($this->gradeUrl(), ['score' => -1])->assertStatus(422)->assertJsonValidationErrors('score');
        $this->putJson($this->gradeUrl(), ['score' => 0])->assertOk();
        $this->putJson($this->gradeUrl(User::factory()->magang()->create()), ['score' => 50])->assertNotFound();
        $this->putJson($this->gradeUrl($this->aktif), ['score' => 50])->assertNotFound();
    }

    public function test_only_staff_of_the_division_can_grade(): void
    {
        $this->actingAsToken($this->magang)->putJson($this->gradeUrl(), ['score' => 100])->assertForbidden();
        $this->actingAsToken(User::factory()->aktif()->create())->putJson($this->gradeUrl(), ['score' => 100])->assertNotFound();
        $this->actingAsToken(User::factory()->admin()->create())->putJson($this->gradeUrl(), ['score' => 100])->assertOk();
        $this->actingAsToken($this->magang)->postJson("/api/v1/assignments/{$this->assignment->id}/grades/publish")->assertForbidden();
    }

    public function test_publish_all_or_selected_drafts_notifies_each_intern_once(): void
    {
        Notification::fake();
        $second = User::factory()->magang()->create(['research_division_id' => $this->system->id]);
        $third = User::factory()->magang()->create(['research_division_id' => $this->system->id]);
        foreach ([$this->magang, $second, $third] as $intern) {
            Grade::factory()->create(['assignment_id' => $this->assignment->id, 'user_id' => $intern->id, 'graded_by' => $this->aktif->id]);
        }
        $url = "/api/v1/assignments/{$this->assignment->id}/grades/publish";
        $this->actingAsToken($this->aktif);

        $this->postJson($url, ['user_ids' => [$second->id]])->assertOk()->assertJsonPath('data.published_count', 1);
        Notification::assertSentTo($second, GradeNotification::class, fn ($n) => $n->type === 'grade_published');
        Notification::assertNotSentTo([$this->magang, $third], GradeNotification::class);

        $this->postJson($url)->assertOk()->assertJsonPath('data.published_count', 2);
        $this->postJson($url)->assertOk()->assertJsonPath('data.published_count', 0);
        Notification::assertCount(3);
        $this->assertSame(3, Grade::where('status', 'published')->whereNotNull('published_at')->count());
    }

    public function test_published_grade_shows_for_intern_with_average(): void
    {
        $other = Assignment::factory()->published()->create(['division_id' => $this->system->id, 'max_score' => 50]);
        Grade::factory()->published()->create(['assignment_id' => $this->assignment->id, 'user_id' => $this->magang->id, 'graded_by' => $this->aktif->id, 'score' => 80]);
        Grade::factory()->published()->create(['assignment_id' => $other->id, 'user_id' => $this->magang->id, 'graded_by' => $this->aktif->id, 'score' => 45]);
        Assignment::factory()->create(['division_id' => $this->system->id]); // draft, not counted

        $this->actingAsToken($this->magang)->getJson('/api/v1/me/grades')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.assignment.max_score', fn ($v) => in_array($v, [50, 100], true))
            ->assertJsonPath('meta', ['average' => 85, 'published_count' => 2, 'assignments_total' => 2]);

        $this->getJson("/api/v1/assignments/{$this->assignment->id}")->assertJsonPath('data.my_grade.score', 80);
        $this->actingAsToken($this->aktif)->getJson('/api/v1/me/grades')->assertForbidden();
    }

    public function test_editing_published_grade_keeps_it_published_and_notifies(): void
    {
        Notification::fake();
        Grade::factory()->published()->create(['assignment_id' => $this->assignment->id, 'user_id' => $this->magang->id, 'graded_by' => $this->aktif->id, 'score' => 70]);

        $this->actingAsToken($this->aktif)->putJson($this->gradeUrl(), ['score' => 75, 'feedback' => 'Revisi'])
            ->assertOk()->assertJsonPath('data.status', 'published')->assertJsonPath('data.score', 75);

        Notification::assertSentTo($this->magang, GradeNotification::class, fn ($n) => $n->type === 'grade_updated');
    }

    public function test_draft_edits_do_not_notify(): void
    {
        Notification::fake();
        $this->actingAsToken($this->aktif)->putJson($this->gradeUrl(), ['score' => 60])->assertOk();
        $this->putJson($this->gradeUrl(), ['score' => 65])->assertOk();

        Notification::assertNothingSent();
    }

    public function test_unpublish_hides_grade_again(): void
    {
        $grade = Grade::factory()->published()->create(['assignment_id' => $this->assignment->id, 'user_id' => $this->magang->id, 'graded_by' => $this->aktif->id]);

        $this->actingAsToken($this->magang)->postJson("/api/v1/grades/{$grade->id}/unpublish")->assertForbidden();
        $this->actingAsToken(User::factory()->aktif()->create())->postJson("/api/v1/grades/{$grade->id}/unpublish")->assertNotFound();
        $this->actingAsToken($this->aktif)->postJson("/api/v1/grades/{$grade->id}/unpublish")
            ->assertOk()->assertJsonPath('data.status', 'draft')->assertJsonPath('data.published_at', null);

        $this->actingAsToken($this->magang)->getJson('/api/v1/me/grades')->assertJsonCount(0, 'data');
    }

    public function test_grade_notifications_are_stored_for_the_frontend(): void
    {
        Grade::factory()->create(['assignment_id' => $this->assignment->id, 'user_id' => $this->magang->id, 'graded_by' => $this->aktif->id, 'score' => 90]);

        $this->actingAsToken($this->aktif)->postJson("/api/v1/assignments/{$this->assignment->id}/grades/publish")->assertOk();

        $notification = $this->magang->notifications()->sole();
        $this->assertSame('grade_published', $notification->type);
        $this->assertSame(['title' => 'Nilai Wiring sudah keluar', 'excerpt' => 'Skor: 90', 'link' => "/assignments/{$this->assignment->id}"],
            array_intersect_key($notification->data, array_flip(['title', 'excerpt', 'link'])));
    }

    public function test_dashboard_pending_grading_uses_submissions_and_published_grades(): void
    {
        Submission::factory()->create(['assignment_id' => $this->assignment->id, 'user_id' => $this->magang->id]);
        $this->actingAsToken(User::factory()->admin()->create());
        $pending = fn () => collect($this->getJson('/api/v1/admin/dashboard')->json('data.divisions'))->firstWhere('division.id', $this->system->id)['pending_grading'];

        $this->assertSame(1, $pending());
        $grade = Grade::factory()->create(['assignment_id' => $this->assignment->id, 'user_id' => $this->magang->id, 'graded_by' => $this->aktif->id]);
        $this->assertSame(1, $pending());
        $grade->update(['status' => 'published', 'published_at' => now()]);
        $this->assertSame(0, $pending());
    }
}
