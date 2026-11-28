<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateActiveStatusRequest;
use App\Http\Resources\DivisionResource;
use App\Models\Division;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class DivisionController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $isAdmin = $request->user()->isAdmin();

        $divisions = Division::query()
            ->unless($isAdmin, fn ($q) => $q->where('is_active', true))
            ->when($isAdmin, fn ($q) => $q->withCount(['researchMembers', 'competitionMembers']))
            ->orderBy('sort_order')
            ->get();

        return DivisionResource::collection($divisions);
    }

    public function update(UpdateActiveStatusRequest $request, Division $division): JsonResponse|DivisionResource
    {
        if (! $division->is_optional) {
            return response()->json([
                'message' => 'Hanya divisi opsional yang bisa diaktifkan/nonaktifkan.',
                'code' => 'DIVISION_NOT_OPTIONAL',
                'errors' => ['is_active' => ['Hanya divisi opsional yang bisa diaktifkan/nonaktifkan.']],
            ], 422);
        }

        $division->update(['is_active' => $request->boolean('is_active')]);

        return new DivisionResource($division->loadCount(['researchMembers', 'competitionMembers']));
    }
}
