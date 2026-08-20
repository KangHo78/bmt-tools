<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\ToolType;
use Illuminate\Http\Request;
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

        return Inertia::render('Catalog/Index', ['tools' => $tools, 'categories' => Category::orderBy('name')->get(['id', 'name']), 'filters' => $request->only('q', 'category')]);
    }

    public function show(ToolType $toolType)
    {
        $toolType->load(['category', 'primaryLocation', 'units.location']);

        return Inertia::render('Catalog/Show', ['tool' => $toolType]);
    }
}
