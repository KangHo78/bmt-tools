<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ResetOperationalData extends Command
{
    protected $signature = 'app:reset-operational-data
        {--force : Jalankan tanpa konfirmasi interaktif}
        {--delete-files : Hapus juga dokumen dan foto transaksi dari public storage}';

    protected $description = 'Hapus inventaris, master aset lokal, dan seluruh transaksi tanpa menghapus master pendukung atau data BMT Multi';

    /** @var list<string> */
    private array $transactionTables = [
        'loan_approvals',
        'loan_extensions',
        'loan_items',
        'asset_cases',
        'maintenance_orders',
        'stock_audit_items',
        'stock_audits',
        'location_movements',
        'loans',
        'tool_units',
        'asset_receipt_items',
        'asset_receipts',
        'notifications',
        'activity_logs',
        'tool_types',
    ];

    /** @var list<string> */
    private array $storageDirectories = [
        'asset-receipts',
        'case-evidence',
        'case-reports',
        'evidence',
        'handover',
        'loan-letters',
        'maintenance',
        'return-inspections',
    ];

    public function handle(): int
    {
        if ($this->laravel->environment('production') && ! $this->option('force')) {
            $this->error('Di production, command ini wajib dijalankan dengan opsi --force.');

            return self::FAILURE;
        }

        if (! $this->option('force') && ! $this->confirm(
            'Hapus seluruh inventaris, master aset lokal, dan transaksi? User, lokasi, kategori, checklist, token fisik, dan data BMT Multi tetap disimpan.',
        )) {
            $this->info('Reset dibatalkan.');

            return self::SUCCESS;
        }

        $counts = collect($this->transactionTables)
            ->mapWithKeys(fn (string $table) => [$table => DB::table($table)->count()]);

        DB::transaction(function (): void {
            foreach ($this->transactionTables as $table) {
                DB::table($table)->delete();
            }

            DB::table('physical_tokens')->update([
                'status' => 'dipegang_peminjam',
                'updated_at' => now(),
            ]);
            DB::table('users')->update([
                'token_used' => 0,
                'updated_at' => now(),
            ]);
        });

        if ($this->option('delete-files')) {
            foreach ($this->storageDirectories as $directory) {
                Storage::disk('public')->deleteDirectory($directory);
            }
        }

        $this->newLine();
        $this->info('Reset data operasional selesai.');
        $this->table(
            ['Data', 'Dihapus'],
            $counts->filter()->map(fn (int $count, string $table) => [$table, $count])->values()->all(),
        );
        $this->line('Dipertahankan: user, borrower, token fisik, kategori, checklist, lokasi, pengaturan, dan data BMT Multi.');

        if (! $this->option('delete-files')) {
            $this->warn('File unggahan lama dipertahankan. Gunakan --delete-files jika memang ingin menghapusnya.');
        }

        return self::SUCCESS;
    }
}
