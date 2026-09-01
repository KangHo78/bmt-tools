<?php

namespace App\Http\Controllers;

use App\Models\AssetReceipt;
use App\Models\Location;
use App\Models\LocationMovement;
use App\Models\SsoNpb;
use App\Models\SsoNpbItem;
use App\Models\SsoUser;
use App\Models\ToolType;
use App\Models\ToolUnit;
use App\Support\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class InventoryController extends Controller
{
    public function index(Request $request)
    {
        $view = $request->string('view')->toString() === 'units' ? 'units' : 'receipts';
        $search = trim((string) $request->q);

        return Inertia::render('Inventory/Index', [
            'units' => $view === 'units' ? ToolUnit::with(['toolType:id,name,code', 'location:id,name'])
                ->when($search, fn ($query, $q) => $query->where(function ($query) use ($q) {
                    $query->where('asset_code', 'like', "%{$q}%")
                        ->orWhere('owner', 'like', "%{$q}%")
                        ->orWhereHas('toolType', fn ($query) => $query->where('name', 'like', "%{$q}%"));
                }))
                ->orderBy('asset_code')
                ->paginate(20)
                ->withQueryString() : null,
            'receipts' => $view === 'receipts' ? AssetReceipt::query()
                ->with(['receiver:id,name', 'items.toolType:id,name,code'])
                ->withCount('items')
                ->withSum('items as total_units', 'received_quantity')
                ->when($search, fn ($query, $q) => $query->where(function ($query) use ($q) {
                    $query->where('reference_no', 'like', "%{$q}%")
                        ->orWhere('request_reference', 'like', "%{$q}%")
                        ->orWhere('owner_institution', 'like', "%{$q}%")
                        ->orWhereHas('items.toolType', fn ($itemQuery) => $itemQuery
                            ->where('name', 'like', "%{$q}%")
                            ->orWhere('code', 'like', "%{$q}%"))
                        ->orWhereHas('items.units', fn ($unitQuery) => $unitQuery->where('asset_code', 'like', "%{$q}%"));
                }))
                ->latest('received_date')
                ->latest('id')
                ->paginate(15)
                ->withQueryString() : null,
            'locations' => $view === 'units' ? Location::orderBy('name')->get(['id', 'name']) : [],
            'filters' => ['q' => $search, 'view' => $view],
        ]);
    }

    public function create()
    {
        $toolTypes = ToolType::orderBy('name')->get(['id', 'sso_item_id', 'name', 'code', 'unit', 'primary_location_id']);
        $sourceMap = $toolTypes->whereNotNull('sso_item_id')->keyBy('sso_item_id');
        $ownerUsers = collect();
        $npbs = collect();
        $ssoUnavailable = false;
        $npbMessage = null;

        try {
            $ownerUsers = SsoUser::query()
                ->where('is_active', 1)
                ->where('is_group', 0)
                ->orderBy('name')
                ->get(['id', 'name', 'username']);

            $sourceIds = $sourceMap->keys();
            if ($sourceIds->isNotEmpty()) {
                $npbs = SsoNpb::query()
                    ->where('flag', 1)
                    ->whereHas('items', fn ($query) => $query->whereIn('item_id', $sourceIds))
                    ->with([
                        'requester:id,name',
                        'items' => fn ($query) => $query->whereIn('item_id', $sourceIds)->with('item:id,item_no,item_name,unit'),
                    ])
                    ->latest('id')
                    ->limit(100)
                    ->get()
                    ->map(function (SsoNpb $npb) use ($sourceMap): array {
                        return [
                            'id' => $npb->id,
                            'reference' => $this->npbReference($npb),
                            'requester' => $npb->requester?->name,
                            'date' => $npb->created_date ?? $npb->created_at ?? null,
                            'items' => $npb->items->map(function (SsoNpbItem $item) use ($sourceMap): array {
                                $toolType = $sourceMap[$item->item_id];

                                return [
                                    'id' => $item->id,
                                    'tool_type_id' => $toolType->id,
                                    'item_no' => $item->item?->item_no ?: $toolType->code,
                                    'item_name' => $item->item?->item_name ?: $toolType->name,
                                    'unit' => $item->item?->unit ?: $toolType->unit,
                                    'quantity' => max(1, (int) round((float) $item->qty)),
                                    'primary_location_id' => $toolType->primary_location_id,
                                ];
                            })->values(),
                        ];
                    });
                if ($npbs->isEmpty()) {
                    $npbMessage = 'Belum ada NPB aktif yang itemnya terhubung dengan Master Aset.';
                }
            } else {
                $npbMessage = 'Belum ada Master Aset yang terhubung dengan item BMT Multi.';
            }
        } catch (\Throwable) {
            $ssoUnavailable = true;
            $npbMessage = 'Koneksi data NPB BMT Multi belum tersedia. Coba muat ulang.';
        }

        return Inertia::render('Inventory/CreateReceipt', [
            'toolTypes' => $toolTypes,
            'locations' => Location::orderBy('name')->get(['id', 'name']),
            'ownerUsers' => $ownerUsers,
            'npbs' => $npbs,
            'ssoUnavailable' => $ssoUnavailable,
            'npbMessage' => $npbMessage,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'request_reference' => ['nullable', 'string', 'max:100'],
            'owner_sso_user_id' => ['nullable', 'integer', 'required_without:owner_institution'],
            'owner_institution' => ['nullable', 'string', 'max:255', 'required_without:owner_sso_user_id'],
            'received_date' => ['required', 'date', 'before_or_equal:today'], 'notes' => ['nullable', 'string', 'max:1000'],
            'document' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'], 'items' => ['required', 'array', 'min:1'],
            'items.*.tool_type_id' => ['required', 'exists:tool_types,id'], 'items.*.location_id' => ['required', 'exists:locations,id'],
            'items.*.received_quantity' => ['required', 'integer', 'min:1', 'max:100'],
            'items.*.initial_condition' => ['required', Rule::in(['baik', 'perlu_perhatian', 'rusak'])],
            'items.*.source_npb_id' => ['nullable', 'integer'], 'items.*.source_npb_item_id' => ['nullable', 'integer'],
            'items.*.source_reference' => ['nullable', 'string', 'max:255'],
            'items.*.source_po_number' => ['nullable', 'string', 'max:100'],
        ]);
        $owner = $data['owner_institution'] ?? null;
        if ($data['owner_sso_user_id'] ?? null) {
            $ownerUser = SsoUser::query()->where('is_active', 1)->where('is_group', 0)->find($data['owner_sso_user_id']);
            if (! $ownerUser) {
                throw ValidationException::withMessages(['owner_sso_user_id' => 'User BMT Multi tidak ditemukan atau sudah tidak aktif.']);
            }
            $owner = mb_substr($ownerUser->name ?: $ownerUser->username, 0, 255);
        }
        $this->validateNpbSources($data['items']);

        $receipt = DB::transaction(function () use ($request, $data, $owner) {
            $receipt = AssetReceipt::create([
                'reference_no' => 'RCV-'.now()->format('Ym').'-'.str_pad((string) (AssetReceipt::count() + 1), 4, '0', STR_PAD_LEFT),
                'request_reference' => $data['request_reference'] ?? null, 'owner_institution' => $owner,
                'owner_sso_user_id' => $data['owner_sso_user_id'] ?? null,
                'received_date' => $data['received_date'], 'received_by' => $request->user()->id, 'status' => 'selesai',
                'notes' => $data['notes'] ?? null, 'document_url' => $request->file('document')?->store('asset-receipts', 'public'),
            ]);
            foreach ($data['items'] as $row) {
                $location = Location::query()->withCount('units')->lockForUpdate()->findOrFail($row['location_id']);
                if ($location->capacity !== null && $location->units_count + $row['received_quantity'] > $location->capacity) {
                    throw ValidationException::withMessages(['items' => "Kapasitas {$location->name} tidak mencukupi untuk {$row['received_quantity']} unit."]);
                }
                $item = $receipt->items()->create([
                    ...$row,
                    'requested_quantity' => $row['received_quantity'],
                    'difference_reason' => null,
                ]);
                $type = ToolType::lockForUpdate()->findOrFail($row['tool_type_id']);
                $sequence = 1;
                for ($i = 0; $i < $row['received_quantity']; $i++) {
                    do {
                        $code = sprintf('%s.%d', $type->code, $sequence++);
                    } while (ToolUnit::where('asset_code', $code)->exists());
                    ToolUnit::create(['tool_type_id' => $type->id, 'asset_receipt_item_id' => $item->id, 'asset_code' => $code, 'status' => $row['initial_condition'] === 'rusak' ? 'rusak' : 'tersedia', 'condition' => $row['initial_condition'], 'location_id' => $row['location_id'], 'owner' => $owner, 'owner_sso_user_id' => $data['owner_sso_user_id'] ?? null, 'source_npb_id' => $row['source_npb_id'] ?? null, 'source_npb_item_id' => $row['source_npb_item_id'] ?? null, 'source_reference' => $row['source_reference'] ?? null, 'source_po_number' => $row['source_po_number'] ?? null, 'received_at' => $data['received_date']]);
                }
            }
            AuditLogger::record('asset.received', $receipt, ['items' => count($data['items'])]);

            return $receipt;
        });

        return to_route('inventory.receipts.show', $receipt)->with('success', 'Penerimaan selesai dan kode aset telah dibuat.');
    }

    private function validateNpbSources(array &$items): void
    {
        $sourceRows = collect($items)->filter(fn ($item) => filled($item['source_npb_item_id'] ?? null));
        if ($sourceRows->isEmpty()) {
            return;
        }

        $npbItems = SsoNpbItem::query()
            ->whereIn('id', $sourceRows->pluck('source_npb_item_id'))
            ->get(['id', 'npb_id', 'item_id'])
            ->keyBy('id');
        $npbs = SsoNpb::query()
            ->where('flag', 1)
            ->whereIn('id', $sourceRows->pluck('source_npb_id'))
            ->get()
            ->keyBy('id');
        $toolTypes = ToolType::whereIn('id', $sourceRows->pluck('tool_type_id'))->get(['id', 'sso_item_id'])->keyBy('id');

        foreach ($items as $index => $row) {
            if (! filled($row['source_npb_item_id'] ?? null)) {
                continue;
            }
            $source = $npbItems[$row['source_npb_item_id']] ?? null;
            $npb = $npbs[$row['source_npb_id']] ?? null;
            $toolType = $toolTypes[$row['tool_type_id']] ?? null;
            if (! $source || ! $npb || ! $toolType || (int) $source->npb_id !== (int) $row['source_npb_id'] || (int) $source->item_id !== (int) $toolType->sso_item_id) {
                throw ValidationException::withMessages(['items' => 'Salah satu sumber item NPB tidak valid atau tidak lagi tersedia.']);
            }
            $items[$index]['source_reference'] = $this->npbReference($npb);
        }
    }

    private function npbReference(SsoNpb $npb): string
    {
        return filled($npb->npb__no)
            ? $npb->npb__no
            : sprintf('%04d/NPB/%s', $npb->idx ?? $npb->id, date('m/Y', strtotime($npb->created_date ?? 'now')));
    }

    public function showReceipt(AssetReceipt $receipt)
    {
        $receipt->load(['receiver:id,name', 'items.toolType', 'items.location', 'items.units']);

        return Inertia::render('Inventory/ReceiptShow', ['receipt' => $receipt]);
    }

    public function updateReceipt(Request $request, AssetReceipt $receipt)
    {
        $data = $request->validate([
            'request_reference' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'document' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'remove_document' => ['nullable', 'boolean'],
        ]);

        $oldDocument = $receipt->document_url;
        $newDocument = $request->file('document')?->store('asset-receipts', 'public');
        $documentUrl = $newDocument
            ?? (($data['remove_document'] ?? false) ? null : $oldDocument);

        $receipt->update([
            'request_reference' => $data['request_reference'] ?? null,
            'notes' => $data['notes'] ?? null,
            'document_url' => $documentUrl,
        ]);

        if ($oldDocument && $oldDocument !== $documentUrl) {
            Storage::disk('public')->delete($oldDocument);
        }
        AuditLogger::record('asset.receipt_updated', $receipt, [
            'document_replaced' => filled($newDocument),
            'document_removed' => ! $documentUrl && filled($oldDocument),
        ]);

        return back()->with('success', 'Data dan dokumen penerimaan berhasil diperbarui.');
    }

    public function labels(AssetReceipt $receipt)
    {
        $receipt->load('items.toolType', 'items.units');

        $units = $receipt->items->flatMap(fn ($item) => $item->units->map(fn ($unit) => [
            'id' => $unit->id,
            'asset_code' => $unit->asset_code,
            'owner' => $unit->owner ?: $receipt->owner_institution,
            'tool_type' => $item->toolType->only(['id', 'name', 'code']),
        ]))->values();

        return Inertia::render('Inventory/Labels', [
            'batch' => [
                'title' => $receipt->reference_no,
                'back_url' => route('inventory.receipts.show', $receipt, absolute: false),
                'units' => $units,
            ],
        ]);
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
