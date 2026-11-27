<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\UpdatePasswordRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // bcrypt (cost 12) of a random string. Checked when no user matches, so a wrong
    // email/NIM takes as long as a wrong password and response time does not reveal accounts.
    // shortcut: cost is fixed at 12, regenerate this hash if BCRYPT_ROUNDS changes.
    private const DUMMY_HASH = '$2y$12$o5fK4c8ZiI5Xz2tkAfurgeDdTQqbNYB/3qa1RJ8bb9Hixuhm.F4k.';

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->login)->orWhere('nim', $request->login)->first();

        if (! Hash::check($request->password, $user?->password ?? self::DUMMY_HASH) || ! $user) {
            throw ValidationException::withMessages(['login' => 'Email/NIM atau password salah.']);
        }

        // Checked after the password so the response never reveals whether an account exists.
        if (! $user->is_active) {
            return response()->json(['message' => 'Akun Anda dinonaktifkan. Hubungi admin.', 'code' => 'ACCOUNT_INACTIVE'], 403);
        }

        $user->update(['last_login_at' => now()]);

        return response()->json(['data' => [
            'token' => $user->createToken($request->device_name)->plainTextToken,
            'token_type' => 'Bearer',
            'user' => new UserResource($user),
        ]]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Berhasil keluar.']);
    }

    public function me(Request $request): UserResource
    {
        return new UserResource($request->user()->loadCount('unreadNotifications'));
    }

    public function updatePassword(UpdatePasswordRequest $request): JsonResponse
    {
        $user = $request->user();

        $user->update(['password' => $request->password, 'must_change_password' => false]);
        $user->tokens()->whereKeyNot($user->currentAccessToken()->getKey())->delete();

        return response()->json(['message' => 'Password berhasil diganti.']);
    }
}
