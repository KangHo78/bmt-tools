<?php

namespace App\Http\Controllers;

use App\Models\Loan;
use App\Models\ToolType;
use App\Models\ToolUnit;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function search(Request $request)
    {
        $term = trim((string) $request->query('q'));
        if (mb_strlen($term) < 2) {
            return response()->json([]);
        }
        $like = "%{$term}%";

        return response()->json([
            ...ToolType::where('name', 'like', $like)->orWhere('code', 'like', $like)->limit(5)->get()->map(fn ($x) => ['type' => 'Jenis alat', 'label' => $x->name, 'meta' => $x->code, 'href' => "/katalog/{$x->id}"]),
            ...ToolUnit::where('asset_code', 'like', $like)->limit(5)->get()->map(fn ($x) => ['type' => 'Unit aset', 'label' => $x->asset_code, 'meta' => $x->status, 'href' => "/inventaris?unit={$x->id}"]),
            ...Loan::where('trx_no', 'like', $like)->limit(5)->get()->map(fn ($x) => ['type' => 'Peminjaman', 'label' => $x->trx_no, 'meta' => $x->status, 'href' => "/peminjaman/{$x->id}"]),
        ]);
    }

    public function scan(Request $request)
    {
        $code = trim((string) $request->query('code'));
        if ($unit = ToolUnit::where('asset_code', $code)->first()) {
            return response()->json(['href' => "/katalog/{$unit->tool_type_id}", 'type' => 'unit']);
        }
        if ($loan = Loan::where('trx_no', $code)->first()) {
            return response()->json(['href' => "/peminjaman/{$loan->id}", 'type' => 'loan']);
        }

        return response()->json(['message' => 'Kode tidak ditemukan.'], 404);
    }

    public function openCode(string $code)
    {
        if ($unit = ToolUnit::where('asset_code', $code)->first()) {
            return to_route('catalog.show', $unit->tool_type_id);
        }
        if ($loan = Loan::where('trx_no', $code)->first()) {
            return to_route('loans.show', $loan);
        }
        abort(404, 'Kode tidak ditemukan.');
    }
}
