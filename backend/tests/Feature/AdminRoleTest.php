<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class AdminRoleTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_role_cannot_be_removed_or_granted_from_panel(): void
    {
        $admin = $this->userWithToken(User::ROLE_ADMIN);
        $reader = $this->userWithToken(User::ROLE_USER);

        $this->putJson("/api/admin/users/{$admin->id}/role", [
            'role' => User::ROLE_USER,
        ], $this->authHeader($admin))
            ->assertForbidden();

        $this->assertSame(User::ROLE_ADMIN, $admin->fresh()->role);

        $this->putJson("/api/admin/users/{$reader->id}/role", [
            'role' => User::ROLE_ADMIN,
        ], $this->authHeader($admin))
            ->assertForbidden();

        $this->assertSame(User::ROLE_USER, $reader->fresh()->role);
    }

    public function test_admin_can_assign_journalist_role_but_regular_user_cannot_manage_roles(): void
    {
        $admin = $this->userWithToken(User::ROLE_ADMIN);
        $reader = $this->userWithToken(User::ROLE_USER);
        $target = $this->userWithToken(User::ROLE_USER);

        $this->putJson("/api/admin/users/{$target->id}/role", [
            'role' => User::ROLE_JOURNALIST,
        ], $this->authHeader($reader))
            ->assertForbidden();

        $this->assertSame(User::ROLE_USER, $target->fresh()->role);

        $this->putJson("/api/admin/users/{$target->id}/role", [
            'role' => User::ROLE_JOURNALIST,
        ], $this->authHeader($admin))
            ->assertOk()
            ->assertJsonPath('user.role', User::ROLE_JOURNALIST);

        $this->assertSame(User::ROLE_JOURNALIST, $target->fresh()->role);
    }

    private function userWithToken(string $role): User
    {
        return User::factory()->create([
            'role' => $role,
            'api_token' => Str::random(40),
        ]);
    }

    /**
     * @return array<string, string>
     */
    private function authHeader(User $user): array
    {
        return ['Authorization' => "Bearer {$user->api_token}"];
    }
}

