<?php

namespace App\Http\Controllers;

use App\Models\Loan;
use App\Models\LoanExtension;
use App\Models\SsoUser;
use App\Models\SystemNotification;
use App\Models\ToolType;
use App\Models\User;
use App\Services\LoanService;
use App\Services\SsoUserSynchronizer;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class LoanController extends Controller
{
    public function __construct(
        private LoanService $service,
        private SsoUserSynchronizer $ssoSynchronizer,
    ) {}

    public function index(Request $request)
    {
        $query = Loan::with(['user:id,name,institution', 'items.toolType:id,name,code'])->latest();
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
            $borrowers = $borrowers->filter->is_active;
        }

        return Inertia::render('Loans/Create', [
            'tools' => ToolType::query()
                ->whereHas('units', fn ($query) => $query->where('status', 'tersedia'))
                ->withCount(['units as available_count' => fn ($query) => $query->where('status', 'tersedia')])
                ->orderBy('name')
                ->get(),
            'token' => ['used' => $request->user()->token_used, 'total' => $request->user()->token_quota],
            'preselected' => array_filter([(int) $request->query('tool')]),
            'canChooseBorrower' => $canChooseBorrower,
            'selectedBorrowerId' => $request->user()->id,
            'borrowers' => $borrowers->sortBy('name')->values()->map->only([
                'id', 'name', 'email', 'institution', 'role', 'token_used', 'token_quota',
            ]),
        ]);
    }

    public function store(Request $request)
    {
        $canChooseBorrower = $request->user()->hasRole('petugas', 'admin');
        $data = $request->validate([
            'tool_type_ids' => ['required', 'array', 'min:1'], 'tool_type_ids.*' => ['integer', 'distinct', 'exists:tool_types,id'],
            'usage_type' => ['required', Rule::in(['dalam_area', 'luar_area'])], 'purpose' => ['required', 'string', 'max:1000'],
            'location_text' => ['required', 'string', 'max:255'], 'start_date' => ['required', 'date', 'after_or_equal:today'],
            'due_date' => ['nullable', 'required_if:usage_type,luar_area', 'date', 'after_or_equal:start_date'],
            'letter' => ['nullable', 'required_if:usage_type,luar_area', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'borrower_id' => $canChooseBorrower
                ? ['required', 'integer', 'exists:users,id']
                : ['prohibited'],
        ]);
        $borrower = $request->user();

        if ($canChooseBorrower) {
            $borrower = User::query()->where('is_active', true)->findOrFail($data['borrower_id']);

            if (config('sso.enabled')) {
                $ssoUser = $borrower->sso_user_id
                    ? SsoUser::query()->whereKey($borrower->sso_user_id)->where('is_active', 1)->where('is_group', 0)->first()
                    : null;

                if (! $ssoUser?->managementRole()) {
                    throw ValidationException::withMessages([
                        'borrower_id' => 'Peminjam tidak lagi memiliki grup akses Tools Management.',
                    ]);
                }
            }
        }

        $loan = $this->service->create($borrower, $data, $request->file('letter'), $request->user());

        return to_route('loans.show', $loan)->with('success', $borrower->is($request->user())
            ? 'Permohonan berhasil dibuat.'
            : "Peminjaman atas nama {$borrower->name} berhasil dibuat.");
    }

    public function show(Request $request, Loan $loan)
    {
        if ($request->user()->role === 'user') {
            abort_unless($loan->user_id === $request->user()->id, 403);
        }
        $loan->load(['user:id,name,email,institution,phone,token_quota,token_used', 'approver:id,name', 'items.toolType', 'items.unit.location', 'extensions']);

        return Inertia::render('Loans/Show', ['loan' => $loan]);
    }

    public function approve(Request $request, Loan $loan)
    {
        $data = $request->validate(['due_date' => ['nullable', 'date', 'after_or_equal:today']]);
        $this->service->approve($loan, $request->user(), $data['due_date'] ?? null);

        return back()->with('success', 'Permohonan disetujui.');
    }

    public function reject(Request $request, Loan $loan)
    {
        $data = $request->validate(['reason' => ['required', 'string', 'min:5', 'max:1000']]);
        $this->service->reject($loan, $request->user(), $data['reason']);

        return back()->with('success', 'Permohonan ditolak dan token dilepas.');
    }

    public function handoverForm(Loan $loan)
    {
        $loan->load(['user:id,name,institution', 'items.toolType', 'items.unit']);

        return Inertia::render('Loans/Handover', ['loan' => $loan]);
    }

    public function handover(Request $request, Loan $loan)
    {
        $data = $request->validate(['unit_codes' => ['required', 'array'], 'unit_codes.*' => ['required', 'string'], 'confirm_staff' => ['accepted'], 'confirm_borrower' => ['accepted'], 'photo' => ['nullable', 'image', 'max:5120']]);
        $this->service->handover($loan, $request->user(), $data['unit_codes'], $request->file('photo'));

        return to_route('loans.show', $loan)->with('success', 'Serah terima berhasil diselesaikan.');
    }

    public function returnForm(Loan $loan)
    {
        $loan->load(['user:id,name,institution', 'items.toolType', 'items.unit']);

        return Inertia::render('Loans/Return', ['loan' => $loan]);
    }

    public function completeReturn(Request $request, Loan $loan)
    {
        $data = $request->validate(['inspections' => ['required', 'array'], 'inspections.*.status' => ['required', Rule::in(['sesuai', 'rusak', 'tidak_lengkap', 'hilang'])], 'inspections.*.note' => ['nullable', 'string', 'max:1000'], 'inspections.*.checklist' => ['required', 'array'], 'inspections.*.photo' => ['required', 'image', 'max:5120']]);
        foreach ($data['inspections'] as $id => &$inspection) {
            $inspection['photos'] = [$request->file("inspections.{$id}.photo")->store('return-inspections', 'public')];
        }
        $this->service->completeReturn($loan, $request->user(), $data['inspections']);

        return to_route('loans.show', $loan)->with('success', 'Pengembalian selesai dan token telah dilepas.');
    }

    public function extend(Request $request, Loan $loan)
    {
        if ($request->user()->role === 'user') {
            abort_unless($loan->user_id === $request->user()->id, 403);
        }
        abort_unless(in_array($loan->status, ['berjalan', 'terlambat', 'menunggu_inspeksi'], true), 422, 'Hanya pinjaman aktif yang dapat diperpanjang.');
        $data = $request->validate(['new_due_date' => ['required', 'date', 'after:'.$loan->due_date->toDateString()], 'reason' => ['required', 'string', 'min:5']]);
        $autoApprove = $loan->usage_type === 'dalam_area' && $request->user()->hasRole('petugas', 'kepala_logistik', 'admin');
        $extension = LoanExtension::create(['loan_id' => $loan->id, 'old_due_date' => $loan->due_date, 'new_due_date' => Carbon::parse($data['new_due_date'])->endOfDay(), 'reason' => $data['reason'], 'requested_by' => $request->user()->id, 'approved_by' => $autoApprove ? $request->user()->id : null, 'status' => $autoApprove ? 'disetujui' : 'menunggu_approval']);
        if ($autoApprove) {
            $loan->update(['due_date' => $extension->new_due_date, 'status' => $loan->status === 'terlambat' ? 'berjalan' : $loan->status]);
        }
        if (! $autoApprove) {
            foreach (User::whereIn('role', ['kepala_logistik', 'admin'])->where('is_active', true)->get() as $approver) {
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
        SystemNotification::create(['user_id' => $extension->loan->user_id, 'category' => 'informasi', 'title' => "Perpanjangan {$extension->loan->trx_no} disetujui", 'description' => 'Tenggat baru '.$extension->new_due_date->translatedFormat('d F Y').'.', 'object_type' => 'loan', 'object_id' => $extension->loan_id, 'href' => "/peminjaman/{$extension->loan_id}"]);

        return back()->with('success', 'Perpanjangan disetujui.');
    }

    public function rejectExtension(Request $request, LoanExtension $extension)
    {
        $request->validate(['reason' => ['required', 'string', 'min:5']]);
        abort_unless($extension->status === 'menunggu_approval', 422);
        $extension->update(['status' => 'ditolak', 'reason' => $extension->reason.' | Alasan penolakan: '.$request->reason, 'approved_by' => $request->user()->id]);
        SystemNotification::create(['user_id' => $extension->loan->user_id, 'category' => 'informasi', 'title' => "Perpanjangan {$extension->loan->trx_no} ditolak", 'description' => $request->reason, 'object_type' => 'loan', 'object_id' => $extension->loan_id, 'href' => "/peminjaman/{$extension->loan_id}"]);

        return back()->with('success', 'Perpanjangan ditolak.');
    }

    public function remind(Request $request, Loan $loan)
    {
        SystemNotification::create(['user_id' => $loan->user_id, 'category' => 'perlu_tindakan', 'title' => "Pengingat pengembalian {$loan->trx_no}", 'description' => 'Segera kembalikan alat sebelum '.$loan->due_date->translatedFormat('d F Y').'.', 'object_type' => 'loan', 'object_id' => $loan->id, 'href' => "/peminjaman/{$loan->id}"]);

        return back()->with('success', 'Pengingat telah dibuat.');
    }
}
