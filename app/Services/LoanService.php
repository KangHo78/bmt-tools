<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\AssetCase;
use App\Models\Borrower;
use App\Models\Loan;
use App\Models\LoanApproval;
use App\Models\PhysicalToken;
use App\Models\SsoUser;
use App\Models\SystemNotification;
use App\Models\ToolUnit;
use App\Models\User;
use App\Support\ApprovalConfiguration;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LoanService
{
    public function __construct(
        private ApprovalConfiguration $approvalConfiguration,
        private SsoUserSynchronizer $ssoSynchronizer,
    ) {}

    public function create(Borrower $borrower, array $data, ?UploadedFile $letter, User $createdBy, bool $allowTokenRegistration = false): Loan
    {
        return DB::transaction(function () use ($borrower, $data, $letter, $createdBy, $allowTokenRegistration) {
            $borrower = Borrower::query()->lockForUpdate()->findOrFail($borrower->id);
            $typeIds = array_values(array_unique($data['tool_type_ids']));
            $needed = count($typeIds);
            $tokenCodes = collect($data['token_codes'] ?? [])->map(fn ($code) => mb_strtoupper(trim((string) $code)));
            if ($tokenCodes->count() !== $needed || $tokenCodes->filter()->count() !== $needed) {
                throw ValidationException::withMessages(['token_codes' => 'Setiap alat wajib ditukar dengan satu kode token fisik.']);
            }
            if ($tokenCodes->unique()->count() !== $needed) {
                throw ValidationException::withMessages(['token_codes' => 'Satu token fisik tidak dapat digunakan untuk dua alat.']);
            }
            $reservedUnits = [];
            foreach ($typeIds as $typeId) {
                $unit = ToolUnit::query()->where('tool_type_id', $typeId)
                    ->where('status', 'tersedia')->whereNotNull('owner_sso_user_id')
                    ->orderBy('id')->lockForUpdate()->first();
                if (! $unit) {
                    throw ValidationException::withMessages(['tool_type_ids' => 'Salah satu jenis alat tidak memiliki unit tersedia dengan owner dari Buana Multi.']);
                }
                $reservedUnits[$typeId] = $unit;
            }

            $outside = $data['usage_type'] === 'luar_area';
            $due = $outside ? Carbon::parse($data['due_date'])->endOfDay() : $this->nearestFriday(Carbon::parse($data['start_date']));
            $loan = Loan::create([
                'trx_no' => $this->nextNumber(),
                'user_id' => $borrower->user_id,
                'borrower_id' => $borrower->id,
                'created_by' => $createdBy->id,
                'usage_type' => $data['usage_type'],
                'purpose' => $data['purpose'],
                'location_text' => $data['location_text'],
                'start_date' => Carbon::parse($data['start_date']),
                'due_date' => $due,
                'status' => 'menunggu_approval',
                'approved_by_id' => null,
                'approved_at' => null,
                'letter_url' => $letter?->store('loan-letters', 'public'),
                'tokens_used' => $needed,
            ]);
            foreach ($typeIds as $typeId) {
                $code = $tokenCodes->get((string) $typeId) ?? $tokenCodes->get($typeId);
                $token = PhysicalToken::query()->lockForUpdate()->where('code', $code)->first();
                if (! $token && $allowTokenRegistration) {
                    $token = PhysicalToken::create(['borrower_id' => $borrower->id, 'code' => $code, 'status' => 'dipegang_peminjam']);
                }
                if (! $token) {
                    throw ValidationException::withMessages(["token_codes.{$typeId}" => "Token {$code} belum terdaftar. Hubungi petugas."]);
                }
                if ($token->borrower_id !== $borrower->id) {
                    throw ValidationException::withMessages(["token_codes.{$typeId}" => "Token {$code} terdaftar atas nama peminjam lain."]);
                }
                if ($token->status !== 'dipegang_peminjam') {
                    throw ValidationException::withMessages(["token_codes.{$typeId}" => "Token {$code} sedang digunakan atau tidak aktif."]);
                }
                $unit = $reservedUnits[$typeId];
                $loan->items()->create(['tool_type_id' => $typeId, 'physical_token_id' => $token->id, 'unit_id' => $unit->id]);
                $token->update(['status' => 'direservasi']);
                $unit->update(['status' => 'direservasi']);
            }
            $ownerSsoIds = collect($reservedUnits)->pluck('owner_sso_user_id')->unique()->values();
            $ownerUsers = $this->ownerUsers($ownerSsoIds);
            if ($ownerUsers->count() !== $ownerSsoIds->count()) {
                throw ValidationException::withMessages(['tool_type_ids' => 'Salah satu owner item tidak lagi aktif atau tidak ditemukan di Buana Multi.']);
            }
            $ownerUsersBySsoId = $ownerUsers->keyBy('sso_user_id');
            foreach ($ownerSsoIds as $ownerSsoId) {
                $loan->approvals()->create(['type' => 'owner', 'required_sso_user_id' => $ownerSsoId, 'required_user_id' => $ownerUsersBySsoId[$ownerSsoId]->id, 'status' => 'menunggu']);
            }
            $loan->approvals()->create(['type' => 'logistik', 'status' => 'tertunda']);
            $borrower->user?->increment('token_used', $needed);
            $this->log($createdBy, 'loan.created', $loan, [
                'tokens' => $needed,
                'borrower_id' => $borrower->id,
                'created_on_behalf' => ! $borrower->user?->is($createdBy),
            ]);

            if ($borrower->user && ! $borrower->user->is($createdBy)) {
                $this->notify($loan, 'Peminjaman dibuat atas nama Anda', "{$createdBy->name} membuat {$loan->trx_no} untuk Anda.");
            }

            foreach ($ownerUsers as $owner) {
                $this->notifyApprover($loan, $owner, 'Persetujuan owner diperlukan', "{$borrower->name} mengajukan peminjaman aset milik Anda.");
            }

            return $loan;
        });
    }

    public function approve(Loan $loan, User $approver, ?string $dueDate = null): string
    {
        return DB::transaction(function () use ($loan, $approver, $dueDate) {
            $loan = Loan::query()->with('approvals')->lockForUpdate()->findOrFail($loan->id);
            abort_unless($loan->status === 'menunggu_approval', 422, 'Permohonan tidak lagi menunggu persetujuan.');
            $approval = $this->actionableApproval($loan, $approver);
            abort_unless($approval, 403, 'Anda tidak memiliki tahap approval yang aktif untuk permohonan ini.');
            $approval->update(['status' => 'disetujui', 'approved_by_id' => $approver->id, 'approved_at' => now()]);

            if ($approval->type === 'owner') {
                $this->log($approver, 'loan.owner_approved', $loan);
                if (! $loan->approvals()->where('type', 'owner')->where('status', 'menunggu')->exists()) {
                    $loan->approvals()->where('type', 'logistik')->where('status', 'tertunda')->update(['status' => 'menunggu']);
                    foreach ($this->approvalConfiguration->approvers() as $logisticsApprover) {
                        $this->notifyApprover($loan, $logisticsApprover, 'Persetujuan Kepala Logistik diperlukan', "Seluruh owner telah menyetujui {$loan->trx_no}.");
                    }
                }

                return 'owner';
            }

            $loan->update(['status' => 'disetujui', 'approved_by_id' => $approver->id, 'approved_at' => now(), 'due_date' => $dueDate ? Carbon::parse($dueDate)->endOfDay() : $loan->due_date]);
            $this->notify($loan, 'Permohonan disetujui', "{$loan->trx_no} telah disetujui owner dan Kepala Logistik, serta siap diproses untuk serah terima.");
            $this->log($approver, 'loan.logistics_approved', $loan);

            return 'logistik';
        });
    }

    public function reject(Loan $loan, User $approver, string $reason): void
    {
        DB::transaction(function () use ($loan, $approver, $reason) {
            $loan = Loan::query()->with('approvals')->lockForUpdate()->findOrFail($loan->id);
            abort_unless($loan->status === 'menunggu_approval', 422, 'Permohonan tidak lagi menunggu persetujuan.');
            $approval = $this->actionableApproval($loan, $approver);
            abort_unless($approval, 403, 'Anda tidak memiliki tahap approval yang aktif untuk permohonan ini.');
            $approval->update(['status' => 'ditolak', 'approved_by_id' => $approver->id, 'approved_at' => now(), 'rejection_reason' => $reason]);
            $loan->update(['status' => 'ditolak', 'approved_by_id' => $approver->id, 'rejection_reason' => $reason]);
            $this->releaseTokens($loan);
            $this->notify($loan, 'Permohonan ditolak', "{$loan->trx_no} ditolak. Alasan: {$reason}");
            $this->log($approver, 'loan.rejected', $loan, ['reason' => $reason, 'approval_type' => $approval->type]);
        });
    }

    public function canReviewApproval(Loan $loan, User $user): bool
    {
        if ($this->approvalConfiguration->isApprover($user)) {
            return true;
        }

        return filled($user->sso_user_id)
            && $loan->approvals()->where('type', 'owner')->where('required_sso_user_id', $user->sso_user_id)->exists();
    }

    public function actionableApproval(Loan $loan, User $user): ?LoanApproval
    {
        $loan->loadMissing('approvals');
        if (filled($user->sso_user_id)) {
            $ownerApproval = $loan->approvals->first(fn (LoanApproval $approval) => $approval->type === 'owner'
                && $approval->status === 'menunggu'
                && (int) $approval->required_sso_user_id === (int) $user->sso_user_id);
            if ($ownerApproval) {
                return $ownerApproval;
            }
        }
        $hasPendingOwner = $loan->approvals->contains(fn (LoanApproval $approval) => $approval->type === 'owner' && $approval->status === 'menunggu');
        if (! $hasPendingOwner && $this->approvalConfiguration->isApprover($user)) {
            return $loan->approvals->first(fn (LoanApproval $approval) => $approval->type === 'logistik' && $approval->status === 'menunggu');
        }

        return null;
    }

    public function handover(Loan $loan, User $staff, array $unitCodes, ?UploadedFile $photo): void
    {
        DB::transaction(function () use ($loan, $staff, $unitCodes, $photo) {
            abort_unless(in_array($loan->status, ['disetujui', 'menunggu_serah_terima'], true), 422, 'Peminjaman belum dapat diserahkan.');
            $loan->load(['items.toolType', 'items.physicalToken', 'items.unit']);
            if (count($unitCodes) !== $loan->items->count()) {
                throw ValidationException::withMessages(['unit_codes' => 'Semua item harus memiliki kode unit.']);
            }
            if (count($unitCodes) !== count(array_unique($unitCodes))) {
                throw ValidationException::withMessages(['unit_codes' => 'Kode unit tidak boleh duplikat.']);
            }
            foreach ($loan->items as $item) {
                $code = $unitCodes[$item->id] ?? null;
                $unit = ToolUnit::query()->lockForUpdate()->find($item->unit_id);
                if (! $unit || $unit->asset_code !== $code || $unit->tool_type_id !== $item->tool_type_id || $unit->status !== 'direservasi') {
                    throw ValidationException::withMessages(["unit_codes.{$item->id}" => "Unit {$code} bukan unit yang direservasi untuk permohonan ini."]);
                }
                $item->update(['unit_id' => $unit->id, 'condition_out' => $unit->condition, 'checklist' => array_fill_keys($item->toolType->checklist ?? [], true)]);
                $unit->update(['status' => 'dipinjam']);
                $item->physicalToken?->update(['status' => 'ditahan_tool_room']);
            }
            $loan->update(['status' => 'berjalan', 'handover_at' => now(), 'handover_photo_url' => $photo?->store('handover', 'public')]);
            $this->notify($loan, 'Serah terima selesai', "Alat {$loan->trx_no} telah diserahkan. Tenggat {$loan->due_date->translatedFormat('d F Y')}.");
            $this->log($staff, 'loan.handed_over', $loan);
        });
    }

    public function completeReturn(Loan $loan, User $staff, array $inspections): void
    {
        DB::transaction(function () use ($loan, $staff, $inspections) {
            abort_unless(in_array($loan->status, ['berjalan', 'terlambat', 'menunggu_inspeksi'], true), 422, 'Peminjaman tidak dapat dikembalikan pada status ini.');
            $loan->load('items.unit');
            foreach ($loan->items as $item) {
                $inspection = $inspections[$item->id] ?? null;
                if (! $inspection) {
                    throw ValidationException::withMessages(['inspections' => 'Seluruh unit wajib diperiksa.']);
                }
                $status = $inspection['status'];
                if ($status === 'sesuai' && collect($inspection['checklist'])->contains(fn ($checked) => ! (bool) $checked)) {
                    throw ValidationException::withMessages(['inspections' => 'Status Sesuai tidak dapat dipilih ketika ada kelengkapan yang tidak tersedia.']);
                }
                $item->update(['return_status' => $status, 'condition_in' => $status === 'sesuai' ? 'baik' : ($status === 'hilang' ? 'hilang' : 'rusak'), 'return_note' => $inspection['note'] ?? null, 'return_checklist' => $inspection['checklist'], 'photos_in' => $inspection['photos'] ?? []]);
                if ($item->unit) {
                    $item->unit->update(['status' => $status === 'sesuai' ? 'tersedia' : $status, 'condition' => $status === 'sesuai' ? 'baik' : ($status === 'tidak_lengkap' ? 'perlu_perhatian' : $status)]);
                }
                if (in_array($status, ['rusak', 'hilang'], true)) {
                    AssetCase::create(['case_no' => 'KSS-'.now()->format('Y').'-'.str_pad((string) (AssetCase::count() + 1), 3, '0', STR_PAD_LEFT), 'type' => $status, 'stage' => 'dilaporkan', 'unit_id' => $item->unit_id, 'loan_id' => $loan->id, 'responsible_user_id' => $loan->user_id, 'chronology' => $inspection['note'] ?: 'Temuan pada inspeksi pengembalian.', 'evidence_urls' => $inspection['photos'] ?? [], 'has_evidence' => ! empty($inspection['photos'])]);
                }
            }
            $loan->update(['status' => 'selesai', 'returned_at' => now()]);
            $this->releaseTokens($loan);
            $this->notify($loan, 'Pengembalian selesai', "Pengembalian {$loan->trx_no} telah diverifikasi dan token dilepas.");
            $this->log($staff, 'loan.returned', $loan);
        });
    }

    private function nearestFriday(Carbon $date): Carbon
    {
        $due = $date->copy()->endOfDay();

        return $due->isFriday() ? $due : $due->next(Carbon::FRIDAY)->endOfDay();
    }

    private function releaseTokens(Loan $loan): void
    {
        $loan->loadMissing(['items.physicalToken', 'items.unit']);
        foreach ($loan->items as $item) {
            $item->physicalToken?->update(['status' => 'dipegang_peminjam']);
            if ($item->unit?->status === 'direservasi') {
                $item->unit->update(['status' => 'tersedia']);
            }
        }
        if ($loan->user_id && ($user = User::query()->lockForUpdate()->find($loan->user_id))) {
            $user->update(['token_used' => max(0, $user->token_used - $loan->tokens_used)]);
        }
    }

    private function nextNumber(): string
    {
        return 'TRX-'.str_pad((string) ((int) Loan::query()->max('id') + 1043), 4, '0', STR_PAD_LEFT);
    }

    private function notify(Loan $loan, string $title, string $description): void
    {
        if (! $loan->user_id) {
            return;
        }
        SystemNotification::create(['user_id' => $loan->user_id, 'category' => 'informasi', 'title' => $title, 'description' => $description, 'object_type' => 'loan', 'object_id' => $loan->id, 'href' => "/peminjaman/{$loan->id}"]);
    }

    private function notifyApprover(Loan $loan, User $approver, string $title, string $description): void
    {
        SystemNotification::create(['user_id' => $approver->id, 'category' => 'perlu_tindakan', 'title' => $title, 'description' => $description, 'object_type' => 'loan', 'object_id' => $loan->id, 'href' => "/peminjaman/{$loan->id}"]);
    }

    private function ownerUsers($ownerSsoIds)
    {
        $users = User::query()->whereIn('sso_user_id', $ownerSsoIds)->get()->keyBy('sso_user_id');
        if (! config('sso.enabled')) {
            return $users->values();
        }
        $missingIds = $ownerSsoIds->reject(fn ($id) => $users->has($id));
        foreach (SsoUser::query()->whereIn('id', $missingIds)->where('is_active', 1)->where('is_group', 0)->get() as $ssoUser) {
            $user = $this->ssoSynchronizer->synchronize($ssoUser, $ssoUser->managementRole());
            $users->put($ssoUser->id, $user);
        }

        return $users->values();
    }

    private function log(User $user, string $action, Loan $loan, array $properties = []): void
    {
        ActivityLog::create(['user_id' => $user->id, 'action' => $action, 'subject_type' => Loan::class, 'subject_id' => $loan->id, 'properties' => $properties, 'ip_address' => request()->ip()]);
    }
}
