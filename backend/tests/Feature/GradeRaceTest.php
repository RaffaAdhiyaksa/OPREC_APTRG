<?php

namespace Tests\Feature;

use App\Models\Assignment;
use App\Models\Division;
use App\Models\Grade;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTruncation;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

// DatabaseTruncation instead of RefreshDatabase: with no outer test transaction the "other request"
// insert is committed on its own, exactly like a real concurrent request.
class GradeRaceTest extends TestCase
{
    use DatabaseTruncation;

    // Truncation only runs before a test; clean up after too, so the RefreshDatabase tests that
    // follow start from empty tables.
    protected function tearDown(): void
    {
        $this->truncateDatabaseTables();
        parent::tearDown();
    }

    public function test_concurrent_first_grade_does_not_fail(): void
    {
        $division = Division::factory()->create();
        $aktif = User::factory()->aktif()->create(['research_division_id' => $division->id]);
        $magang = User::factory()->magang()->create(['research_division_id' => $division->id]);
        $assignment = Assignment::factory()->published()->create(['division_id' => $division->id, 'created_by' => $aktif->id]);

        // The other request inserts the first grade after our lookup, right before our insert.
        $inserted = false;
        Grade::creating(function () use (&$inserted, $assignment, $magang, $aktif) {
            if ($inserted) {
                return;
            }
            $inserted = true;
            DB::table('grades')->insert([
                'assignment_id' => $assignment->id, 'user_id' => $magang->id, 'graded_by' => $aktif->id,
                'score' => 50, 'status' => 'draft', 'created_at' => now(), 'updated_at' => now(),
            ]);
        });

        $this->actingAsToken($aktif)->putJson("/api/v1/assignments/{$assignment->id}/grades/{$magang->id}", ['score' => 90])
            ->assertOk()->assertJsonPath('data.score', 90)->assertJsonPath('data.status', 'draft');

        $this->assertTrue($inserted);
        $this->assertSame(1, Grade::count());
        $this->assertEquals(90, Grade::sole()->score);
    }
}
