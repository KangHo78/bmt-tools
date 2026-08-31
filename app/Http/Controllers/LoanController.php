<?php

namespace App\Http\Controllers;

use App\Models\Borrower;
use App\Models\Loan;
use App\Models\LoanExtension;
use App\Models\SsoUser;
use App\Models\SystemNotification;
use App\Models\ToolType;
use App\Models\ToolUnit;
use App\Models\User;
use App\Services\LoanService;
use App\Services\SsoUserSynchronizer;
use App\Support\ApprovalConfiguration;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class LoanController extends Controller
{
    public function __construct(
        private LoanService $service,
        private SsoUserSynchronizer $ssoSynchronizer,
        private ApprovalConfiguration $approvalConfiguration,
    ) {}

    public function index(Request $request)
    {
        $query = Loan::with(['borrower:id,name,institution', 'items.toolType:id,name,code'])->latest();
        if ($request->user()->role === 'user') {
            $query->where('user_id', $request->user()->id);
        }
        if ($request->status) {
            $query->where('status', $request->status);
        }

        return Inertia::render('Loans/Index', ['loans' => $query->paginate(15)->withQueryString(), 'filters' => $request->only('status')]);
    }

    public function create(Request $request)
    {
        $canChooseBorrower = $request->user()->hasRole('petugas', 'admin');
        $borrowers = collect();

        if ($canChooseBorrower) {
            $borrowers = config('sso.enabled')
                ? SsoUser::managementUsers()->map(fn (SsoUser $ssoUser) => $this->ssoSynchronizer->synchronize($ssoUser, $ssoUser->managementRole()))
                : User::query()->where('is_active', true)->orderBy('name')->get();
            $borrowers->filter->is_active->each(fn (User $user) => Borrower::updateOrCreate(
                ['user_id' => $user->id],
                ['name' => $user->name, 'institution' => $user->institution, 'phone' => $user->phone, 'is_active' => true],
            ));
            $borrowers = Borrower::query()->where('is_active', true)->with(['user:id,email,role', 'tokens' => fn ($query) => $query->orderBy('code')])->orderBy('name')->get();
        }

        $ownBorrower = Borrower::updateOrCreate(
            ['user_id' => $request->user()->id],
            ['name' => $request->user()->name, 'institution' => $request->user()->institution, 'phone' => $request->user()->phone, 'is_active' => true],
        )->load(['user:id,email,role', 'tokens' => fn ($query) => $query->orderBy('code')]);

        return Inertia::render('Loans/Create', [
            'tools' => ToolType::query()
                ->whereHas('units', fn ($query) => $query->where('status', 'tersedia'))
                ->with('availableUnits:id,tool_type_id,asset_code,owner,owner_sso_user_id')
                ->withCount(['units as available_count' => fn ($query) => $query->where('status', 'tersedia')])
                ->addSelect([
                    'approval_unit_id' => ToolUnit::query()->select('id')->whereColumn('tool_type_id', 'tool_types.id')->where('status', 'tersedia')->orderByRaw('CASE WHEN owner_sso_user_id IS NULL THEN 1 ELSE 0 END')->orderBy('id')->limit(1),
                    'approval_unit_code' => ToolUnit::query()->select('asset_code')->whereColumn('tool_type_id', 'tool_types.id')->where('status', 'tersedia')->orderByRaw('CASE WHEN owner_sso_user_id IS NULL THEN 1 ELSE 0 END')->orderBy('id')->limit(1),
                    'approval_owner' => ToolUnit::query()->select('owner')->whereColumn('tool_type_id', 'tool_types.id')->where('status', 'tersedia')->orderByRaw('CASE WHEN owner_sso_user_id IS NULL THEN 1 ELSE 0 END')->orderBy('id')->limit(1),
                    'approval_owner_sso_user_id' => ToolUnit::query()->select('owner_sso_user_id')->whereColumn('tool_type_id', 'tool_types.id')->where('status', 'tersedia')->orderByRaw('CASE WHEN owner_sso_user_id IS NULL THEN 1 ELSE 0 END')->orderBy('id')->limit(1),
                ])
                ->orderBy('name')
                ->get(),
            'logisticsApprovers' => $this->approvalConfiguration->approvers()->map->only(['id', 'name'])->values(),
            'outsideOwnerApprovalRequired' => $this->approvalConfiguration->ownerApprovalRequired(),
            'preselected' => array_filter([(int) $request->query('tool')]),
            'canChooseBorrower' => $canChooseBorrower,
            'selectedBorrowerId' => $ownBorrower->id,
            'borrowers' => ($canChooseBorrower ? $borrowers : collect([$ownBorrower]))->map(fn (Borrower $borrower) => [
                'id' => $borrower->id, 'name' => $borrower->name, 'identifier' => $borrower->identifier,
                'institution' => $borrower->institution, 'phone' => $borrower->phone,
                'email' => $borrower->user?->email, 'has_account' => (bool) $borrower->user_id,
                'tokens' => $borrower->tokens->map->only(['id', 'code', 'status'])->values(),
            ])->values(),
        ]);
    }

    public function store(Request $request)
    {
        $canChooseBorrower = $request->user()->hasRole('petugas', 'admin');
        $data = $request->validate([
            'tool_type_ids' => ['required', 'array', 'min:1'], 'tool_type_ids.*' => ['integer', 'exists:tool_types,id'],
            'tool_unit_ids' => ['required', 'array', 'min:1'], 'tool_unit_ids.*' => ['integer', 'distinct', 'exists:tool_units,id'],
            'usage_type' => ['required', Rule::in(['dalam_area', 'luar_area'])], 'purpose' => ['required', 'string', 'max:1000'],
            'location_text' => ['required', 'string', 'max:255'], 'start_date' => ['required', 'date', 'after_or_equal:today'],
            'due_date' => ['nullable', 'required_if:usage_type,luar_area', 'date', 'after_or_equal:start_date'],
            'letter' => ['nullable', 'required_if:usage_type,luar_area', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'token_codes' => ['required', 'array', 'min:1'],
            'token_codes.*' => ['required', 'string', 'max:50', 'distinct'],
            'borrower_id' => $canChooseBorrower
                ? ['nullable', 'required_without:new_borrower.name', 'integer', 'exists:borrowers,id']
                : ['prohibited'],
            'new_borrower.name' => $canChooseBorrower ? ['nullable', 'required_without:borrower_id', 'string', 'max:255'] : ['prohibited'],
            'new_borrower.identifier' => $canChooseBorrower ? ['nullable', 'string', 'max:100'] : ['prohibited'],
            'new_borrower.institution' => $canChooseBorrower ? ['nullable', 'string', 'max:255'] : ['prohibited'],
            'new_borrower.phone' => $canChooseBorrower ? ['nullable', 'string', 'max:50'] : ['prohibited'],
        ]);
        $borrower = Borrower::query()->where('user_id', $request->user()->id)->firstOrFail();
        $registerGuestTokens = false;

        if ($canChooseBorrower) {
            $registerGuestTokens = ! filled($data['borrower_id'] ?? null);
            $borrower = filled($data['borrower_id'] ?? null)
                ? Borrower::query()->where('is_active', true)->findOrFail($data['borrower_id'])
                : Borrower::create([...$data['new_borrower'], 'is_active' => true]);
        }

        $loan = $this->service->create($borrower, $data, $request->file('letter'), $request->user(), $registerGuestTokens);

        return to_route('loans.show', $loan)->with('success', $borrower->user?->is($request->user())
            ? 'Permohonan berhasil dibuat.'
            : "Peminjaman atas nama {$borrower->name} berhasil dibuat.");
    }

    public function show(Request $request, Loan $loan)
    {
        if ($request->user()->role === 'user') {
            $isBorrower = ($loan->borrower?->user_id ?? $loan->user_id) === $request->user()->id;
            abort_unless($isBorrower || $this->service->canReviewApproval($loan, $request->user()), 403);
        }
        $loan->load(['borrower.user:id,email', 'approver:id,name', 'approvals.approver:id,name', 'approvals.requiredApprover:id,name', 'items.toolType', 'items.physicalToken', 'items.unit.location', 'extensions']);

        return Inertia::render('Loans/Show', [
            'loan' => $loan,
            'canActOnApproval' => (bool) $this->service->actionableApproval($loan, $request->user()),
        ]);
    }

    public function approve(Request $request, Loan $loan)
    {
        $data = $request->validate(['due_date' => ['nullable', 'date', 'after_or_equal:today']]);
        $stage = $this->service->approve($loan, $request->user(), $data['due_date'] ?? null);

        return back()->with('success', $stage === 'owner'
            ? 'Persetujuan owner tersimpan. Permohonan akan diteruskan ke Kepala Logistik setelah seluruh owner menyetujui.'
            : 'Persetujuan Kepala Logistik tersimpan. Permohonan telah disetujui lengkap.');
    }

    public function reject(Request $request, Loan $loan)
    {
        $data = $request->validate(['reason' => ['required', 'string', 'min:5', 'max:1000']]);
        $this->service->reject($loan, $request->user(), $data['reason']);

        return back()->with('success', 'Permohonan ditolak dan token dilepas.');
    }

    public function handoverForm(Loan $loan)
    {
        $loan->load(['borrower:id,name,institution', 'items.toolType', 'items.physicalToken', 'items.unit']);

        return Inertia::render('Loans/Handover', ['loan' => $loan]);
    }

    public function handover(Request $request, Loan $loan)
    {
        $data = $request->validate([
            'unit_codes' => ['required', 'array'],
            'unit_codes.*' => ['required', 'string'],
            'handover_evidence' => ['required', 'array'],
            'handover_evidence.*' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'confirm_staff' => ['accepted'],
            'confirm_borrower' => ['accepted'],
        ]);
        $this->service->handover($loan, $request->user(), $data['unit_codes'], $request->file('handover_evidence', []));

        return to_route('loans.show', $loan)->with('success', 'Serah terima berhasil diselesaikan.');
    }

    public function returnForm(Loan $loan)
    {
        $loan->load([
            'borrower:id,name,institution',
            'items' => fn ($query) => $query->where('return_status', 'belum_dicek'),
            'items.toolType',
            'items.physicalToken',
            'items.unit',
        ]);

        if ($loan->items->isEmpty()) {
            return to_route('loans.show', $loan)->with('error', 'Seluruh item pada peminjaman ini sudah dikembalikan.');
        }

        return Inertia::render('Loans/Return', ['loan' => $loan]);
    }

    public function completeReturn(Request $request, Loan $loan)
    {
        $data = $request->validate(['inspections' => ['required', 'array'], 'inspections.*.status' => ['required', Rule::in(['sesuai', 'rusak', 'tidak_lengkap', 'hilang'])], 'inspections.*.note' => ['nullable', 'string', 'max:1000'], 'inspections.*.checklist' => ['required', 'array'], 'inspections.*.photo' => ['required', 'image', 'max:5120']]);
        foreach ($data['inspections'] as $id => &$inspection) {
            $inspection['photos'] = [$request->file("inspections.{$id}.photo")->store('return-inspections', 'public')];
        }
        $completed = $this->service->completeReturn($loan, $request->user(), $data['inspections']);

        return to_route('loans.show', $loan)->with('success', $completed
            ? 'Seluruh pengembalian selesai dan token telah dilepas.'
            : count($data['inspections']).' item berhasil dikembalikan. Item lainnya tetap aktif dan dapat dikembalikan kemudian.');
    }

    public function extend(Request $request, Loan $loan)
    {
        if ($request->user()->role === 'user') {
            abort_unless(($loan->borrower?->user_id ?? $loan->user_id) === $request->user()->id, 403);
        }
        abort_unless(in_array($loan->status, ['berjalan', 'terlambat', 'menunggu_inspeksi'], true), 422, 'Hanya pinjaman aktif yang dapat diperpanjang.');
        $data = $request->validate(['new_due_date' => ['required', 'date', 'after:'.$loan->due_date->toDateString()], 'reason' => ['required', 'string', 'min:5']]);
        $autoApprove = $loan->usage_type === 'dalam_area' && $request->user()->hasRole('petugas', 'kepala_logistik', 'admin');
        $extension = LoanExtension::create(['loan_id' => $loan->id, 'old_due_date' => $loan->due_date, 'new_due_date' => Carbon::parse($data['new_due_date'])->endOfDay(), 'reason' => $data['reason'], 'requested_by' => $request->user()->id, 'approved_by' => $autoApprove ? $request->user()->id : null, 'status' => $autoApprove ? 'disetujui' : 'menunggu_approval']);
        if ($autoApprove) {
            $loan->update(['due_date' => $extension->new_due_date, 'status' => $loan->status === 'terlambat' ? 'berjalan' : $loan->status]);
        }
        if (! $autoApprove) {
            foreach ($this->approvalConfiguration->approvers() as $approver) {
                SystemNotification::create(['user_id' => $approver->id, 'category' => 'perlu_tindakan', 'title' => "Perpanjangan {$loan->trx_no} menunggu persetujuan", 'description' => $data['reason'], 'object_type' => 'loan_extension', 'object_id' => $extension->id, 'href' => '/approval']);
            }
        }

        return back()->with('success', $autoApprove ? 'Tenggat berhasil diperpanjang.' : 'Permohonan perpanjangan menunggu persetujuan Kepala Logistik.');
    }

    public function approveExtension(Request $request, LoanExtension $extension)
    {
        abort_unless($extension->status === 'menunggu_approval', 422);
        $extension->update(['status' => 'disetujui', 'approved_by' => $request->user()->id]);
        $extension->loan()->update(['due_date' => $extension->new_due_date, 'status' => $extension->loan->status === 'terlambat' ? 'berjalan' : $extension->loan->status]);
        if ($extension->loan->user_id) {
            SystemNotification::create(['user_id' => $extension->loan->user_id, 'category' => 'informasi', 'title' => "Perpanjangan {$extension->loan->trx_no} disetujui", 'description' => 'Tenggat baru '.$extension->new_due_date->translatedFormat('d F Y').'.', 'object_type' => 'loan', 'object_id' => $extension->loan_id, 'href' => "/peminjaman/{$extension->loan_id}"]);
        }

        return back()->with('success', 'Perpanjangan disetujui.');
    }

    public function rejectExtension(Request $request, LoanExtension $extension)
    {
        $request->validate(['reason' => ['required', 'string', 'min:5']]);
        abort_unless($extension->status === 'menunggu_approval', 422);
        $extension->update(['status' => 'ditolak', 'reason' => $extension->reason.' | Alasan penolakan: '.$request->reason, 'approved_by' => $request->user()->id]);
        if ($extension->loan->user_id) {
            SystemNotification::create(['user_id' => $extension->loan->user_id, 'category' => 'informasi', 'title' => "Perpanjangan {$extension->loan->trx_no} ditolak", 'description' => $request->reason, 'object_type' => 'loan', 'object_id' => $extension->loan_id, 'href' => "/peminjaman/{$extension->loan_id}"]);
        }

        return back()->with('success', 'Perpanjangan ditolak.');
    }

    public function remind(Request $request, Loan $loan)
    {
        if ($loan->user_id) {
            SystemNotification::create(['user_id' => $loan->user_id, 'category' => 'perlu_tindakan', 'title' => "Pengingat pengembalian {$loan->trx_no}", 'description' => 'Segera kembalikan alat sebelum '.$loan->due_date->translatedFormat('d F Y').'.', 'object_type' => 'loan', 'object_id' => $loan->id, 'href' => "/peminjaman/{$loan->id}"]);
        }

        return back()->with('success', 'Pengingat telah dibuat.');
    }
}
