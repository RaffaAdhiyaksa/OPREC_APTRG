<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMaterialRequest;
use App\Http\Resources\MaterialResource;
use App\Models\Material;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class MaterialController extends Controller
{
    private const RELATIONS = ['division', 'creator'];

    public function index(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();

        $materials = Material::visibleTo($user)
            ->with(self::RELATIONS)
            ->when($user->isAdmin() && $request->filled('division_id'), fn ($q) => $q->where('division_id', $request->integer('division_id')))
            ->when($request->filled('source_type'), fn ($q) => $q->where('source_type', $request->source_type))
            ->when($request->filled('search'), fn ($q) => $q->where(fn ($q) => $q
                ->where('title', 'like', '%'.$request->search.'%')
                ->orWhere('description', 'like', '%'.$request->search.'%')))
            ->orderBy('division_id')->orderBy('sort_order')->orderBy('id')
            ->paginate($this->perPage($request))
            ->withQueryString();

        return MaterialResource::collection($materials);
    }

    public function show(Material $material): MaterialResource
    {
        Gate::authorize('view', $material);

        return new MaterialResource($material->load(self::RELATIONS));
    }

    public function store(StoreMaterialRequest $request): JsonResponse
    {
        $divisionId = $request->validated('division_id') ?? $request->user()->research_division_id;

        $material = Material::create([
            ...$request->safe()->except('division_id'),
            'division_id' => $divisionId,
            'created_by' => $request->user()->id,
            'sort_order' => (int) Material::where('division_id', $divisionId)->max('sort_order') + 1,
        ]);

        return (new MaterialResource($material->load(self::RELATIONS)))->response()->setStatusCode(201);
    }

    public function update(StoreMaterialRequest $request, Material $material): MaterialResource
    {
        $material->update($request->validated());

        return new MaterialResource($material->load(self::RELATIONS));
    }

    public function destroy(Material $material): JsonResponse
    {
        Gate::authorize('update', $material);
        $material->delete();

        return response()->json(['message' => 'Materi berhasil dihapus.']);
    }

    public function reorder(Request $request): JsonResponse
    {
        Gate::authorize('create', Material::class);
        $ids = $request->validate([
            'order' => ['required', 'array', 'min:1'],
            'order.*' => ['integer', 'distinct'],
        ])['order'];

        $materials = Material::visibleTo($request->user())->whereKey($ids)->get();
        abort_if($materials->count() !== count($ids), 404);
        if ($materials->pluck('division_id')->unique()->count() > 1) {
            return response()->json([
                'message' => 'Semua materi harus dari divisi yang sama.',
                'code' => 'VALIDATION_ERROR',
                'errors' => ['order' => ['Semua materi harus dari divisi yang sama.']],
            ], 422);
        }

        DB::transaction(function () use ($materials, $ids) {
            foreach ($ids as $index => $id) {
                $materials->find($id)->update(['sort_order' => $index + 1]);
            }
        });

        return response()->json(['message' => 'Urutan materi disimpan.']);
    }
}
