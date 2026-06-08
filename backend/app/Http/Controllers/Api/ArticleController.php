<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ArticleController extends Controller
{
    public function index(Request $request)
    {
        $viewer = $this->viewer($request);
        $query = Article::query()
            ->with('author')
            ->where('status', 'published')
            ->latest();

        if ($search = trim((string) $request->query('q', ''))) {
            $query->where(function ($inner) use ($search) {
                $inner->where('title', 'like', "%{$search}%")
                    ->orWhere('excerpt', 'like', "%{$search}%")
                    ->orWhere('body', 'like', "%{$search}%")
                    ->orWhere('section', 'like', "%{$search}%");
            });
        }

        if ($tag = trim((string) $request->query('tag', ''))) {
            $query->whereJsonContains('tags', $tag);
        }

        return response()->json([
            'articles' => $query->limit(60)->get()->map(fn (Article $article) => $this->serialize($article, $viewer)),
        ]);
    }

    public function manage(Request $request)
    {
        $user = $request->user();
        if (!$this->canManageArticles($user)) {
            return response()->json(['message' => 'Brak uprawnien do zarzadzania artykulami.'], 403);
        }

        $query = Article::query()
            ->with('author')
            ->latest();

        if ($user->role !== User::ROLE_ADMIN) {
            $query->where('user_id', $user->id);
        }

        return response()->json([
            'articles' => $query->get()->map(fn (Article $article) => $this->serialize($article, $user)),
        ]);
    }

    public function favorites(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'articles' => $user->favoriteArticles()
                ->with('author')
                ->latest('article_favorites.created_at')
                ->get()
                ->map(fn (Article $article) => $this->serialize($article, $user)),
        ]);
    }

    public function show(Request $request, Article $article)
    {
        $viewer = $this->viewer($request);
        if ($article->status !== 'published' && (!$viewer || !$this->canEditArticle($viewer, $article))) {
            return response()->json(['message' => 'Artykul nie jest publiczny.'], 404);
        }

        return response()->json([
            'article' => $this->serialize($article->load('author'), $viewer),
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if (!$this->canManageArticles($user)) {
            return response()->json(['message' => 'Tylko dziennikarz lub admin moze dodawac artykuly.'], 403);
        }

        $data = $this->validatedArticleData($request);

        $article = new Article($data);
        $article->user_id = $user->id;
        $article->slug = $this->uniqueSlug($data['title']);

        if ($request->hasFile('image')) {
            $article->image_url = $this->storeImage($request);
        }

        $article->save();

        return response()->json([
            'article' => $this->serialize($article->load('author'), $user),
        ], 201);
    }

    public function update(Request $request, Article $article)
    {
        $user = $request->user();
        if (!$this->canEditArticle($user, $article)) {
            return response()->json(['message' => 'Mozesz edytowac tylko swoje artykuly, chyba ze jestes adminem.'], 403);
        }

        $data = $this->validatedArticleData($request);
        if ($article->title !== $data['title']) {
            $article->slug = $this->uniqueSlug($data['title'], $article->id);
        }

        $article->fill($data);

        if ($request->hasFile('image')) {
            $this->deleteStoredImage($article);
            $article->image_url = $this->storeImage($request);
        }

        $article->save();

        return response()->json([
            'article' => $this->serialize($article->load('author'), $user),
        ]);
    }

    public function destroy(Request $request, Article $article)
    {
        $user = $request->user();
        if (!$this->canDeleteArticle($user, $article)) {
            return response()->json(['message' => 'Dziennikarz moze usuwac tylko swoje artykuly. Admin moze usuwac wszystkie.'], 403);
        }

        $this->deleteStoredImage($article);
        $article->delete();

        return response()->json(['message' => 'Artykul usuniety.']);
    }

    public function favorite(Request $request, Article $article)
    {
        $request->user()->favoriteArticles()->syncWithoutDetaching([$article->id]);

        return response()->json([
            'article' => $this->serialize($article->load('author'), $request->user()),
        ]);
    }

    public function unfavorite(Request $request, Article $article)
    {
        $request->user()->favoriteArticles()->detach($article->id);

        return response()->json([
            'article' => $this->serialize($article->load('author'), $request->user()),
        ]);
    }

    private function validatedArticleData(Request $request): array
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'section' => ['required', 'string', 'max:80'],
            'excerpt' => ['nullable', 'string', 'max:800'],
            'body' => ['required', 'string'],
            'tags' => ['nullable'],
            'status' => ['nullable', Rule::in(['draft', 'published'])],
            'image' => ['nullable', 'image', 'max:4096'],
        ]);

        $data['tags'] = $this->normalizeTags($request->input('tags'));
        $data['status'] = $data['status'] ?? 'published';

        return $data;
    }

    private function normalizeTags(mixed $tags): array
    {
        if (is_string($tags)) {
            $decoded = json_decode($tags, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $tags = $decoded;
            } else {
                $tags = explode(',', $tags);
            }
        }

        if (!is_array($tags)) {
            return [];
        }

        return collect($tags)
            ->map(fn ($tag) => trim((string) $tag))
            ->filter()
            ->map(fn ($tag) => Str::lower($tag))
            ->unique()
            ->take(12)
            ->values()
            ->all();
    }

    private function storeImage(Request $request): string
    {
        $path = $request->file('image')->store('articles', 'public');

        return $request->getSchemeAndHttpHost() . Storage::url($path);
    }

    private function deleteStoredImage(Article $article): void
    {
        if (!$article->image_url) {
            return;
        }

        $path = parse_url($article->image_url, PHP_URL_PATH);
        if (!is_string($path) || !str_starts_with($path, '/storage/articles/')) {
            return;
        }

        Storage::disk('public')->delete(Str::after($path, '/storage/'));
    }

    private function uniqueSlug(string $title, ?int $ignoreId = null): string
    {
        $base = Str::slug($title) ?: 'artykul';
        $slug = $base;
        $counter = 2;

        while (Article::query()
            ->where('slug', $slug)
            ->when($ignoreId, fn ($query) => $query->whereKeyNot($ignoreId))
            ->exists()) {
            $slug = "{$base}-{$counter}";
            $counter++;
        }

        return $slug;
    }

    private function viewer(Request $request): ?User
    {
        $header = $request->header('Authorization');
        if (!$header || !str_starts_with($header, 'Bearer ')) {
            return null;
        }

        return User::where('api_token', substr($header, 7))->first();
    }

    private function canManageArticles(?User $user): bool
    {
        return in_array($user?->role, [User::ROLE_JOURNALIST, User::ROLE_ADMIN], true);
    }

    private function canEditArticle(User $user, Article $article): bool
    {
        return $user->role === User::ROLE_ADMIN || $article->user_id === $user->id;
    }

    private function canDeleteArticle(User $user, Article $article): bool
    {
        return $user->role === User::ROLE_ADMIN || $article->user_id === $user->id;
    }

    private function serialize(Article $article, ?User $viewer = null): array
    {
        return [
            'id' => $article->id,
            'title' => $article->title,
            'slug' => $article->slug,
            'section' => $article->section,
            'excerpt' => $article->excerpt,
            'body' => $article->body,
            'image_url' => $article->image_url,
            'tags' => $article->tags ?? [],
            'status' => $article->status,
            'created_at' => $article->created_at?->toISOString(),
            'updated_at' => $article->updated_at?->toISOString(),
            'author' => [
                'id' => $article->author?->id,
                'name' => $article->author?->name,
                'role' => $article->author?->role,
            ],
            'can_edit' => $viewer ? $this->canEditArticle($viewer, $article) : false,
            'can_delete' => $viewer ? $this->canDeleteArticle($viewer, $article) : false,
            'is_favorited' => $viewer
                ? $viewer->favoriteArticles()->whereKey($article->id)->exists()
                : false,
        ];
    }
}
