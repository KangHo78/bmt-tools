<?php

namespace Tests\Feature;

use App\Models\AssetCase;
use App\Models\AssetReceipt;
use App\Models\Loan;
use App\Models\LoanExtension;
use App\Models\Location;
use App\Models\MaintenanceOrder;
use App\Models\StockAudit;
use App\Models\SystemNotification;
use App\Models\ToolType;
use App\Models\ToolUnit;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class FunctionalPrdTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
        Storage::fake('public');
    }

    public function test_asset_receipt_generates_unique_units_and_printable_labels(): void
    {
        $staff = User::where('email', 'petugas@tams.id')->firstOrFail();
        $type = ToolType::where('code', 'TWL-GRD')->firstOrFail();
        $location = Location::where('type', 'slot')->firstOrFail();
        $before = ToolUnit::where('tool_type_id', $type->id)->count();

        $this->actingAs($staff)->post(route('inventory.receipts.store'), [
            'request_reference' => 'REQ-001', 'owner_institution' => 'Workshop Sipil', 'received_date' => today()->toDateString(),
            'items' => [['tool_type_id' => $type->id, 'location_id' => $location->id, 'received_quantity' => 2, 'initial_condition' => 'baik']],
        ])->assertRedirect();

        $receipt = AssetReceipt::latest('id')->firstOrFail();
        $this->assertSame(2, ToolUnit::where('tool_type_id', $type->id)->count() - $before);
        $this->assertCount(2, $receipt->items->first()->units);
        $this->assertSame(2, $receipt->items->first()->requested_quantity);
        $this->assertSame(2, $receipt->items->first()->units->pluck('asset_code')->unique()->count());
        $this->assertSame(
            [$type->code.'.1', $type->code.'.2'],
            $receipt->items->first()->units->pluck('asset_code')->sort()->values()->all(),
        );
        $this->actingAs($staff)->get(route('inventory.labels', $receipt))->assertOk();
        $this->assertDatabaseHas('activity_logs', ['action' => 'asset.received', 'subject_id' => $receipt->id]);
    }

    public function test_catalog_labels_can_be_printed_by_tools_admin_but_not_borrower(): void
    {
        $staff = User::where('email', 'petugas@tams.id')->firstOrFail();
        $borrower = User::where('email', 'user@tams.id')->firstOrFail();
        $type = ToolType::whereHas('units')->firstOrFail();
        $unit = $type->units()->firstOrFail();

        $this->actingAs($staff)
            ->get(route('catalog.labels', $type))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Inventory/Labels')
                ->has('batch.units', $type->units()->count()));

        $this->actingAs($staff)
            ->get(route('catalog.labels', ['toolType' => $type, 'unit' => $unit->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('batch.title', $unit->asset_code)
                ->has('batch.units', 1));

        $this->actingAs($borrower)
            ->get(route('catalog.labels', $type))
            ->assertForbidden();
    }

    public function test_manual_receipt_assigns_a_different_po_number_per_item_number(): void
    {
        $staff = User::where('email', 'petugas@tams.id')->firstOrFail();
        $types = ToolType::query()->take(2)->get();
        $location = Location::where('type', 'slot')->firstOrFail();

        $this->actingAs($staff)->post(route('inventory.receipts.store'), [
            'owner_institution' => 'Workshop Sipil',
            'received_date' => today()->toDateString(),
            'items' => [
                ['tool_type_id' => $types[0]->id, 'location_id' => $location->id, 'received_quantity' => 2, 'initial_condition' => 'baik', 'source_po_number' => 'PO-MANUAL-001'],
                ['tool_type_id' => $types[1]->id, 'location_id' => $location->id, 'received_quantity' => 1, 'initial_condition' => 'baik', 'source_po_number' => 'PO-MANUAL-002'],
            ],
        ])->assertRedirect();

        $receipt = AssetReceipt::latest('id')->firstOrFail()->load('items.units');
        $this->assertSame('PO-MANUAL-001', $receipt->items->firstWhere('tool_type_id', $types[0]->id)->source_po_number);
        $this->assertSame(['PO-MANUAL-001'], $receipt->items->firstWhere('tool_type_id', $types[0]->id)->units->pluck('source_po_number')->unique()->values()->all());
        $this->assertSame('PO-MANUAL-002', $receipt->items->firstWhere('tool_type_id', $types[1]->id)->source_po_number);
        $this->assertSame(['PO-MANUAL-002'], $receipt->items->firstWhere('tool_type_id', $types[1]->id)->units->pluck('source_po_number')->unique()->values()->all());
    }

    public function test_location_move_records_origin_destination_and_reason(): void
    {
        $staff = User::where('email', 'petugas@tams.id')->firstOrFail();
        $unit = ToolUnit::where('status', 'tersedia')->firstOrFail();
        $destination = Location::whereKeyNot($unit->location_id)->firstOrFail();
        $origin = $unit->location_id;
        $this->actingAs($staff)->post(route('inventory.move', $unit), ['location_id' => $destination->id, 'reason' => 'Penataan ulang rak bulanan'])->assertRedirect();
        $this->assertSame($destination->id, $unit->fresh()->location_id);
        $this->assertDatabaseHas('location_movements', ['tool_unit_id' => $unit->id, 'from_location_id' => $origin, 'to_location_id' => $destination->id]);
    }

    public function test_maintenance_locks_unit_then_releases_it_after_completion(): void
    {
        $staff = User::where('email', 'petugas@tams.id')->firstOrFail();
        $unit = ToolUnit::where('status', 'tersedia')->firstOrFail();
        $this->actingAs($staff)->post(route('maintenance.store'), ['unit_id' => $unit->id, 'type' => 'kalibrasi', 'action' => 'Kalibrasi akurasi tahunan', 'scheduled_date' => today()->toDateString()])->assertRedirect();
        $order = MaintenanceOrder::latest('id')->firstOrFail();
        $this->assertSame('perawatan', $unit->fresh()->status);
        $this->actingAs($staff)->post(route('maintenance.update', $order), ['status' => 'selesai', 'cost' => 150000, 'notes' => 'Hasil normal'])->assertRedirect();
        $this->assertSame('tersedia', $unit->fresh()->status);
        $this->assertNotNull($order->fresh()->completed_date);
    }

    public function test_stock_audit_snapshots_scans_and_reconciles_units(): void
    {
        $staff = User::where('email', 'petugas@tams.id')->firstOrFail();
        $unit = ToolUnit::where('status', 'tersedia')->firstOrFail();
        $destination = Location::whereKeyNot($unit->location_id)->firstOrFail();
        $this->actingAs($staff)->post(route('audits.store'), ['name' => 'Audit Test', 'scope' => 'Semua unit', 'assigned_to' => $staff->name, 'scheduled_date' => today()->toDateString()])->assertRedirect();
        $audit = StockAudit::latest('id')->firstOrFail();
        $this->assertSame(ToolUnit::count(), $audit->items()->count());
        $this->actingAs($staff)->post(route('audits.scan', $audit), ['asset_code' => $unit->asset_code, 'location_id' => $destination->id, 'condition' => 'baik'])->assertRedirect();
        $this->assertDatabaseHas('stock_audit_items', ['stock_audit_id' => $audit->id, 'unit_id' => $unit->id, 'status' => 'selisih_lokasi']);
        $this->actingAs($staff)->post(route('audits.complete', $audit), ['reviewer_note' => 'Selisih sudah diverifikasi', 'reconcile' => true])->assertRedirect();
        $this->assertSame($destination->id, $unit->fresh()->location_id);
        $this->assertSame('selesai', $audit->fresh()->status);
        $this->assertGreaterThan(0, $audit->items()->where('status', 'tidak_ditemukan')->count());
    }

    public function test_external_extension_requires_head_approval(): void
    {
        $borrower = User::where('email', 'user@tams.id')->firstOrFail();
        $head = User::where('email', 'kepala@tams.id')->firstOrFail();
        $loan = Loan::create(['trx_no' => 'TRX-EXT-1', 'user_id' => $borrower->id, 'usage_type' => 'luar_area', 'purpose' => 'Proyek luar', 'location_text' => 'Jakarta', 'start_date' => now()->subDay(), 'due_date' => now()->addDay(), 'status' => 'berjalan', 'tokens_used' => 1]);
        $oldDue = $loan->due_date;
        $this->actingAs($borrower)->post(route('loans.extend', $loan), ['new_due_date' => now()->addWeek()->toDateString(), 'reason' => 'Pekerjaan belum selesai'])->assertRedirect();
        $extension = LoanExtension::latest('id')->firstOrFail();
        $this->assertSame('menunggu_approval', $extension->status);
        $this->assertEquals($oldDue, $loan->fresh()->due_date);
        $this->actingAs($head)->post(route('extensions.approve', $extension))->assertRedirect();
        $this->assertSame('disetujui', $extension->fresh()->status);
        $this->assertEquals($extension->new_due_date, $loan->fresh()->due_date);
        $this->assertDatabaseHas('notifications', ['user_id' => $borrower->id, 'object_type' => 'loan']);
    }

    public function test_case_requires_report_and_decision_before_closing(): void
    {
        $head = User::where('email', 'kepala@tams.id')->firstOrFail();
        $case = AssetCase::firstOrFail();
        $this->actingAs($head)->post(route('cases.update', $case), ['stage' => 'selesai', 'resolution_status' => 'sudah_diganti', 'decision' => ''])->assertSessionHasErrors('stage');
        $this->actingAs($head)->post(route('cases.update', $case), ['stage' => 'selesai', 'resolution_status' => 'sudah_diganti', 'decision' => 'User mengganti unit dengan spesifikasi setara.', 'report' => UploadedFile::fake()->create('berita-acara.pdf', 100, 'application/pdf')])->assertRedirect();
        $this->assertSame('selesai', $case->fresh()->stage);
        $this->assertTrue($case->fresh()->has_berita_acara);
        $this->assertNotNull($case->fresh()->closed_at);
    }

    public function test_automation_marks_overdue_and_report_can_be_exported(): void
    {
        $staff = User::where('email', 'petugas@tams.id')->firstOrFail();
        $loan = Loan::where('status', 'berjalan')->firstOrFail();
        $loan->update(['due_date' => now()->subHour()]);
        $this->artisan('loans:refresh-status')->assertSuccessful();
        $this->assertSame('terlambat', $loan->fresh()->status);
        $this->assertTrue(SystemNotification::where('object_id', $loan->id)->where('title', 'like', '%terlambat%')->exists());
        $head = User::where('email', 'kepala@tams.id')->firstOrFail();
        $this->actingAs($head)->get(route('reports.export', 'assets'))->assertOk()->assertHeader('content-type', 'text/csv; charset=UTF-8');
    }

    public function test_inactive_user_is_logged_out_from_an_existing_session(): void
    {
        $user = User::where('email', 'user@tams.id')->firstOrFail();
        $user->update(['is_active' => false]);

        $this->actingAs($user)->get(route('dashboard'))->assertRedirect(route('login'));
        $this->assertGuest();
    }
}
