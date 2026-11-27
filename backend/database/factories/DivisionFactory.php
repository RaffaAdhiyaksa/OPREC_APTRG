<?php

namespace Database\Factories;

use App\Enums\DivisionType;
use App\Models\Division;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Division>
 */
class DivisionFactory extends Factory
{
    public function definition(): array
    {
        $name = fake()->unique()->words(2, true);

        return [
            'slug' => str($name)->slug()->toString(),
            'name' => ucwords($name),
            'type' => DivisionType::Research,
            'sort_order' => fake()->numberBetween(1, 100),
        ];
    }

    public function competition(): static
    {
        return $this->state(['type' => DivisionType::Competition, 'team_name' => fake()->word().' Team']);
    }
}
