<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/** Authentification par jetons Sanctum (Bearer). */
class AuthController extends Controller
{
    /** Rôles qu'un visiteur peut choisir à l'inscription (le rôle « admin » n'est jamais accessible ici). */
    protected function publicRoles(): array
    {
        return config('app.public_roles', ['user']);
    }

    public function register(Request $request): JsonResponse
    {
        $roles = $this->publicRoles();
        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:80'],
            'email' => ['required', 'email:rfc', 'max:120', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'max:100'],
            'role' => ['sometimes', 'string', Rule::in($roles)],
        ]);
        $user = User::create([
            'name' => $data['name'],
            'email' => strtolower($data['email']),
            'password' => $data['password'],
            'role' => $data['role'] ?? $roles[0],
        ]);

        return $this->issue($user, 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email'], 'password' => ['required', 'string']]);
        $user = User::where('email', strtolower($data['email']))->first();
        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages(['email' => ['E-mail ou mot de passe incorrect.']]);
        }

        return $this->issue($user);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $request->user()]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Déconnecté.']);
    }

    protected function issue(User $user, int $status = 200): JsonResponse
    {
        return response()->json(['user' => $user, 'token' => $user->createToken('spa')->plainTextToken], $status);
    }
}
