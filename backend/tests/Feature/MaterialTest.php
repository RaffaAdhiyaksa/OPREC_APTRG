<?php

namespace Tests\Feature;

use App\Models\Division;
use App\Models\Material;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MaterialTest extends TestCase
{
    use RefreshDatabase;

    private Division $system;

    private Division $mechanic;

    private User $aktif;

    private User $magang;

    protected function setUp(): void
    {
        parent::setUp();

        $this->system = Division::factory()->create(['slug' => 'system']);
        $this->mechanic = Division::factory()->create(['slug' => 'mechanic']);
        $this->aktif = User::factory()->aktif()->create(['research_division_id' => $this->system->id]);
        $this->magang = User::factory()->magang()->create(['research_division_id' => $this->system->id]);
    }

    private function material(array $attributes = []): Material
    {
        return Material::factory()->create(['division_id' => $this->system->id, 'created_by' => $this->aktif->id, ...$attributes]);
    }

    public function test_aktif_crud_in_own_division_with_detected_source_type(): void
    {
        $this->actingAsToken($this->aktif);

        $id = $this->postJson('/api/v1/materials', [
            'title' => 'Pixhawk', 'url' => 'https://drive.google.com/file/d/abc', 'source_type' => 'youtube', 'division_id' => $this->mechanic->id,
        ])->assertCreated()
            ->assertJsonPath('data.source_type', 'drive')
            ->assertJsonPath('data.embed_url', null)
            ->assertJsonPath('data.division.id', $this->system->id)
            ->assertJsonPath('data.author.id', $this->aktif->id)
            ->assertJsonPath('data.is_published', true)
            ->assertJsonPath('data.sort_order', 1)
            ->json('data.id');

        $this->putJson("/api/v1/materials/{$id}", ['url' => 'https://example.com/doc', 'is_published' => false])
            ->assertOk()
            ->assertJsonPath('data.source_type', 'other')
            ->assertJsonPath('data.is_published', false)
            ->assertJsonPath('data.title', 'Pixhawk');
        // PATCH is a partial update too.
        $this->patchJson("/api/v1/materials/{$id}", ['title' => 'Pixhawk 6C'])->assertOk()->assertJsonPath('data.url', 'https://example.com/doc');

        $this->getJson("/api/v1/materials/{$id}")->assertOk();
        $this->deleteJson("/api/v1/materials/{$id}")->assertOk();
        $this->assertDatabaseMissing('materials', ['id' => $id]);
    }

    public function test_youtube_embed_url_for_three_formats(): void
    {
        foreach ([
            'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10',
            'https://youtu.be/dQw4w9WgXcQ',
            'https://youtube.com/shorts/dQw4w9WgXcQ',
        ] as $url) {
            $this->assertSame('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', $this->material(['url' => $url])->embedUrl(), $url);
        }

        $this->actingAsToken($this->magang)
            ->getJson('/api/v1/materials?source_type=youtube')
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0.embed_url', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
    }

    public function test_url_validation(): void
    {
        $this->actingAsToken($this->aktif);

        $this->postJson('/api/v1/materials', ['title' => 'X', 'url' => 'ftp://files.example.com/a'])->assertStatus(422)->assertJsonValidationErrors('url');
        $this->postJson('/api/v1/materials', ['title' => 'X', 'url' => 'javascript:alert(1)'])->assertStatus(422)->assertJsonValidationErrors('url');
        $this->postJson('/api/v1/materials', ['title' => 'X', 'url' => 'https://example.com/'.str_repeat('a', 2050)])->assertStatus(422)->assertJsonValidationErrors('url');
    }

    public function test_magang_sees_only_published_in_own_division_and_cannot_write(): void
    {
        $published = $this->material();
        $draft = $this->material(['is_published' => false]);
        $other = Material::factory()->create(['division_id' => $this->mechanic->id]);

        $this->actingAsToken($this->magang);
        $this->getJson('/api/v1/materials')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $published->id);
        $this->getJson("/api/v1/materials/{$draft->id}")->assertNotFound()->assertJsonPath('code', 'NOT_FOUND');
        $this->getJson("/api/v1/materials/{$other->id}")->assertNotFound();

        $this->postJson('/api/v1/materials', ['title' => 'X', 'url' => 'https://a.test'])->assertForbidden()->assertJsonPath('code', 'FORBIDDEN');
        $this->putJson("/api/v1/materials/{$published->id}", ['title' => 'X'])->assertForbidden();
        $this->deleteJson("/api/v1/materials/{$published->id}")->assertForbidden();
        $this->patchJson('/api/v1/materials/reorder', ['order' => [$published->id]])->assertForbidden();
    }

    public function test_aktif_gets_404_for_other_division(): void
    {
        $other = Material::factory()->create(['division_id' => $this->mechanic->id]);
        $this->actingAsToken($this->aktif);

        $this->getJson('/api/v1/materials')->assertJsonCount(0, 'data');
        $this->getJson("/api/v1/materials/{$other->id}")->assertNotFound();
        $this->putJson("/api/v1/materials/{$other->id}", ['title' => 'X'])->assertNotFound();
        $this->deleteJson("/api/v1/materials/{$other->id}")->assertNotFound();
        $this->assertDatabaseHas('materials', ['id' => $other->id]);
    }

    public function test_admin_sees_all_filters_by_division_and_must_pick_research_division(): void
    {
        $this->material();
        Material::factory()->create(['division_id' => $this->mechanic->id]);
        $competition = Division::factory()->competition()->create();
        $this->actingAsToken(User::factory()->admin()->create());

        $this->getJson('/api/v1/materials')->assertJsonCount(2, 'data')->assertJsonPath('meta.total', 2);
        $this->getJson("/api/v1/materials?division_id={$this->mechanic->id}")->assertJsonCount(1, 'data');

        $this->postJson('/api/v1/materials', ['title' => 'X', 'url' => 'https://a.test'])->assertStatus(422)->assertJsonValidationErrors('division_id');
        $this->postJson('/api/v1/materials', ['title' => 'X', 'url' => 'https://a.test', 'division_id' => $competition->id])->assertStatus(422)->assertJsonValidationErrors('division_id');
        $this->postJson('/api/v1/materials', ['title' => 'X', 'url' => 'https://a.test', 'division_id' => $this->mechanic->id])
            ->assertCreated()->assertJsonPath('data.division.id', $this->mechanic->id);
    }

    public function test_reorder(): void
    {
        [$a, $b, $c] = [$this->material(['sort_order' => 1]), $this->material(['sort_order' => 2]), $this->material(['sort_order' => 3])];
        $other = Material::factory()->create(['division_id' => $this->mechanic->id]);

        $this->actingAsToken($this->aktif)->patchJson('/api/v1/materials/reorder', ['order' => [$c->id, $a->id, $b->id]])->assertOk();
        $this->assertSame([$c->id, $a->id, $b->id], Material::where('division_id', $this->system->id)->orderBy('sort_order')->pluck('id')->all());

        // Another division's id is invisible to asisten_aktif.
        $this->patchJson('/api/v1/materials/reorder', ['order' => [$a->id, $other->id]])->assertNotFound();

        // Admin sees both divisions, but one reorder may only touch one division.
        $this->actingAsToken(User::factory()->admin()->create())
            ->patchJson('/api/v1/materials/reorder', ['order' => [$a->id, $other->id]])
            ->assertStatus(422)->assertJsonValidationErrors('order');
        $this->assertSame(2, $a->fresh()->sort_order);
    }
}
