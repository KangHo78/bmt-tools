<?php

namespace Tests\Feature;

use App\Models\Loan;
use App\Models\ToolType;
use App\Models\ToolUnit;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ToolsAssetWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
        Storage::fake('public');
    }

    public function test_user_can_create_internal_loan_and_token_is_reserved(): void
    {
        $user = User::where('email', 'andi@tams.id')->firstOrFail();
        $type = ToolType::where('code', 'TWL-GRD')->firstOrFail();
        $before = $user->token_used;

        $response = $this->actingAs($user)->post(route('loans.store'), [
            'tool_type_ids' => [$type->id],
            'usage_type' => 'dalam_area',
            'purpose' => 'Perbaikan pagar workshop',
            'location_text' => 'Workshop Trowulan',
            'start_date' => now()->addDay()->toDateString(),
        ]);

        $loan = Loan::latest('id')->firstOrFail();
        $response->assertRedirect(route('loans.show', $loan));
        $this->assertSame('disetujui', $loan->status);
        $this->assertSame(1, $loan->tokens_used);
        $this->assertTrue($loan->due_date->isFriday());
        $this->assertSame($before + 1, $user->fresh()->token_used);
    }

    public function test_user_can_open_new_loan_form_with_available_tools(): void
    {
        $user = User::where('email', 'user@tams.id')->firstOrFail();

        $this->actingAs($user)
            ->get(route('loans.create'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Loans/Create')
                ->has('tools')
                ->where('tools.0.available_count', fn ($count) => (int) $count > 0));
    }

    public function test_external_loan_requires_a_letter_and_head_approval(): void
    {
        $user = User::where('email', 'andi@tams.id')->firstOrFail();
        $type = ToolType::where('code', 'TWL-GRD')->firstOrFail();

        $this->actingAs($user)->post(route('loans.store'), [
            'tool_type_ids' => [$type->id], 'usage_type' => 'luar_area', 'purpose' => 'Pekerjaan cabang',
            'location_text' => 'Surabaya', 'start_date' => now()->addDay()->toDateString(), 'due_date' => now()->addWeek()->toDateString(),
        ])->assertSessionHasErrors('letter');

        $this->actingAs($user)->post(route('loans.store'), [
            'tool_type_ids' => [$type->id], 'usage_type' => 'luar_area', 'purpose' => 'Pekerjaan cabang',
            'location_text' => 'Surabaya', 'start_date' => now()->addDay()->toDateString(), 'due_date' => now()->addWeek()->toDateString(),
            'letter' => UploadedFile::fake()->create('surat.pdf', 100, 'application/pdf'),
        ])->assertRedirect();

        $loan = Loan::latest('id')->firstOrFail();
        $this->assertSame('menunggu_approval', $loan->status);
        $head = User::where('role', 'kepala_logistik')->firstOrFail();
        $this->actingAs($head)->post(route('loans.approve', $loan))->assertRedirect();
        $this->assertSame('disetujui', $loan->fresh()->status);
        $this->assertSame($head->id, $loan->fresh()->approved_by_id);
    }

    public function test_complete_handover_and_return_releases_token(): void
    {
        $loan = Loan::where('trx_no', 'TRX-1058')->firstOrFail();
        $head = User::where('role', 'kepala_logistik')->firstOrFail();
        $staff = User::where('email', 'petugas@tams.id')->firstOrFail();
        $borrower = $loan->user;
        $this->actingAs($head)->post(route('loans.approve', $loan));
        $loan->load('items');
        $codes = [];
        foreach ($loan->items as $item) {
            $codes[$item->id] = ToolUnit::where('tool_type_id', $item->tool_type_id)->where('status', 'tersedia')->value('asset_code');
        }

        $this->actingAs($staff)->post(route('loans.handover', $loan), [
            'unit_codes' => $codes, 'confirm_staff' => '1', 'confirm_borrower' => '1',
            'photo' => UploadedFile::fake()->image('handover.jpg'),
        ])->assertRedirect(route('loans.show', $loan));

        $this->assertSame('berjalan', $loan->fresh()->status);
        $loan->load('items.unit');
        foreach ($loan->items as $item) {
            $this->assertSame('dipinjam', $item->unit->status);
        }
        $before = $borrower->fresh()->token_used;
        $inspections = [];
        foreach ($loan->items as $item) {
            $inspections[$item->id] = ['status' => 'sesuai', 'note' => 'Lengkap dan normal', 'checklist' => array_fill_keys($item->toolType->checklist ?? [], true), 'photo' => UploadedFile::fake()->image("return-{$item->id}.jpg")];
        }

        $this->actingAs($staff)->post(route('loans.return', $loan), ['inspections' => $inspections])->assertRedirect(route('loans.show', $loan));
        $this->assertSame('selesai', $loan->fresh()->status);
        $this->assertSame($before - $loan->tokens_used, $borrower->fresh()->token_used);
        foreach ($loan->fresh()->items as $item) {
            $this->assertSame('tersedia', $item->unit->status);
        }
    }

    public function test_borrower_cannot_open_staff_registry(): void
    {
        $user = User::where('email', 'user@tams.id')->firstOrFail();
        $this->actingAs($user)->get(route('inventory.index'))->assertForbidden();
    }

    public function test_each_role_can_render_its_primary_workspace(): void
    {
        $user = User::where('email', 'user@tams.id')->firstOrFail();
        $this->actingAs($user)->get(route('dashboard'))->assertOk()->assertInertia(fn (Assert $page) => $page->component('Dashboard'));
        $this->get(route('catalog.index'))->assertOk()->assertInertia(fn (Assert $page) => $page->component('Catalog/Index'));
        $this->get(route('loans.index'))->assertOk()->assertInertia(fn (Assert $page) => $page->component('Loans/Index'));

        $staff = User::where('email', 'petugas@tams.id')->firstOrFail();
        $this->actingAs($staff)->get(route('returns.index'))->assertOk()->assertInertia(fn (Assert $page) => $page->component('Operations/Returns'));
        $this->get(route('inventory.index'))->assertOk()->assertInertia(fn (Assert $page) => $page->component('Inventory/Index'));
        $this->get(route('maintenance.index'))->assertOk();
        $this->get(route('audits.index'))->assertOk();

        $head = User::where('email', 'kepala@tams.id')->firstOrFail();
        $this->actingAs($head)->get(route('approvals.index'))->assertOk()->assertInertia(fn (Assert $page) => $page->component('Operations/Approvals'));
        $this->get(route('reports.index'))->assertOk()->assertInertia(fn (Assert $page) => $page->component('Operations/Reports'));

        $admin = User::where('email', 'admin@tams.id')->firstOrFail();
        $this->actingAs($admin)->get(route('admin.index'))->assertOk()->assertInertia(fn (Assert $page) => $page->component('Operations/Admin'));
    }
}
