<?php

namespace Database\Factories;

use App\Models\Announcement;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Announcement>
 */
class AnnouncementFactory extends Factory
{
    public function definition(): array
    {
        return [
            'author_id' => User::factory()->admin(),
            'title' => fake()->sentence(5),
            'body' => fake()->paragraph(),
        ];
    }
}
