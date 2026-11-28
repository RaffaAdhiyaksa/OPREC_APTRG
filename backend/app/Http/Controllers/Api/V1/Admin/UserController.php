<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\SyncCompetitionDivisionsRequest;
use App\Http\Requests\UpdateActiveStatusRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class UserController extends Controller
{
    private const RELATIONS = ['researchDivision', 'competitionDivisions'];

    public function index(Request $request): AnonymousResourceCollection
    {
        $users = User::with(self::RELATIONS)
            ->when($request->filled('search'), fn ($q) => $q->where(fn ($q) => $q
                ->where('name', 'like', '%'.$request->search.'%')
                ->orWhere('email', 'like', '%'.$request->search.'%')
                ->orWhere('nim', 'like', '%'.$request->search.'%')))
            ->when($request->filled('role'), fn ($q) => $q->where('role', $request->role))
            ->when($request->filled('division_id'), fn ($q) => $q->where('research_division_id', $request->integer('division_id')))
            ->when($request->filled('is_active'), fn ($q) => $q->where('is_active', $request->boolean('is_active')))
            ->when($request->filled('is_coordinator'), fn ($q) => $q->where('is_coordinator', $request->boolean('is_coordinator')))
            ->orderBy('name')
            ->paginate(min(max($request->integer('per_page', 15), 1), 100))
            ->withQueryString();

        return UserResource::collection($users);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $temporaryPassword = $request->password ? null : Str::password(12);

        $user = User::create([
            ...$request->safe()->except('password'),
            'password' => $request->password ?? $temporaryPassword,
            'must_change_password' => true,
        ]);

        return $this->withPassword($user, $temporaryPassword, 'User berhasil dibuat.', 201);
    }

    public function show(User $user): UserResource
    {
        return new UserResource($user->load(self::RELATIONS));
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse|UserResource
    {
        $data = $request->validated();
        $newRole = isset($data['role']) ? Role::from($data['role']) : $user->role;

        if ($newRole !== $user->role && $user->is($request->user())) {
            return $this->reject('Anda tidak bisa mengubah role sendiri.', 'CANNOT_CHANGE_OWN_ROLE', 'role');
        }

        return DB::transaction(function () use ($user, $data, $newRole) {
            if ($newRole !== Role::Admin && $user->isLastActiveAdmin()) {
                return $this->reject('Harus ada minimal satu admin aktif.', 'LAST_ADMIN', 'role');
            }

            $leavesAktif = $user->isAktif() && $newRole !== Role::AsistenAktif;
            $user->update($data);
            if ($leavesAktif) {
                // Competition teams are for asisten_aktif only (PRD §5.3).
                $user->competitionDivisions()->detach();
            }

            return new UserResource($user->load(self::RELATIONS));
        });
    }

    public function updateStatus(UpdateActiveStatusRequest $request, User $user): JsonResponse|UserResource
    {
        if (! $request->boolean('is_active') && $user->is($request->user())) {
            return $this->reject('Anda tidak bisa menonaktifkan akun sendiri.', 'CANNOT_DEACTIVATE_SELF', 'is_active');
        }

        return DB::transaction(function () use ($request, $user) {
            if (! $request->boolean('is_active') && $user->isLastActiveAdmin()) {
                return $this->reject('Harus ada minimal satu admin aktif.', 'LAST_ADMIN', 'is_active');
            }

            $user->update(['is_active' => $request->boolean('is_active')]);
            if (! $user->is_active) {
                $user->tokens()->delete();
            }

            return new UserResource($user->load(self::RELATIONS));
        });
    }

    public function resetPassword(User $user): JsonResponse
    {
        $temporaryPassword = Str::password(12);

        $user->update(['password' => $temporaryPassword, 'must_change_password' => true]);
        $user->tokens()->delete();

        return $this->withPassword($user, $temporaryPassword, 'Password berhasil direset.');
    }

    public function syncCompetitionDivisions(SyncCompetitionDivisionsRequest $request, User $user): JsonResponse|UserResource
    {
        if (! $user->isAktif()) {
            return $this->reject('Hanya Asisten Aktif yang bisa masuk divisi lomba.', 'NOT_ASISTEN_AKTIF', 'members');
        }

        $members = collect($request->validated('members'))->mapWithKeys(fn ($m) => [$m['division_id'] => ['position' => $m['position'] ?? null]]);
        // Memberships in a deactivated (optional) division cannot be sent, but must survive the sync (PRD §5.9).
        $kept = $user->competitionDivisions()->where('divisions.is_active', false)->get()
            ->mapWithKeys(fn ($division) => [$division->id => ['position' => $division->pivot->position]]);

        $user->competitionDivisions()->sync($members->union($kept));

        return new UserResource($user->load(self::RELATIONS));
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($user->is($request->user())) {
            return $this->reject('Anda tidak bisa menghapus akun sendiri.', 'CANNOT_DELETE_SELF', 'user');
        }

        return DB::transaction(function () use ($user) {
            if ($user->isLastActiveAdmin()) {
                return $this->reject('Harus ada minimal satu admin aktif.', 'LAST_ADMIN', 'user');
            }

            $user->tokens()->delete();
            $user->delete();

            return response()->json(['message' => 'User berhasil dihapus.']);
        });
    }

    private function withPassword(User $user, ?string $temporaryPassword, string $message, int $status = 200): JsonResponse
    {
        return response()->json(['data' => [
            'user' => new UserResource($user->load(self::RELATIONS)),
            'temporary_password' => $temporaryPassword,
        ], 'message' => $message], $status);
    }

    private function reject(string $message, string $code, string $field): JsonResponse
    {
        return response()->json(['message' => $message, 'code' => $code, 'errors' => [$field => [$message]]], 422);
    }
}
