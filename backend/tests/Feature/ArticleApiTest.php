<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class ArticleApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_only_journalists_and_admins_can_create_articles(): void
    {
        $reader = $this->userWithToken(User::ROLE_USER);
        $journalist = $this->userWithToken(User::ROLE_JOURNALIST);

        $payload = $this->articlePayload([
            'title' => 'Testowy tekst redakcyjny',
            'tags' => ['media', 'cms'],
        ]);

        $this->postJson('/api/articles', $payload, $this->authHeader($reader))
            ->assertForbidden();

        $this->postJson('/api/articles', $payload, $this->authHeader($journalist))
            ->assertCreated()
            ->assertJsonPath('article.title', 'Testowy tekst redakcyjny')
            ->assertJsonPath('article.author.id', $journalist->id);

        $this->assertDatabaseHas('articles', [
            'title' => 'Testowy tekst redakcyjny',
            'user_id' => $journalist->id,
            'status' => 'published',
        ]);
    }

    public function test_journalist_deletes_only_own_articles_and_admin_deletes_any_article(): void
    {
        $owner = $this->userWithToken(User::ROLE_JOURNALIST);
        $otherJournalist = $this->userWithToken(User::ROLE_JOURNALIST);
        $admin = $this->userWithToken(User::ROLE_ADMIN);

        $ownArticle = $this->articleFor($owner, ['title' => 'Moj tekst']);
        $foreignArticle = $this->articleFor($otherJournalist, ['title' => 'Cudzy tekst']);

        $this->deleteJson("/api/articles/{$foreignArticle->id}", [], $this->authHeader($owner))
            ->assertForbidden();

        $this->assertDatabaseHas('articles', ['id' => $foreignArticle->id]);

        $this->deleteJson("/api/articles/{$ownArticle->id}", [], $this->authHeader($owner))
            ->assertOk();

        $this->assertDatabaseMissing('articles', ['id' => $ownArticle->id]);

        $this->deleteJson("/api/articles/{$foreignArticle->id}", [], $this->authHeader($admin))
            ->assertOk();

        $this->assertDatabaseMissing('articles', ['id' => $foreignArticle->id]);
    }

    public function test_public_index_hides_drafts_and_filters_by_search_and_tag(): void
    {
        $author = $this->userWithToken(User::ROLE_ADMIN);
        $published = $this->articleFor($author, [
            'title' => 'Raport o mediach lokalnych',
            'body' => 'Analiza rynku mediow i subskrypcji.',
            'tags' => ['media', 'raport'],
            'status' => 'published',
        ]);
        $draft = $this->articleFor($author, [
            'title' => 'Raport roboczy',
            'tags' => ['media'],
            'status' => 'draft',
        ]);
        $unrelated = $this->articleFor($author, [
            'title' => 'Wiadomosci sportowe',
            'tags' => ['sport'],
            'status' => 'published',
        ]);

        $response = $this->getJson('/api/articles?q=raport&tag=media')
            ->assertOk();

        $ids = collect($response->json('articles'))->pluck('id');

        $this->assertTrue($ids->contains($published->id));
        $this->assertFalse($ids->contains($draft->id));
        $this->assertFalse($ids->contains($unrelated->id));
    }

    public function test_favorites_are_saved_per_authenticated_user(): void
    {
        $author = $this->userWithToken(User::ROLE_ADMIN);
        $reader = $this->userWithToken(User::ROLE_USER);
        $otherReader = $this->userWithToken(User::ROLE_USER);
        $article = $this->articleFor($author);

        $this->postJson("/api/articles/{$article->id}/favorite", [], $this->authHeader($reader))
            ->assertOk()
            ->assertJsonPath('article.is_favorited', true);

        $this->getJson('/api/favorites', $this->authHeader($reader))
            ->assertOk()
            ->assertJsonCount(1, 'articles')
            ->assertJsonPath('articles.0.id', $article->id);

        $this->getJson('/api/favorites', $this->authHeader($otherReader))
            ->assertOk()
            ->assertJsonCount(0, 'articles');
    }

    private function userWithToken(string $role): User
    {
        return User::factory()->create([
            'role' => $role,
            'api_token' => Str::random(40),
        ]);
    }

    /**
     * @param array<string, mixed> $overrides
     */
    private function articleFor(User $author, array $overrides = []): Article
    {
        $title = (string) ($overrides['title'] ?? 'Artykul testowy ' . Str::random(6));

        return Article::create(array_merge([
            'user_id' => $author->id,
            'title' => $title,
            'slug' => Str::slug($title) . '-' . Str::random(6),
            'section' => 'Media',
            'excerpt' => 'Lead testowy',
            'body' => 'Tresc testowa',
            'tags' => ['media'],
            'status' => 'published',
        ], $overrides));
    }

    /**
     * @param array<string, mixed> $overrides
     * @return array<string, mixed>
     */
    private function articlePayload(array $overrides = []): array
    {
        return array_merge([
            'title' => 'Artykul z API',
            'section' => 'Media',
            'excerpt' => 'Lead z testu',
            'body' => 'Tresc z testu',
            'tags' => ['media'],
            'status' => 'published',
        ], $overrides);
    }

    /**
     * @return array<string, string>
     */
    private function authHeader(User $user): array
    {
        return ['Authorization' => "Bearer {$user->api_token}"];
    }
}

