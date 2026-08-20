<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\AssetCase;
use App\Models\Borrower;
use App\Models\Loan;
use App\Models\PhysicalToken;
use App\Models\SystemNotification;
use App\Models\ToolUnit;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LoanService
{
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
            foreach ($typeIds as $typeId) {
                if (! ToolUnit::query()->where('tool_type_id', $typeId)->where('status', 'tersedia')->exists()) {
                    throw ValidationException::withMessages(['tool_type_ids' => 'Salah satu jenis alat tidak memiliki unit tersedia.']);
                }
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
                'status' => $outside ? 'menunggu_approval' : 'disetujui',
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
                $loan->items()->create(['tool_type_id' => $typeId, 'physical_token_id' => $token->id]);
                $token->update(['status' => 'direservasi']);
            }
            $borrower->user?->increment('token_used', $needed);
            $this->log($createdBy, 'loan.created', $loan, [
                'tokens' => $needed,
                'borrower_id' => $borrower->id,
                'created_on_behalf' => ! $borrower->user?->is($createdBy),
            ]);

            if ($borrower->user && ! $borrower->user->is($createdBy)) {
                $this->notify($loan, 'Peminjaman dibuat atas nama Anda', "{$createdBy->name} membuat {$loan->trx_no} untuk Anda.");
            }

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
            $loan->load(['items.toolType', 'items.physicalToken']);
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
        $loan->loadMissing('items.physicalToken');
        foreach ($loan->items as $item) {
            $item->physicalToken?->update(['status' => 'dipegang_peminjam']);
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

    private function log(User $user, string $action, Loan $loan, array $properties = []): void
    {
        ActivityLog::create(['user_id' => $user->id, 'action' => $action, 'subject_type' => Loan::class, 'subject_id' => $loan->id, 'properties' => $properties, 'ip_address' => request()->ip()]);
    }
}
