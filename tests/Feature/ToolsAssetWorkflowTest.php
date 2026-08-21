<?php

namespace Tests\Feature;

use App\Models\Loan;
use App\Models\PhysicalToken;
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
        $token = $user->borrower->tokens()->where('status', 'dipegang_peminjam')->firstOrFail();

        $response = $this->actingAs($user)->post(route('loans.store'), [
            'tool_type_ids' => [$type->id],
            'usage_type' => 'dalam_area',
            'purpose' => 'Perbaikan pagar workshop',
            'location_text' => 'Workshop Trowulan',
            'start_date' => now()->addDay()->toDateString(),
            'token_codes' => [$type->id => $token->code],
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

    public function test_tools_admin_can_create_a_loan_on_behalf_of_a_borrower(): void
    {
        $staff = User::where('email', 'petugas@tams.id')->firstOrFail();
        $borrower = User::where('email', 'user@tams.id')->firstOrFail();
        $type = ToolType::where('code', 'TWL-GRD')->firstOrFail();
        $borrowerTokens = $borrower->token_used;
        $staffTokens = $staff->token_used;
        $profile = $borrower->borrower;
        $physicalToken = $profile->tokens()->where('status', 'dipegang_peminjam')->firstOrFail();

        $this->actingAs($staff)
            ->get(route('loans.create'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('canChooseBorrower', true)
                ->where('selectedBorrowerId', $staff->borrower->id)
                ->where('borrowers', fn ($users) => collect($users)->contains('id', $profile->id)));

        $response = $this->actingAs($staff)->post(route('loans.store'), [
            'borrower_id' => $profile->id,
            'tool_type_ids' => [$type->id],
            'usage_type' => 'dalam_area',
            'purpose' => 'Pekerjaan yang diinput petugas',
            'location_text' => 'Workshop Trowulan',
            'start_date' => now()->addDay()->toDateString(),
            'token_codes' => [$type->id => $physicalToken->code],
        ]);

        $loan = Loan::latest('id')->firstOrFail();
        $response->assertRedirect(route('loans.show', $loan));
        $this->assertSame($borrower->id, $loan->user_id);
        $this->assertSame($borrowerTokens + 1, $borrower->fresh()->token_used);
        $this->assertSame($staffTokens, $staff->fresh()->token_used);
        $this->assertDatabaseHas('notifications', [
            'user_id' => $borrower->id,
            'object_type' => 'loan',
            'object_id' => $loan->id,
        ]);
        $this->assertDatabaseHas('activity_logs', [
            'user_id' => $staff->id,
            'action' => 'loan.created',
            'subject_id' => $loan->id,
        ]);
    }

    public function test_borrower_cannot_create_a_loan_for_another_user(): void
    {
        $borrower = User::where('email', 'user@tams.id')->firstOrFail();
        $other = User::where('email', 'andi@tams.id')->firstOrFail();
        $type = ToolType::where('code', 'TWL-GRD')->firstOrFail();
        $this->actingAs($borrower)->post(route('loans.store'), [
            'borrower_id' => $other->id,
            'tool_type_ids' => [$type->id],
            'usage_type' => 'dalam_area',
            'purpose' => 'Percobaan manipulasi peminjam',
            'location_text' => 'Workshop Trowulan',
            'start_date' => now()->addDay()->toDateString(),
        ])->assertSessionHasErrors('borrower_id');
    }

    public function test_staff_can_register_a_walk_in_borrower_and_physical_token(): void
    {
        $staff = User::where('email', 'petugas@tams.id')->firstOrFail();
        $type = ToolType::where('code', 'TWL-GRD')->firstOrFail();

        $response = $this->actingAs($staff)->post(route('loans.store'), [
            'new_borrower' => ['name' => 'Tamu Workshop', 'identifier' => 'NRP-9001', 'institution' => 'Vendor Harian', 'phone' => '081200009001'],
            'tool_type_ids' => [$type->id], 'token_codes' => [$type->id => 'TK-9001'],
            'usage_type' => 'dalam_area', 'purpose' => 'Perbaikan sementara',
            'location_text' => 'Workshop Trowulan', 'start_date' => now()->addDay()->toDateString(),
        ]);

        $loan = Loan::latest('id')->firstOrFail();
        $response->assertRedirect(route('loans.show', $loan));
        $this->assertNull($loan->user_id);
        $this->assertSame('Tamu Workshop', $loan->borrower->name);
        $this->assertSame('TK-9001', $loan->items()->firstOrFail()->physicalToken->code);
        $this->assertSame('direservasi', $loan->items()->firstOrFail()->physicalToken->status);
    }

    public function test_admin_can_create_a_token_range_and_transfer_an_available_token(): void
    {
        $admin = User::where('email', 'admin@tams.id')->firstOrFail();
        $source = User::where('email', 'user@tams.id')->firstOrFail()->borrower;
        $target = User::where('email', 'andi@tams.id')->firstOrFail()->borrower;

        $this->actingAs($admin)->post(route('admin.tokens.store', $source), [
            'code' => '08-01-10',
        ])->assertRedirect();

        foreach (range(1, 10) as $number) {
            $this->assertDatabaseHas('physical_tokens', [
                'borrower_id' => $source->id,
                'code' => sprintf('08-%02d', $number),
            ]);
        }

        $token = PhysicalToken::where('code', '08-01')->firstOrFail();
        $this->actingAs($admin)->post(route('admin.tokens.transfer', $token), [
            'borrower_id' => $target->id,
            'reason' => 'Kepingan diserahkan kepada Deny Pras',
        ])->assertRedirect();

        $this->assertSame($target->id, $token->fresh()->borrower_id);
        $this->assertDatabaseHas('activity_logs', [
            'user_id' => $admin->id,
            'action' => 'physical_token.transferred',
            'subject_id' => $token->id,
        ]);
    }

    public function test_token_in_an_active_transaction_cannot_be_transferred(): void
    {
        $admin = User::where('email', 'admin@tams.id')->firstOrFail();
        $token = PhysicalToken::where('status', 'direservasi')->firstOrFail();
        $target = User::where('email', 'andi@tams.id')->firstOrFail()->borrower;
        $owner = $token->borrower_id;

        $this->actingAs($admin)->post(route('admin.tokens.transfer', $token), [
            'borrower_id' => $target->id,
            'reason' => 'Percobaan pemindahan',
        ])->assertSessionHasErrors('token');

        $this->assertSame($owner, $token->fresh()->borrower_id);
    }

    public function test_external_loan_requires_a_letter_and_head_approval(): void
    {
        $user = User::where('email', 'andi@tams.id')->firstOrFail();
        $type = ToolType::where('code', 'TWL-GRD')->firstOrFail();
        $token = $user->borrower->tokens()->where('status', 'dipegang_peminjam')->firstOrFail();

        $this->actingAs($user)->post(route('loans.store'), [
            'tool_type_ids' => [$type->id], 'usage_type' => 'luar_area', 'purpose' => 'Pekerjaan cabang',
            'location_text' => 'Surabaya', 'start_date' => now()->addDay()->toDateString(), 'due_date' => now()->addWeek()->toDateString(),
            'token_codes' => [$type->id => $token->code],
        ])->assertSessionHasErrors('letter');

        $this->actingAs($user)->post(route('loans.store'), [
            'tool_type_ids' => [$type->id], 'usage_type' => 'luar_area', 'purpose' => 'Pekerjaan cabang',
            'location_text' => 'Surabaya', 'start_date' => now()->addDay()->toDateString(), 'due_date' => now()->addWeek()->toDateString(),
            'letter' => UploadedFile::fake()->create('surat.pdf', 100, 'application/pdf'),
            'token_codes' => [$type->id => $token->code],
        ])->assertRedirect();

        $loan = Loan::latest('id')->firstOrFail();
        $this->assertSame('menunggu_approval', $loan->status);
        $head = User::where('role', 'kepala_logistik')->firstOrFail();
        $this->actingAs($head)->post(route('loans.approve', $loan))->assertRedirect();
        $this->assertSame('disetujui', $loan->fresh()->status);
        $this->assertSame($head->id, $loan->fresh()->approved_by_id);
    }

    public function test_admin_can_choose_exactly_who_may_approve(): void
    {
        $admin = User::where('email', 'admin@tams.id')->firstOrFail();
        $head = User::where('email', 'kepala@tams.id')->firstOrFail();
        $loan = Loan::where('trx_no', 'TRX-1058')->firstOrFail();

        $this->actingAs($admin)
            ->post(route('admin.approvers.update'), [
                'user_ids' => [$admin->id],
                'reason' => 'Delegasi approval kepada admin utama',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('system_settings', [
            'key' => 'approval_user_ids',
            'value' => json_encode([$admin->id]),
        ]);
        $this->actingAs($head)->get(route('approvals.index'))->assertForbidden();
        $this->actingAs($head)->post(route('loans.approve', $loan))->assertForbidden();

        $this->actingAs($admin)->get(route('approvals.index'))->assertOk();
        $this->actingAs($admin)->post(route('loans.approve', $loan))->assertRedirect();
        $this->assertSame($admin->id, $loan->fresh()->approved_by_id);
    }

    public function test_approver_configuration_requires_at_least_one_eligible_user(): void
    {
        $admin = User::where('email', 'admin@tams.id')->firstOrFail();
        $staff = User::where('email', 'petugas@tams.id')->firstOrFail();

        $this->actingAs($admin)
            ->post(route('admin.approvers.update'), [
                'user_ids' => [$staff->id],
                'reason' => 'Mencoba user yang tidak eligible',
            ])
            ->assertSessionHasErrors('user_ids');

        $this->actingAs($admin)
            ->post(route('admin.approvers.update'), [
                'user_ids' => [],
                'reason' => 'Mencoba mengosongkan approver',
            ])
            ->assertSessionHasErrors('user_ids');
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
