<?php

use App\Models\Loan;
use App\Models\MaintenanceOrder;
use App\Models\SystemNotification;
use App\Models\SystemSetting;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('loans:refresh-status', function () {
    $loans = Loan::whereIn('status', ['berjalan', 'menunggu_inspeksi'])->where('due_date', '<', now())->get();
    foreach ($loans as $loan) {
        $loan->update(['status' => 'terlambat']);
        SystemNotification::firstOrCreate([
            'user_id' => $loan->user_id, 'object_type' => 'loan', 'object_id' => $loan->id,
            'title' => "Peminjaman {$loan->trx_no} terlambat",
        ], ['category' => 'perlu_tindakan', 'description' => 'Segera konfirmasi pengembalian atau ajukan perpanjangan.', 'href' => "/peminjaman/{$loan->id}"]);
    }
    MaintenanceOrder::whereIn('status', ['dijadwalkan', 'berjalan'])->whereDate('scheduled_date', '<', today())->update(['status' => 'terlambat']);
    $this->info($loans->count().' pinjaman diperbarui menjadi terlambat.');
})->purpose('Perbarui pinjaman dan maintenance yang melewati tenggat');

Artisan::command('loans:send-reminders', function () {
    $reminderDays = max(1, (int) (SystemSetting::where('key', 'reminder_days_before_due')->value('value') ?? 2));
    $loans = Loan::whereIn('status', ['berjalan', 'menunggu_inspeksi'])->whereBetween('due_date', [now(), now()->addDays($reminderDays)])->get();
    foreach ($loans as $loan) {
        SystemNotification::firstOrCreate([
            'user_id' => $loan->user_id, 'object_type' => 'loan-reminder', 'object_id' => $loan->id,
            'title' => "Pengembalian {$loan->trx_no} segera jatuh tempo",
        ], ['category' => 'perlu_tindakan', 'description' => 'Tenggat pengembalian '.$loan->due_date->translatedFormat('d F Y').'.', 'href' => "/peminjaman/{$loan->id}"]);
    }
    $this->info($loans->count().' pengingat diproses.');
})->purpose('Kirim pengingat sebelum jatuh tempo sesuai pengaturan sistem');

Schedule::command('loans:refresh-status')->hourly();
Schedule::command('loans:send-reminders')->dailyAt('08:00');
