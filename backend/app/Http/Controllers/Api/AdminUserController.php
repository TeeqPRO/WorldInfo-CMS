<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminUserController extends Controller
{
    public function index()
    {
        return response()->json([
            'users' => User::query()
                ->orderBy('name')
                ->get(['id', 'name', 'email', 'role', 'avatar_url']),
        ]);
    }

    public function updateRole(Request $request, User $user)
    {
        if ($user->role === User::ROLE_ADMIN) {
            return response()->json(['message' => 'Roli glownego admina nie mozna edytowac ani usunac.'], 403);
        }

        if ($request->input('role') === User::ROLE_ADMIN) {
            return response()->json(['message' => 'Roli admina nie mozna nadac z panelu. Na stronie istnieje tylko jeden glowny admin.'], 403);
        }

        $data = $request->validate([
            'role' => ['required', Rule::in([User::ROLE_USER, User::ROLE_JOURNALIST])],
        ]);

        $user->role = $data['role'];
        $user->save();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'avatar_url' => $user->avatar_url,
            ],
        ]);
    }
}
