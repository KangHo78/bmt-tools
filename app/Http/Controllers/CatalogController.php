<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\SsoItem;
use App\Models\ToolType;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;

class CatalogController extends Controller
{
    public function index(Request $request)
    {
        $tools = ToolType::query()->with(['category:id,name', 'primaryLocation:id,name'])
            ->withCount(['units', 'units as available_count' => fn ($q) => $q->where('status', 'tersedia')])
            ->when($request->string('q')->isNotEmpty(), fn ($q) => $q->where(fn ($sub) => $sub->where('name', 'like', '%'.$request->q.'%')->orWhere('code', 'like', '%'.$request->q.'%')))
            ->when($request->category, fn ($q, $category) => $q->where('category_id', $category))
            ->orderBy('name')->paginate(12)->withQueryString();
        $this->applyBuanaMultiImages($tools->getCollection());

        return Inertia::render('Catalog/Index', ['tools' => $tools, 'categories' => Category::orderBy('name')->get(['id', 'name']), 'filters' => $request->only('q', 'category')]);
    }

    public function show(ToolType $toolType)
    {
        $toolType->load(['category', 'primaryLocation', 'units.location']);
        $this->applyBuanaMultiImages(collect([$toolType]));

        return Inertia::render('Catalog/Show', ['tool' => $toolType]);
    }

    public function labels(Request $request, ToolType $toolType)
    {
        $unitId = $request->integer('unit');
        $units = $toolType->units()
            ->when($unitId, fn ($query) => $query->whereKey($unitId))
            ->orderBy('asset_code')
            ->get();

        abort_if($unitId && $units->isEmpty(), 404);

        return Inertia::render('Inventory/Labels', [
            'batch' => [
                'title' => $unitId
                    ? $units->first()->asset_code
                    : "{$toolType->code} — {$toolType->name}",
                'back_url' => route('catalog.show', $toolType, absolute: false),
                'units' => $units->map(fn ($unit) => [
                    'id' => $unit->id,
                    'asset_code' => $unit->asset_code,
                    'owner' => $unit->owner,
                    'tool_type' => $toolType->only(['id', 'name', 'code']),
                ]),
            ],
        ]);
    }

    /** @param Collection<int, ToolType> $toolTypes */
    private function applyBuanaMultiImages(Collection $toolTypes): void
    {
        $toolTypes
            ->whereNotNull('sso_item_id')
            ->each(fn (ToolType $toolType) => $toolType->setAttribute('image_url', null));

        $sourceIds = $toolTypes->pluck('sso_item_id')->filter()->unique()->values();
        if ($sourceIds->isEmpty()) {
            return;
        }

        try {
            $images = SsoItem::query()
                ->whereIn('id', $sourceIds)
                ->pluck('image', 'id');
        } catch (\Throwable) {
            return;
        }

        $toolTypes->each(function (ToolType $toolType) use ($images): void {
            $sourceImage = trim((string) $images->get($toolType->sso_item_id));
            if ($sourceImage !== '') {
                $toolType->setAttribute('image_url', $sourceImage);
            }
        });
    }
}
