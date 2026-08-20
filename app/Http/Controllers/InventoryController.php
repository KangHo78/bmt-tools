<?php

namespace App\Http\Controllers;

use App\Models\AssetReceipt;
use App\Models\Location;
use App\Models\LocationMovement;
use App\Models\ToolType;
use App\Models\ToolUnit;
use App\Support\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class InventoryController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('Inventory/Index', [
            'units' => ToolUnit::with(['toolType:id,name,code', 'location:id,name'])->when($request->q, fn ($query, $q) => $query->where('asset_code', 'like', "%{$q}%"))->orderBy('asset_code')->paginate(20)->withQueryString(),
            'receipts' => AssetReceipt::with('receiver:id,name')->withCount('items')->latest()->limit(8)->get(),
            'locations' => Location::orderBy('name')->get(['id', 'name']),
            'filters' => $request->only('q'),
        ]);
    }

    public function create()
    {
        return Inertia::render('Inventory/CreateReceipt', ['toolTypes' => ToolType::orderBy('name')->get(['id', 'name', 'code']), 'locations' => Location::orderBy('name')->get(['id', 'name'])]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'request_reference' => ['nullable', 'string', 'max:100'], 'owner_institution' => ['required', 'string', 'max:150'],
            'received_date' => ['required', 'date', 'before_or_equal:today'], 'notes' => ['nullable', 'string', 'max:1000'],
            'document' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'], 'items' => ['required', 'array', 'min:1'],
            'items.*.tool_type_id' => ['required', 'exists:tool_types,id'], 'items.*.location_id' => ['required', 'exists:locations,id'],
            'items.*.requested_quantity' => ['required', 'integer', 'min:1', 'max:100'], 'items.*.received_quantity' => ['required', 'integer', 'min:0', 'max:100'],
            'items.*.initial_condition' => ['required', Rule::in(['baik', 'perlu_perhatian', 'rusak'])], 'items.*.difference_reason' => ['nullable', 'string', 'max:500'],
        ]);
        $receipt = DB::transaction(function () use ($request, $data) {
            $receipt = AssetReceipt::create([
                'reference_no' => 'RCV-'.now()->format('Ym').'-'.str_pad((string) (AssetReceipt::count() + 1), 4, '0', STR_PAD_LEFT),
                'request_reference' => $data['request_reference'] ?? null, 'owner_institution' => $data['owner_institution'],
                'received_date' => $data['received_date'], 'received_by' => $request->user()->id, 'status' => 'selesai',
                'notes' => $data['notes'] ?? null, 'document_url' => $request->file('document')?->store('asset-receipts', 'public'),
            ]);
            foreach ($data['items'] as $row) {
                if ($row['requested_quantity'] !== $row['received_quantity'] && empty($row['difference_reason'])) {
                    abort(422, 'Alasan selisih jumlah wajib diisi.');
                }
                $location = Location::query()->withCount('units')->lockForUpdate()->findOrFail($row['location_id']);
                if ($location->capacity !== null && $location->units_count + $row['received_quantity'] > $location->capacity) {
                    throw ValidationException::withMessages(['items' => "Kapasitas {$location->name} tidak mencukupi untuk {$row['received_quantity']} unit."]);
                }
                $item = $receipt->items()->create($row);
                $type = ToolType::lockForUpdate()->findOrFail($row['tool_type_id']);
                for ($i = 0; $i < $row['received_quantity']; $i++) {
                    $sequence = ToolUnit::where('tool_type_id', $type->id)->count() + 1;
                    do {
                        $code = sprintf('%s-%s-%04d', $type->code, now()->format('Y'), $sequence++);
                    } while (ToolUnit::where('asset_code', $code)->exists());
                    ToolUnit::create(['tool_type_id' => $type->id, 'asset_receipt_item_id' => $item->id, 'asset_code' => $code, 'status' => $row['initial_condition'] === 'rusak' ? 'rusak' : 'tersedia', 'condition' => $row['initial_condition'], 'location_id' => $row['location_id'], 'owner' => $data['owner_institution'], 'received_at' => $data['received_date']]);
                }
            }
            AuditLogger::record('asset.received', $receipt, ['items' => count($data['items'])]);

            return $receipt;
        });

        return to_route('inventory.receipts.show', $receipt)->with('success', 'Penerimaan selesai dan kode aset telah dibuat.');
    }

    public function showReceipt(AssetReceipt $receipt)
    {
        $receipt->load(['receiver:id,name', 'items.toolType', 'items.location', 'items.units']);

        return Inertia::render('Inventory/ReceiptShow', ['receipt' => $receipt]);
    }

    public function labels(AssetReceipt $receipt)
    {
        $receipt->load('items.toolType', 'items.units');

        return Inertia::render('Inventory/Labels', ['receipt' => $receipt]);
    }

    public function move(Request $request, ToolUnit $unit)
    {
        $data = $request->validate(['location_id' => ['required', 'exists:locations,id'], 'reason' => ['required', 'string', 'min:5', 'max:500']]);
        DB::transaction(function () use ($request, $unit, $data) {
            if ($unit->location_id === (int) $data['location_id']) {
                throw ValidationException::withMessages(['location_id' => 'Unit sudah berada di lokasi tersebut.']);
            }
            $location = Location::query()->withCount('units')->lockForUpdate()->findOrFail($data['location_id']);
            if ($location->capacity !== null && $location->units_count >= $location->capacity) {
                throw ValidationException::withMessages(['location_id' => "Kapasitas {$location->name} sudah penuh."]);
            }
            LocationMovement::create(['tool_unit_id' => $unit->id, 'from_location_id' => $unit->location_id, 'to_location_id' => $data['location_id'], 'moved_by' => $request->user()->id, 'reason' => $data['reason']]);
            $before = $unit->location_id;
            $unit->update(['location_id' => $data['location_id']]);
            AuditLogger::record('asset.location_moved', $unit, ['from' => $before, 'to' => $data['location_id'], 'reason' => $data['reason']]);
        });

        return back()->with('success', 'Lokasi unit berhasil diperbarui.');
    }
}
