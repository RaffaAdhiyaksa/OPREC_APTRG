<?php

namespace Database\Factories;

use App\Enums\AssignmentStatus;
use App\Models\Assignment;
use App\Models\Division;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Assignment>
 */
class AssignmentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'division_id' => Division::factory(),
            'created_by' => User::factory()->aktif(),
            'title' => fake()->sentence(4),
            'description' => fake()->paragraphs(2, true),
            'due_at' => now()->addWeek(),
        ];
    }

    public function published(): static
    {
        return $this->state(['status' => AssignmentStatus::Published, 'published_at' => now()]);
    }
}
