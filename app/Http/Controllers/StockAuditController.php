<?php

namespace App\Http\Controllers;

use App\Models\Location;
use App\Models\StockAudit;
use App\Models\ToolUnit;
use App\Support\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class StockAuditController extends Controller
{
    public function index()
    {
        return Inertia::render('Audits/Index', ['audits' => StockAudit::orderByDesc('scheduled_date')->get(), 'locations' => Location::orderBy('name')->get(['id', 'name'])]);
    }

    public function store(Request $request)
    {
        $data = $request->validate(['name' => ['required', 'string'], 'scope' => ['required', 'string'], 'location_id' => ['nullable', 'exists:locations,id'], 'assigned_to' => ['required', 'string'], 'scheduled_date' => ['required', 'date']]);
        $query = ToolUnit::query()->whereNotIn('status', ['dihapuskan']);
        if ($data['location_id'] ?? null) {
            $query->where('location_id', $data['location_id']);
        }
        $units = $query->get();
        $audit = DB::transaction(function () use ($data, $units) {
            $audit = StockAudit::create([...collect($data)->except('location_id')->all(), 'status' => 'draf', 'total_units' => $units->count(), 'checked_units' => 0]);
            foreach ($units as $unit) {
                $audit->items()->create(['unit_id' => $unit->id, 'expected_location_id' => $unit->location_id, 'expected_condition' => $unit->condition]);
            }
            AuditLogger::record('audit.created', $audit, ['units' => $units->count()]);

            return $audit;
        });

        return to_route('audits.show', $audit)->with('success', 'Sesi audit dibuat dari snapshot stok saat ini.');
    }

    public function show(StockAudit $audit)
    {
        $audit->load(['items.unit.toolType', 'items.expectedLocation', 'items.actualLocation']);

        return Inertia::render('Audits/Show', ['audit' => $audit, 'locations' => Location::orderBy('name')->get(['id', 'name'])]);
    }

    public function scan(Request $request, StockAudit $audit)
    {
        $data = $request->validate(['asset_code' => ['required', 'exists:tool_units,asset_code'], 'location_id' => ['required', 'exists:locations,id'], 'condition' => ['required', Rule::in(['baik', 'perlu_perhatian', 'rusak', 'hilang'])], 'note' => ['nullable', 'string']]);
        $unit = ToolUnit::where('asset_code', $data['asset_code'])->firstOrFail();
        $item = $audit->items()->where('unit_id', $unit->id)->first();
        if (! $item) {
            return back()->withErrors(['asset_code' => 'Unit tidak termasuk dalam snapshot audit ini.']);
        }
        $status = $data['condition'] === 'hilang' ? 'hilang' : ($unit->location_id != $data['location_id'] ? 'selisih_lokasi' : ($unit->condition !== $data['condition'] ? 'kondisi_berbeda' : 'sesuai'));
        $wasUnchecked = $item->status === 'belum_discan';
        $item->update(['actual_location_id' => $data['location_id'], 'actual_condition' => $data['condition'], 'status' => $status, 'note' => $data['note'] ?? null, 'scanned_by' => $request->user()->id, 'scanned_at' => now()]);
        $unit->update(['last_audited_at' => now()]);
        $audit->update(['status' => 'berjalan', 'checked_units' => $wasUnchecked ? $audit->checked_units + 1 : $audit->checked_units]);
        AuditLogger::record('audit.unit_scanned', $audit, ['unit' => $unit->asset_code, 'result' => $status]);

        return back()->with('success', "{$unit->asset_code} tercatat: ".str_replace('_', ' ', $status).'.');
    }

    public function complete(Request $request, StockAudit $audit)
    {
        $data = $request->validate(['reviewer_note' => ['required', 'string', 'min:5'], 'reconcile' => ['nullable', 'boolean']]);
        DB::transaction(function () use ($audit, $data) {
            $audit->items()->where('status', 'belum_discan')->update(['status' => 'tidak_ditemukan', 'note' => 'Tidak ditemukan hingga audit difinalisasi.']);
            if ($data['reconcile'] ?? false) {
                foreach ($audit->items()->whereIn('status', ['selisih_lokasi', 'kondisi_berbeda'])->get() as $item) {
                    $item->unit()->update(['location_id' => $item->actual_location_id, 'condition' => $item->actual_condition]);
                }
            }
            $audit->update(['status' => 'selesai', 'reviewer_note' => $data['reviewer_note']]);
            AuditLogger::record('audit.completed', $audit, ['reconciled' => (bool) ($data['reconcile'] ?? false)]);
        });

        return to_route('audits.index')->with('success', 'Audit selesai dan hasil rekonsiliasi tersimpan.');
    }
}
