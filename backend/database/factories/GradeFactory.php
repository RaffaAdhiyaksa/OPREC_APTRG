<?php

namespace Database\Factories;

use App\Enums\GradeStatus;
use App\Models\Assignment;
use App\Models\Grade;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Grade>
 */
class GradeFactory extends Factory
{
    public function definition(): array
    {
        return [
            'assignment_id' => Assignment::factory()->published(),
            'user_id' => User::factory()->magang(),
            'graded_by' => User::factory()->aktif(),
            'score' => fake()->randomFloat(2, 0, 100),
            'feedback' => fake()->sentence(),
        ];
    }

    public function published(): static
    {
        return $this->state(['status' => GradeStatus::Published, 'published_at' => now()]);
    }
}
