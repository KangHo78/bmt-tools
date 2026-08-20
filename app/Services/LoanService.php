<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\AssetCase;
use App\Models\Loan;
use App\Models\SystemNotification;
use App\Models\ToolUnit;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LoanService
{
    public function create(User $user, array $data, ?UploadedFile $letter): Loan
    {
        return DB::transaction(function () use ($user, $data, $letter) {
            $lockedUser = User::query()->lockForUpdate()->findOrFail($user->id);
            $typeIds = array_values(array_unique($data['tool_type_ids']));
            $needed = count($typeIds);
            if ($lockedUser->token_used + $needed > $lockedUser->token_quota) {
                throw ValidationException::withMessages(['tool_type_ids' => 'Token tidak cukup. Tersedia '.($lockedUser->token_quota - $lockedUser->token_used).' token.']);
            }
            foreach ($typeIds as $typeId) {
                if (! ToolUnit::query()->where('tool_type_id', $typeId)->where('status', 'tersedia')->exists()) {
                    throw ValidationException::withMessages(['tool_type_ids' => 'Salah satu jenis alat tidak memiliki unit tersedia.']);
                }
            }

            $outside = $data['usage_type'] === 'luar_area';
            $due = $outside ? Carbon::parse($data['due_date'])->endOfDay() : $this->nearestFriday(Carbon::parse($data['start_date']));
            $loan = Loan::create([
                'trx_no' => $this->nextNumber(),
                'user_id' => $lockedUser->id,
                'usage_type' => $data['usage_type'],
                'purpose' => $data['purpose'],
                'location_text' => $data['location_text'],
                'start_date' => Carbon::parse($data['start_date']),
                'due_date' => $due,
                'status' => $outside ? 'menunggu_approval' : 'disetujui',
                'letter_url' => $letter?->store('loan-letters', 'public'),
                'tokens_used' => $needed,
            ]);
            foreach ($typeIds as $typeId) {
                $loan->items()->create(['tool_type_id' => $typeId]);
            }
            $lockedUser->increment('token_used', $needed);
            $this->log($user, 'loan.created', $loan, ['tokens' => $needed]);

            return $loan;
        });
    }

    public function approve(Loan $loan, User $approver, ?string $dueDate = null): void
    {
        abort_unless($loan->status === 'menunggu_approval', 422, 'Permohonan tidak lagi menunggu persetujuan.');
        $loan->update(['status' => 'disetujui', 'approved_by_id' => $approver->id, 'approved_at' => now(), 'due_date' => $dueDate ? Carbon::parse($dueDate)->endOfDay() : $loan->due_date]);
        $this->notify($loan, 'Permohonan disetujui', "{$loan->trx_no} siap diproses untuk serah terima.");
        $this->log($approver, 'loan.approved', $loan);
    }

    public function reject(Loan $loan, User $approver, string $reason): void
    {
        DB::transaction(function () use ($loan, $approver, $reason) {
            abort_unless($loan->status === 'menunggu_approval', 422, 'Permohonan tidak lagi menunggu persetujuan.');
            $loan->update(['status' => 'ditolak', 'approved_by_id' => $approver->id, 'rejection_reason' => $reason]);
            $this->releaseTokens($loan);
            $this->notify($loan, 'Permohonan ditolak', "{$loan->trx_no} ditolak. Alasan: {$reason}");
            $this->log($approver, 'loan.rejected', $loan, ['reason' => $reason]);
        });
    }

    public function handover(Loan $loan, User $staff, array $unitCodes, ?UploadedFile $photo): void
    {
        DB::transaction(function () use ($loan, $staff, $unitCodes, $photo) {
            abort_unless(in_array($loan->status, ['disetujui', 'menunggu_serah_terima'], true), 422, 'Peminjaman belum dapat diserahkan.');
            $loan->load('items.toolType');
            if (count($unitCodes) !== $loan->items->count()) {
                throw ValidationException::withMessages(['unit_codes' => 'Semua item harus memiliki kode unit.']);
            }
            if (count($unitCodes) !== count(array_unique($unitCodes))) {
                throw ValidationException::withMessages(['unit_codes' => 'Kode unit tidak boleh duplikat.']);
            }
            foreach ($loan->items as $item) {
                $code = $unitCodes[$item->id] ?? null;
                $unit = ToolUnit::query()->lockForUpdate()->where('asset_code', $code)->first();
                if (! $unit || $unit->tool_type_id !== $item->tool_type_id || $unit->status !== 'tersedia') {
                    throw ValidationException::withMessages(["unit_codes.{$item->id}" => "Unit {$code} tidak sesuai atau tidak tersedia."]);
                }
                $item->update(['unit_id' => $unit->id, 'condition_out' => $unit->condition, 'checklist' => array_fill_keys($item->toolType->checklist ?? [], true)]);
                $unit->update(['status' => 'dipinjam']);
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
        $user = User::query()->lockForUpdate()->findOrFail($loan->user_id);
        $user->update(['token_used' => max(0, $user->token_used - $loan->tokens_used)]);
    }

    private function nextNumber(): string
    {
        return 'TRX-'.str_pad((string) ((int) Loan::query()->max('id') + 1043), 4, '0', STR_PAD_LEFT);
    }

    private function notify(Loan $loan, string $title, string $description): void
    {
        SystemNotification::create(['user_id' => $loan->user_id, 'category' => 'informasi', 'title' => $title, 'description' => $description, 'object_type' => 'loan', 'object_id' => $loan->id, 'href' => "/peminjaman/{$loan->id}"]);
    }

    private function log(User $user, string $action, Loan $loan, array $properties = []): void
    {
        ActivityLog::create(['user_id' => $user->id, 'action' => $action, 'subject_type' => Loan::class, 'subject_id' => $loan->id, 'properties' => $properties, 'ip_address' => request()->ip()]);
    }
}
