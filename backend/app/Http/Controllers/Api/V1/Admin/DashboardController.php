<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\AssignmentStatus;
use App\Enums\DivisionType;
use App\Enums\GradeStatus;
use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Resources\AnnouncementResource;
use App\Models\Announcement;
use App\Models\Division;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $perRole = User::toBase()->selectRaw('role, count(*) as total')->groupBy('role')->pluck('total', 'role');

        $divisions = Division::where('type', DivisionType::Research)
            ->withCount([
                'researchMembers as asisten_aktif' => fn ($q) => $q->where('role', Role::AsistenAktif),
                'researchMembers as asisten_magang' => fn ($q) => $q->where('role', Role::AsistenMagang),
                'assignments as assignments_published' => fn ($q) => $q->where('status', AssignmentStatus::Published),
                // Submissions still waiting for a published grade (none yet, or only a draft).
                'submissions as pending_grading' => fn ($q) => $q->whereNotExists(fn ($g) => $g->from('grades')
                    ->whereColumn('grades.assignment_id', 'submissions.assignment_id')
                    ->whereColumn('grades.user_id', 'submissions.user_id')
                    ->where('grades.status', GradeStatus::Published->value)),
            ])
            ->orderBy('sort_order')
            ->get();

        return response()->json(['data' => [
            'users' => [
                ...collect(Role::cases())->mapWithKeys(fn (Role $role) => [$role->value => (int) ($perRole[$role->value] ?? 0)]),
                'inactive' => User::where('is_active', false)->count(),
            ],
            'pending_grading' => (int) $divisions->sum('pending_grading'),
            'divisions' => $divisions->map(fn (Division $division) => [
                'division' => $division->only(['id', 'slug', 'name']),
                'asisten_aktif' => $division->asisten_aktif,
                'asisten_magang' => $division->asisten_magang,
                'assignments_published' => $division->assignments_published,
                'pending_grading' => $division->pending_grading,
            ]),
            // Same shape as GET /announcements so the frontend can reuse its card.
            'recent_announcements' => AnnouncementResource::collection(
                Announcement::withViewerState($request->user())->latest()->latest('id')->limit(3)->get()
            ),
        ]]);
    }
}
