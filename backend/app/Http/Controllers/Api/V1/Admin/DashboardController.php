<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\DivisionType;
use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\Division;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $perRole = User::toBase()->selectRaw('role, count(*) as total')->groupBy('role')->pluck('total', 'role');

        $divisions = Division::where('type', DivisionType::Research)
            ->withCount([
                'researchMembers as asisten_aktif' => fn ($q) => $q->where('role', Role::AsistenAktif),
                'researchMembers as asisten_magang' => fn ($q) => $q->where('role', Role::AsistenMagang),
            ])
            ->orderBy('sort_order')
            ->get();

        return response()->json(['data' => [
            'users' => [
                ...collect(Role::cases())->mapWithKeys(fn (Role $role) => [$role->value => (int) ($perRole[$role->value] ?? 0)]),
                'inactive' => User::where('is_active', false)->count(),
            ],
            'divisions' => $divisions->map(fn (Division $division) => [
                'division' => $division->only(['id', 'slug', 'name']),
                'asisten_aktif' => $division->asisten_aktif,
                'asisten_magang' => $division->asisten_magang,
            ]),
        ]]);
    }
}
