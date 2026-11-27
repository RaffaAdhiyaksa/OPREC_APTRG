<?php

namespace Database\Factories;

use App\Enums\MaterialSourceType;
use App\Models\Division;
use App\Models\Material;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Material>
 */
class MaterialFactory extends Factory
{
    public function definition(): array
    {
        return [
            'division_id' => Division::factory(),
            'created_by' => User::factory()->aktif(),
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'source_type' => MaterialSourceType::Youtube,
            'url' => 'https://www.youtube.com/watch?v='.fake()->regexify('[A-Za-z0-9]{11}'),
            'sort_order' => fake()->numberBetween(1, 50),
        ];
    }

    public function unpublished(): static
    {
        return $this->state(['is_published' => false]);
    }
}
