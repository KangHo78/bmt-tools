<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Location;
use App\Models\SsoItem;
use App\Models\ToolType;
use App\Models\ToolUnit;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;

class CatalogController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->only([
            'q', 'category', 'item_no', 'item_name', 'item_unit', 'original_manufacture',
            'manufacture_pn', 'article_no', 'specification', 'primary_location', 'availability',
        ]);
        $tools = ToolType::query()->with(['category:id,name', 'primaryLocation:id,name'])
            ->withCount(['units', 'units as available_count' => fn ($q) => $q->where('status', 'tersedia')])
            ->when($request->string('q')->isNotEmpty(), fn ($q) => $q->where(fn ($sub) => $sub->where('name', 'like', '%'.$request->q.'%')->orWhere('code', 'like', '%'.$request->q.'%')))
            ->when($request->category, fn ($q, $category) => $q->where('category_id', $category))
            ->when($request->string('item_no')->isNotEmpty(), fn ($q) => $q->where('code', 'like', '%'.$request->item_no.'%'))
            ->when($request->string('item_name')->isNotEmpty(), fn ($q) => $q->where('name', 'like', '%'.$request->item_name.'%'))
            ->when($request->string('item_unit')->isNotEmpty(), fn ($q) => $q->where('unit', 'like', '%'.$request->item_unit.'%'))
            ->when($request->string('original_manufacture')->isNotEmpty(), fn ($q) => $q->where('original_manufacture', 'like', '%'.$request->original_manufacture.'%'))
            ->when($request->string('manufacture_pn')->isNotEmpty(), fn ($q) => $q->where('manufacture_pn', 'like', '%'.$request->manufacture_pn.'%'))
            ->when($request->string('article_no')->isNotEmpty(), fn ($q) => $q->where('article_no', 'like', '%'.$request->article_no.'%'))
            ->when($request->string('specification')->isNotEmpty(), fn ($q) => $q->where('description', 'like', '%'.$request->specification.'%'))
            ->when($request->integer('primary_location'), fn ($q, $location) => $q->where('primary_location_id', $location))
            ->when($request->availability === 'available', fn ($q) => $q->whereHas('units', fn ($unit) => $unit->where('status', 'tersedia')))
            ->when($request->availability === 'unavailable', fn ($q) => $q->whereDoesntHave('units', fn ($unit) => $unit->where('status', 'tersedia')))
            ->orderBy('name')->paginate(12)->withQueryString();
        $this->applyBuanaMultiImages($tools->getCollection());
        $this->applyCatalogProvenance($tools->getCollection());

        return Inertia::render('Catalog/Index', [
            'tools' => $tools,
            'categories' => Category::orderBy('name')->get(['id', 'name']),
            'locations' => Location::orderBy('name')->get(['id', 'name']),
            'filters' => $filters,
        ]);
    }

    public function show(ToolType $toolType)
    {
        $toolType->load(['category', 'primaryLocation', 'units.location']);
        $this->applyBuanaMultiImages(collect([$toolType]));
        $this->applyCatalogProvenance(collect([$toolType]));

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

    /** @param Collection<int, ToolType> $toolTypes */
    private function applyCatalogProvenance(Collection $toolTypes): void
    {
        $toolTypeIds = $toolTypes->pluck('id');
        if ($toolTypeIds->isEmpty()) {
            return;
        }

        $unitsByType = ToolUnit::query()
            ->whereIn('tool_type_id', $toolTypeIds)
            ->get(['tool_type_id', 'owner', 'source_po_id', 'source_reference'])
            ->groupBy('tool_type_id');

        $toolTypes->each(function (ToolType $toolType) use ($unitsByType): void {
            $units = $unitsByType->get($toolType->id, collect());
            $toolType->setAttribute('owners', $units->pluck('owner')->filter()->unique()->values());
            $toolType->setAttribute('po_numbers', $units
                ->whereNotNull('source_po_id')
                ->pluck('source_reference')
                ->filter()
                ->unique()
                ->values());
        });
    }
}
