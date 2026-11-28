<?php

namespace Tests\Feature\Admin;

use App\Models\Assignment;
use App\Models\Division;
use App\Models\Grade;
use App\Models\Submission;
use App\Models\User;
use Database\Seeders\DivisionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DivisionAndDashboardTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DivisionSeeder::class);
    }

    private function division(string $slug): Division
    {
        return Division::where('slug', $slug)->sole();
    }

    public function test_non_admin_sees_only_active_divisions_without_counts(): void
    {
        $this->actingAsToken(User::factory()->magang()->create(['research_division_id' => $this->division('system')->id]))
            ->getJson('/api/v1/divisions')
            ->assertOk()
            ->assertJsonCount(7, 'data')
            ->assertJsonMissingPath('data.0.members_count')
            ->assertJsonPath('data.0.slug', 'mechanic');
    }

    public function test_admin_sees_all_divisions_with_members_count(): void
    {
        $system = $this->division('system');
        User::factory()->count(2)->magang()->create(['research_division_id' => $system->id]);
        User::factory()->magang()->create(['research_division_id' => $system->id])->delete();
        $aktif = User::factory()->aktif()->create(['research_division_id' => $system->id]);
        $aktif->competitionDivisions()->attach($this->division('fixed-wing'));

        $data = collect($this->actingAsToken(User::factory()->admin()->create())
            ->getJson('/api/v1/divisions')
            ->assertOk()
            ->assertJsonCount(8, 'data')
            ->json('data'))->keyBy('slug');

        $this->assertSame(3, $data['system']['members_count']);
        $this->assertSame(1, $data['fixed-wing']['members_count']);
        $this->assertSame(0, $data['teknofest']['members_count']);
    }

    public function test_admin_toggles_only_optional_divisions(): void
    {
        $this->actingAsToken(User::factory()->admin()->create());

        $this->patchJson('/api/v1/admin/divisions/'.$this->division('teknofest')->id, ['is_active' => true])
            ->assertOk()->assertJsonPath('data.is_active', true);
        $this->assertTrue($this->division('teknofest')->is_active);

        $this->patchJson('/api/v1/admin/divisions/'.$this->division('system')->id, ['is_active' => false])
            ->assertStatus(422)->assertJsonPath('code', 'DIVISION_NOT_OPTIONAL');
        $this->assertTrue($this->division('system')->is_active);

        $this->actingAsToken(User::factory()->coordinator()->create(['research_division_id' => $this->division('system')->id]))
            ->patchJson('/api/v1/admin/divisions/'.$this->division('teknofest')->id, ['is_active' => false])
            ->assertForbidden();
    }

    public function test_dashboard_counts_users_per_role_and_research_division(): void
    {
        $system = $this->division('system');
        $mechanic = $this->division('mechanic');
        $admin = User::factory()->admin()->create();
        User::factory()->aktif()->create(['research_division_id' => $system->id]);
        User::factory()->count(2)->magang()->create(['research_division_id' => $system->id]);
        User::factory()->magang()->create(['research_division_id' => $mechanic->id, 'is_active' => false]);
        User::factory()->magang()->create(['research_division_id' => $mechanic->id])->delete();

        $this->actingAsToken($admin)->getJson('/api/v1/admin/dashboard')
            ->assertOk()
            ->assertExactJson(['data' => [
                'users' => ['admin' => 1, 'asisten_aktif' => 1, 'asisten_magang' => 3, 'inactive' => 1],
                'pending_grading' => 0,
                'divisions' => collect(['mechanic', 'system', 'gcs', 'non-technical'])->map(fn ($slug) => [
                    'division' => $this->division($slug)->only(['id', 'slug', 'name']),
                    'asisten_aktif' => $slug === 'system' ? 1 : 0,
                    'asisten_magang' => ['system' => 2, 'mechanic' => 1][$slug] ?? 0,
                    'assignments_published' => 0,
                    'pending_grading' => 0,
                ])->all(),
                'recent_announcements' => [],
            ]]);
    }

    public function test_dashboard_counts_published_assignments_and_pending_grading(): void
    {
        $system = $this->division('system');
        $published = Assignment::factory()->published()->create(['division_id' => $system->id]);
        Assignment::factory()->create(['division_id' => $system->id]);
        Assignment::factory()->published()->create(['division_id' => $system->id])->delete();

        Submission::factory()->create(['assignment_id' => $published->id]); // no grade yet
        $draftGraded = Submission::factory()->create(['assignment_id' => $published->id]);
        Grade::factory()->create(['assignment_id' => $published->id, 'user_id' => $draftGraded->user_id]);
        $done = Submission::factory()->create(['assignment_id' => $published->id]);
        Grade::factory()->published()->create(['assignment_id' => $published->id, 'user_id' => $done->user_id]);

        $data = $this->actingAsToken(User::factory()->admin()->create())->getJson('/api/v1/admin/dashboard')->assertOk()->json('data');
        $row = collect($data['divisions'])->firstWhere('division.slug', 'system');

        $this->assertSame(1, $row['assignments_published']);
        $this->assertSame(2, $row['pending_grading']);
        $this->assertSame(2, $data['pending_grading']);
    }
}
