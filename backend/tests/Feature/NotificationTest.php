<?php

namespace Tests\Feature;

use App\Models\Announcement;
use App\Models\Assignment;
use App\Models\Division;
use App\Models\Grade;
use App\Models\User;
use App\Notifications\AnnouncementPublished;
use App\Notifications\AssignmentPublished;
use App\Notifications\GradeNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    private User $magang;

    private Assignment $assignment;

    protected function setUp(): void
    {
        parent::setUp();

        $division = Division::factory()->create();
        $aktif = User::factory()->aktif()->create(['research_division_id' => $division->id]);
        $this->magang = User::factory()->magang()->create(['research_division_id' => $division->id]);
        $this->assignment = Assignment::factory()->published()->create(['division_id' => $division->id, 'created_by' => $aktif->id, 'title' => 'Wiring']);
    }

    private function sendAllFourTypes(): void
    {
        $grade = Grade::factory()->published()->create(['assignment_id' => $this->assignment->id, 'user_id' => $this->magang->id, 'score' => 85]);
        $this->magang->notify(new AnnouncementPublished(Announcement::factory()->create(['title' => 'Libur'])));
        $this->magang->notify(new AssignmentPublished($this->assignment));
        $this->magang->notify(GradeNotification::published($grade));
        $this->magang->notify(GradeNotification::updated($grade));
    }

    public function test_all_four_types_share_one_payload_shape(): void
    {
        $this->sendAllFourTypes();

        $data = $this->actingAsToken($this->magang)->getJson('/api/v1/notifications')
            ->assertOk()
            ->assertJsonCount(4, 'data')
            ->assertJsonPath('meta.total', 4)
            ->assertJsonPath('meta.unread_count', 4)
            ->json('data');

        foreach ($data as $notification) {
            $this->assertSame(['id', 'type', 'title', 'excerpt', 'link', 'read_at', 'created_at'], array_keys($notification));
            $this->assertStringStartsWith('/', $notification['link']);
        }
        $this->assertEqualsCanonicalizing(['announcement', 'assignment_published', 'grade_published', 'grade_updated'], array_column($data, 'type'));
        $this->assertContains("/assignments/{$this->assignment->id}", array_column($data, 'link'));

        foreach ($this->magang->notifications as $stored) {
            $this->assertSame($stored->type, $stored->data['type']);
            $this->assertArrayHasKey($stored->type === 'announcement' ? 'announcement_id' : 'assignment_id', $stored->data);
        }
    }

    public function test_unread_count_mark_one_and_read_all(): void
    {
        $this->sendAllFourTypes();
        $this->actingAsToken($this->magang);

        $this->getJson('/api/v1/notifications/unread-count')->assertExactJson(['data' => ['count' => 4]]);
        $this->getJson('/api/v1/auth/me')->assertJsonPath('data.unread_notifications_count', 4);

        $id = $this->magang->notifications()->first()->id;
        $this->patchJson("/api/v1/notifications/{$id}/read")->assertOk()->assertJsonPath('data.id', $id)->assertJsonPath('data.read_at', fn ($v) => $v !== null);
        $this->getJson('/api/v1/notifications/unread-count')->assertJsonPath('data.count', 3);
        $this->getJson('/api/v1/notifications?unread=1')->assertJsonCount(3, 'data')->assertJsonPath('meta.unread_count', 3);

        $this->postJson('/api/v1/notifications/read-all')->assertOk();
        $this->getJson('/api/v1/notifications/unread-count')->assertJsonPath('data.count', 0);
        $this->getJson('/api/v1/auth/me')->assertJsonPath('data.unread_notifications_count', 0);
    }

    public function test_other_users_notification_is_404_and_untouched(): void
    {
        $this->sendAllFourTypes();
        $id = $this->magang->notifications()->first()->id;
        $other = User::factory()->magang()->create();

        $this->actingAsToken($other);
        $this->patchJson("/api/v1/notifications/{$id}/read")->assertNotFound()->assertJsonPath('code', 'NOT_FOUND');
        $this->getJson('/api/v1/notifications')->assertJsonCount(0, 'data');
        $this->postJson('/api/v1/notifications/read-all')->assertOk();

        $this->assertSame(4, $this->magang->unreadNotifications()->count());
    }
}
