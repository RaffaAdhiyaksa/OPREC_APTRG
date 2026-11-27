<?php

namespace Database\Factories;

use App\Models\Assignment;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Submission>
 */
class SubmissionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'assignment_id' => Assignment::factory()->published(),
            'user_id' => User::factory()->magang(),
            'drive_link' => 'https://drive.google.com/file/d/'.fake()->regexify('[A-Za-z0-9]{20}'),
            'submitted_at' => now(),
        ];
    }

    public function withFile(): static
    {
        return $this->state(fn () => [
            'file_path' => 'submissions/'.fake()->uuid().'.pdf',
            'file_name' => 'tugas.pdf',
            'file_size' => fake()->numberBetween(10_000, 5_000_000),
            'mime_type' => 'application/pdf',
            'drive_link' => null,
        ]);
    }
}
