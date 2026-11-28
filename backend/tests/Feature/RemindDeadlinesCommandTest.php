<?php

namespace Tests\Feature;

use App\Models\Assignment;
use App\Models\Division;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RemindDeadlinesCommandTest extends TestCase
{
    use RefreshDatabase;

    private Division $system;

    private User $magang;

    protected function setUp(): void
    {
        parent::setUp();

        $this->system = Division::factory()->create();
        $this->magang = User::factory()->magang()->create(['research_division_id' => $this->system->id]);
    }

    private function assignment(array $attributes = []): Assignment
    {
        return Assignment::factory()->published()->create(['division_id' => $this->system->id, 'due_at' => now()->addHours(5), ...$attributes]);
    }

    private function reminders(User $user): int
    {
        return $user->notifications()->where('type', 'deadline_reminder')->count();
    }

    public function test_reminds_each_intern_once_with_the_shared_payload(): void
    {
        $assignment = $this->assignment(['title' => 'Wiring']);

        $this->artisan('lms:remind-deadlines')->expectsOutputToContain('1 pengingat')->assertSuccessful();
        $this->artisan('lms:remind-deadlines')->expectsOutputToContain('0 pengingat')->assertSuccessful();

        $this->assertSame(1, $this->reminders($this->magang));
        $data = $this->magang->notifications()->sole()->data;
        $this->assertSame(['type', 'title', 'excerpt', 'link', 'assignment_id'], array_keys($data));
        $this->assertSame('deadline_reminder', $data['type']);
        $this->assertSame('Deadline: Wiring', $data['title']);
        $this->assertSame("/assignments/{$assignment->id}", $data['link']);
        $this->assertStringContainsString('WIB', $data['excerpt']);

        // Month names follow the Indonesian UI ("Des", not "Dec").
        $december = $this->assignment(['due_at' => now()->setDate(2026, 12, 5)->setTime(16, 59)]);
        $this->assertStringContainsString('05 Des 2026 23:59 WIB', (new \App\Notifications\DeadlineReminder($december))->toArray($this->magang)['excerpt']);

        $this->actingAsToken($this->magang)->getJson('/api/v1/notifications')->assertJsonPath('data.0.type', 'deadline_reminder');
    }

    public function test_skips_submitted_other_division_and_inactive_interns(): void
    {
        $assignment = $this->assignment();
        $submitted = User::factory()->magang()->create(['research_division_id' => $this->system->id]);
        Submission::factory()->create(['assignment_id' => $assignment->id, 'user_id' => $submitted->id]);
        $otherDivision = User::factory()->magang()->create();
        $inactive = User::factory()->magang()->create(['research_division_id' => $this->system->id, 'is_active' => false]);
        $aktif = User::factory()->aktif()->create(['research_division_id' => $this->system->id]);

        $this->artisan('lms:remind-deadlines')->assertSuccessful();

        $this->assertSame(1, $this->reminders($this->magang));
        foreach ([$submitted, $otherDivision, $inactive, $aktif] as $user) {
            $this->assertSame(0, $this->reminders($user));
        }
    }

    public function test_ignores_draft_past_far_and_deleted_assignments(): void
    {
        Assignment::factory()->create(['division_id' => $this->system->id, 'due_at' => now()->addHours(5)]); // draft
        $this->assignment(['due_at' => now()->subMinute()]);
        $this->assignment(['due_at' => now()->addHours(25)]);
        $this->assignment()->delete();

        $this->artisan('lms:remind-deadlines')->assertSuccessful();

        $this->assertSame(0, $this->reminders($this->magang));
    }

    public function test_is_scheduled_hourly(): void
    {
        $event = collect(app(Schedule::class)->events())->first(fn ($e) => str_contains($e->command, 'lms:remind-deadlines'));

        $this->assertNotNull($event);
        $this->assertSame('0 * * * *', $event->expression);
    }
}
