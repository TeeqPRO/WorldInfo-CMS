<?php

namespace Database\Seeders;

use App\Models\Article;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $admin = User::updateOrCreate(
            ['email' => 'admin@test.pl'],
            [
                'name' => 'Admin',
                'password' => Hash::make('admin123!'),
                'role' => User::ROLE_ADMIN,
            ]
        );

        User::where('role', User::ROLE_ADMIN)
            ->whereKeyNot($admin->id)
            ->update(['role' => User::ROLE_USER]);

        Article::firstOrCreate(
            ['slug' => 'rzad-zapowiada-nowa-strategia-medialna'],
            [
                'user_id' => $admin->id,
                'title' => 'Rzad zapowiada nowa strategia medialna',
                'section' => 'Polityka',
                'excerpt' => 'Rynek reklamy i redakcje cyfrowe przygotowuja sie na nowy etap finansowania tresci.',
                'body' => "## Nowa strategia\n\nRzad zapowiada pakiet zmian dla rynku medialnego. Redakcje wskazuja na potrzebe przejrzystych zasad oraz wsparcia lokalnych wydawcow.\n\n- wiecej transparentnosci\n- nowe modele subskrypcji\n- lepsza dystrybucja tresci",
                'image_url' => 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1600&q=80',
                'tags' => ['polityka', 'media', 'subskrypcje'],
                'status' => 'published',
            ]
        );

        Article::firstOrCreate(
            ['slug' => 'firmy-medialne-stawiaja-na-subskrypcje'],
            [
                'user_id' => $admin->id,
                'title' => 'Firmy medialne stawiaja na subskrypcje',
                'section' => 'Media',
                'excerpt' => 'Eksperci prognozuja dalszy wzrost modeli premium i wiekszy nacisk na lojalnosc czytelnikow.',
                'body' => "## Subskrypcje rosna\n\nWydawcy testuja pakiety premium, newslettery i zamkniete sekcje eksperckie. Najlepiej radza sobie redakcje, ktore lacza jakosc z szybka dystrybucja.",
                'image_url' => 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80',
                'tags' => ['media', 'biznes'],
                'status' => 'published',
            ]
        );
    }
}
