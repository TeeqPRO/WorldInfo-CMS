# WorldInfo CMS

WorldInfo CMS to pelna aplikacja redakcyjna z publicznym serwisem informacyjnym, panelem konta, rolami uzytkownikow i mechanika zarzadzania artykulami. Projekt sklada sie z frontendu Angular oraz backendu Laravel API.

## Funkcje

- Publiczna strona glowna z wyszukiwarka, tagami, leadowym artykulem i lista publikacji.
- Szczegoly artykulu z renderowaniem prostego formatowania: naglowki, pogrubienie, kursywa, cytaty, listy, linki i nowe linie.
- Rejestracja, logowanie, wylogowanie i odtwarzanie sesji przez token API.
- Profil uzytkownika z uploadem avatara na serwer.
- Ulubione artykuly przypisane do konta.
- Panel CMS dla dziennikarzy i admina.
- Dodawanie, edycja i usuwanie artykulow z obrazkiem, tagami, statusem i podgladem.
- Uprawnienia:
  - `user` moze czytac i zapisywac ulubione.
  - `journalist` moze dodawac artykuly oraz edytowac i usuwac swoje.
  - `admin` moze zarzadzac wszystkimi artykulami i rolami redakcyjnymi.
- Zabezpieczenie glownego admina: roli `admin` nie da sie nadac ani odebrac z panelu.

## Stack

- Frontend: Angular 21, TypeScript, Angular Router, Forms, GSAP.
- Backend: Laravel 12, PHP 8.2+, Eloquent, REST API.
- Baza danych: MySQL wedlug aktualnego `.env`; mozna tez uzyc SQLite po zmianie konfiguracji.
- Uploady: Laravel public storage przez `storage:link`.

## Struktura projektu

```text
cmstest/
  backend/                 Laravel API
    app/Http/Controllers/  Kontrolery auth, profilu, artykulow i admina
    app/Models/            Modele User i Article
    database/migrations/   Tabele uzytkownikow, artykulow i ulubionych
    database/seeders/      Seeder glownego admina i startowych artykulow
    routes/api.php         Endpointy REST API
  frontend/                Angular SPA
    src/app/pages/         Widoki aplikacji
    src/app/services/      AuthService i ArticleService
    src/app/utils/         Renderer formatowania artykulow
    src/styles.scss        Globalny system wizualny
```

## Wymagania

- Node.js i npm.
- PHP 8.2 lub nowszy.
- Composer.
- MySQL/MariaDB albo SQLite.
- Angular CLI, opcjonalnie globalnie: `npm install -g @angular/cli`.

## Instalacja od zera

1. Zainstaluj zaleznosci backendu:

```bash
cd backend
composer install
```

2. Przygotuj plik srodowiskowy:

```bash
cp .env.example .env
php artisan key:generate
```

3. Skonfiguruj baze danych w `backend/.env`.

Dla MySQL:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cmsblog
DB_USERNAME=root
DB_PASSWORD=
```

Dla SQLite:

```env
DB_CONNECTION=sqlite
DB_DATABASE=/pelna/sciezka/do/backend/database/database.sqlite
```

4. Uruchom migracje, seedery i link do plikow publicznych:

```bash
php artisan migrate --force
php artisan db:seed --force
php artisan storage:link
```

Seeder tworzy glowne konto administratora:

```text
Email: admin@test.pl
Haslo: admin123!
```

5. Zainstaluj frontend:

```bash
cd ../frontend
npm install
```

## Uruchamianie lokalne

Backend:

```bash
cd backend
php artisan serve --host=127.0.0.1 --port=8000
```

Frontend:

```bash
cd frontend
npm start -- --host 127.0.0.1 --port 4200
```

Aplikacja bedzie dostepna pod adresem:

```text
http://127.0.0.1:4200
```

Frontend komunikuje sie z API pod:

```text
http://localhost:8000/api
```

## Najwazniejsze sciezki frontendu

- `/` - strona glowna.
- `/login` - logowanie.
- `/register` - rejestracja.
- `/profile` - ustawienia profilu i avatar.
- `/favorites` - ulubione artykuly.
- `/my-articles` - lista artykulow w CMS.
- `/articles/new` - dodawanie artykulu.
- `/articles/:id/edit` - edycja artykulu.
- `/articles/:id` - czytanie artykulu.
- `/admin` - panel admina.

## Endpointy API

Auth:

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

Profil:

```text
POST /api/profile
PUT  /api/profile
```

Artykuly:

```text
GET    /api/articles
GET    /api/articles/{article}
GET    /api/articles/manage
POST   /api/articles
POST   /api/articles/{article}
DELETE /api/articles/{article}
```

Ulubione:

```text
GET    /api/favorites
POST   /api/articles/{article}/favorite
DELETE /api/articles/{article}/favorite
```

Admin:

```text
GET /api/admin/users
PUT /api/admin/users/{user}/role
```

Endpointy chronione wymagaja naglowka:

```text
Authorization: Bearer <token>
```

## Formatowanie artykulow

Edytor obsluguje lekki format tekstowy:

```text
## Naglowek sekcji
**pogrubienie**
*kursywa*
> cytat
- element listy
[tekst linku](https://example.com)
```

Pojedyncze nowe linie sa zachowywane jako nowe linie w tresci artykulu.

## Zasady CMS

- Tylko `journalist` i `admin` moga tworzyc artykuly.
- Dziennikarz moze edytowac i usuwac tylko wlasne artykuly.
- Admin moze edytowac i usuwac wszystkie artykuly.
- Zwykly uzytkownik nie widzi stron CMS.
- Rola `admin` jest jedna, glowna i zablokowana przed zmiana w panelu.
- Obrazki artykulow i avatary sa wysylane jako pliki na backend, a nie jako URL.

## Przygotowanie produkcyjne

Przed wdrozeniem:

- Ustaw `APP_ENV=production` i `APP_DEBUG=false`.
- Zmien `APP_URL` na adres domeny backendu.
- Ustaw produkcyjna baze danych i bezpieczne dane dostepowe.
- Skonfiguruj prawdziwy storage dla uploadow, jesli aplikacja nie ma trzymac plikow lokalnie.
- Zbuduj frontend:

```bash
cd frontend
npm run build
```

- Zoptymalizuj backend:

```bash
cd backend
php artisan config:cache
php artisan route:cache
```

## Jak aplikacja zostala zbudowana

1. Utworzono backend Laravel jako REST API.
2. Dodano model uzytkownika z rolami, tokenem API i avatarem.
3. Dodano model artykulu z autorem, tagami, statusem, obrazkiem i trescia.
4. Dodano relacje ulubionych artykulow.
5. Zaimplementowano kontrolery auth, profilu, artykulow i panelu admina.
6. Po stronie Angular dodano serwisy `AuthService` i `ArticleService`.
7. Zbudowano widoki publiczne, konto, ulubione, panel CMS, edytor i czytnik artykulu.
8. Dodano renderer prostego formatowania artykulow.
9. Dopracowano finalny system wizualny: typografie, karty, formularze, nawigacje, footer i responsywnosc.

## Przydatne komendy

Frontend:

```bash
npm start
npm run build
npm test
```

Backend:

```bash
php artisan serve
php artisan migrate
php artisan db:seed
php artisan route:list --path=api
php artisan test
```

