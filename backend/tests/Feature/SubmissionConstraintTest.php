<?php

namespace Tests\Feature;

use App\Models\Submission;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SubmissionConstraintTest extends TestCase
{
    use RefreshDatabase;

    public function test_submission_without_file_or_drive_link_is_rejected_by_database(): void
    {
        $this->expectException(QueryException::class);
        $this->expectExceptionMessage('submissions_file_or_link_check');

        Submission::factory()->create(['drive_link' => null, 'file_path' => null]);
    }

    public function test_submission_with_only_drive_link_or_only_file_is_accepted(): void
    {
        Submission::factory()->create();
        Submission::factory()->withFile()->create();

        $this->assertDatabaseCount('submissions', 2);
    }
}
