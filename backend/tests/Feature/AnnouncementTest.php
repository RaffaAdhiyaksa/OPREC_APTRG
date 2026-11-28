<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\Announcement;
use App\Models\Division;
use App\Models\User;
use App\Notifications\AnnouncementPublished;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\Events\NotificationSending;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use RuntimeException;
use Tests\TestCase;

class AnnouncementTest extends TestCase
{
    use RefreshDatabase;

    private Division $system;

    private Division $mechanic;

    private User $admin;

    private User $coordinator;

    private User $aktif;

    private User $magang;

    private User $magangMech;

    protected function setUp(): void
    {
        parent::setUp();

        $this->system = Division::factory()->create(['slug' => 'system', 'name' => 'System']);
        $this->mechanic = Division::factory()->create(['slug' => 'mechanic']);
        $this->admin = User::factory()->admin()->create();
        $this->coordinator = User::factory()->coordinator()->create(['research_division_id' => $this->system->id]);
        $this->aktif = User::factory()->aktif()->create(['research_division_id' => $this->system->id]);
        $this->magang = User::factory()->magang()->create(['research_division_id' => $this->system->id]);
        $this->magangMech = User::factory()->magang()->create(['research_division_id' => $this->mechanic->id]);
    }

    private function announce(User $author, array $payload = [])
    {
        return $this->actingAsToken($author)->postJson('/api/v1/announcements', ['title' => 'Libur', 'body' => 'Lab libur besok.', ...$payload]);
    }

    public function test_coordinator_is_forced_to_interns_of_own_division(): void
    {
        $this->announce($this->coordinator, ['research_division_id' => $this->mechanic->id, 'target_role' => 'asisten_aktif'])
            ->assertCreated()
            ->assertJsonPath('data.target.division.id', $this->system->id)
            ->assertJsonPath('data.target.role', 'asisten_magang')
            ->assertJsonPath('data.author.id', $this->coordinator->id)
            ->assertJsonPath('data.recipients_count', 1)
            ->assertJsonPath('data.is_read', true);

        $this->actingAsToken($this->magang)->getJson('/api/v1/announcements')->assertJsonCount(1, 'data')->assertJsonPath('data.0.is_read', false);
        $this->actingAsToken($this->aktif)->getJson('/api/v1/announcements')->assertJsonCount(0, 'data');
        $this->actingAsToken($this->magangMech)->getJson('/api/v1/announcements')->assertJsonCount(0, 'data');
    }

    public function test_non_coordinator_aktif_and_magang_cannot_send(): void
    {
        $this->announce($this->aktif)->assertForbidden()->assertJsonPath('code', 'FORBIDDEN');
        $this->announce($this->magang)->assertForbidden();
        $this->actingAsToken($this->aktif)->getJson('/api/v1/announcements/sent')->assertForbidden();
        $this->assertSame(0, Announcement::count());
    }

    public function test_admin_targets_division_and_role(): void
    {
        Notification::fake();
        $inactive = User::factory()->magang()->create(['research_division_id' => $this->system->id, 'is_active' => false]);

        $this->announce($this->admin, ['research_division_id' => $this->system->id, 'target_role' => 'asisten_magang'])->assertCreated();
        Notification::assertSentTo($this->magang, AnnouncementPublished::class);
        Notification::assertNotSentTo([$inactive, $this->magangMech, $this->aktif, $this->coordinator, $this->admin], AnnouncementPublished::class);

        $competition = Division::factory()->competition()->create();
        $this->announce($this->admin, ['research_division_id' => $competition->id])->assertStatus(422)->assertJsonValidationErrors('research_division_id');
        $this->announce($this->admin, ['target_role' => 'superuser'])->assertStatus(422)->assertJsonValidationErrors('target_role');
        $this->announce($this->admin, ['title' => ''])->assertStatus(422)->assertJsonValidationErrors('title');
    }

    public function test_global_broadcast_reaches_every_active_user_except_author(): void
    {
        Notification::fake();
        $otherAdmin = User::factory()->admin()->create();
        User::factory()->aktif()->create(['is_active' => false]);

        $this->announce($this->admin)->assertCreated();

        Notification::assertSentTo([$otherAdmin, $this->coordinator, $this->aktif, $this->magang, $this->magangMech], AnnouncementPublished::class);
        Notification::assertNotSentTo($this->admin, AnnouncementPublished::class);
        Notification::assertCount(5);
    }

    public function test_recipients_count_is_stored_at_creation(): void
    {
        $id = $this->announce($this->admin, ['research_division_id' => $this->system->id])->assertCreated()->assertJsonPath('data.recipients_count', 3)->json('data.id');

        // coordinator, aktif and magang of System; admin is the author and has no division.
        $this->assertDatabaseHas('announcements', ['id' => $id, 'recipients_count' => 3]);

        // Later changes to the audience do not rewrite history.
        User::factory()->magang()->create(['research_division_id' => $this->system->id]);
        $this->getJson("/api/v1/announcements/{$id}")->assertJsonPath('data.recipients_count', 3);
    }

    public function test_failed_notification_rolls_back_the_announcement(): void
    {
        Event::listen(NotificationSending::class, fn () => throw new RuntimeException('mail server down'));

        $this->announce($this->admin)->assertStatus(500);

        $this->assertDatabaseCount('announcements', 0);
        $this->assertDatabaseCount('notifications', 0);
    }

    public function test_visibility_per_division_and_role(): void
    {
        $global = Announcement::factory()->create(['author_id' => $this->admin->id]);
        $systemAll = Announcement::factory()->create(['author_id' => $this->admin->id, 'research_division_id' => $this->system->id]);
        $systemAktif = Announcement::factory()->create(['author_id' => $this->admin->id, 'research_division_id' => $this->system->id, 'target_role' => Role::AsistenAktif]);
        $mechanic = Announcement::factory()->create(['author_id' => $this->admin->id, 'research_division_id' => $this->mechanic->id]);

        $ids = fn (User $u) => collect($this->actingAsToken($u)->getJson('/api/v1/announcements')->assertOk()->json('data'))->pluck('id')->sort()->values()->all();

        $this->assertSame([$global->id, $systemAll->id], $ids($this->magang));
        $this->assertSame([$global->id, $systemAll->id, $systemAktif->id], $ids($this->aktif));
        $this->assertSame([$global->id, $mechanic->id], $ids($this->magangMech));
        $this->assertCount(4, $ids($this->admin));

        $this->actingAsToken($this->magang)->getJson("/api/v1/announcements/{$systemAktif->id}")->assertNotFound()->assertJsonPath('code', 'NOT_FOUND');
        $this->getJson("/api/v1/announcements/{$systemAll->id}")->assertOk()->assertJsonPath('data.target.division.slug', 'system');
    }

    public function test_read_is_idempotent_and_marks_the_notification(): void
    {
        $id = $this->announce($this->coordinator)->json('data.id');
        $this->assertSame(1, $this->magang->unreadNotifications()->count());

        $this->actingAsToken($this->magang);
        $this->getJson('/api/v1/announcements?unread=1')->assertJsonCount(1, 'data');
        $this->postJson("/api/v1/announcements/{$id}/read")->assertOk();
        $this->postJson("/api/v1/announcements/{$id}/read")->assertOk();

        $this->assertDatabaseCount('announcement_reads', 1);
        $this->assertSame(0, $this->magang->unreadNotifications()->count());
        $this->getJson('/api/v1/announcements?unread=1')->assertJsonCount(0, 'data');
        $this->getJson("/api/v1/announcements/{$id}")->assertJsonPath('data.is_read', true);

        $this->actingAsToken($this->coordinator)->getJson('/api/v1/announcements/sent')
            ->assertJsonCount(1, 'data')->assertJsonPath('data.0.recipients_count', 1)->assertJsonPath('data.0.read_count', 1);

        $this->actingAsToken($this->magangMech)->postJson("/api/v1/announcements/{$id}/read")->assertNotFound();
    }

    public function test_delete_by_author_or_admin_removes_notifications(): void
    {
        $id = $this->announce($this->coordinator)->json('data.id');
        $other = $this->announce($this->admin)->json('data.id');
        $this->assertSame(2, $this->magang->notifications()->count());

        $this->actingAsToken($this->magang)->deleteJson("/api/v1/announcements/{$id}")->assertForbidden();
        $this->actingAsToken($this->coordinator)->deleteJson("/api/v1/announcements/{$other}")->assertForbidden();
        $this->actingAsToken($this->coordinator)->deleteJson("/api/v1/announcements/{$id}")->assertOk();

        $this->assertDatabaseMissing('announcements', ['id' => $id]);
        $this->assertSame([$other], $this->magang->notifications()->get()->pluck('data.announcement_id')->all());

        $this->actingAsToken($this->admin)->deleteJson("/api/v1/announcements/{$other}")->assertOk();
        $this->assertSame(0, $this->magang->notifications()->count());
    }

    public function test_admin_dashboard_lists_three_recent_announcements(): void
    {
        foreach (range(1, 4) as $i) {
            $this->travel(1)->minutes();
            Announcement::factory()->create(['author_id' => $this->admin->id, 'title' => "Pengumuman {$i}"]);
        }

        $this->actingAsToken($this->admin)->getJson('/api/v1/admin/dashboard')
            ->assertJsonCount(3, 'data.recent_announcements')
            ->assertJsonPath('data.recent_announcements.0.title', 'Pengumuman 4')
            ->assertJsonPath('data.recent_announcements.0.author.id', $this->admin->id);
    }
}
