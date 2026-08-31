<?php

namespace App\Http\Controllers;

use App\Models\Loan;
use App\Models\StockAudit;
use App\Models\ToolUnit;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function export(Request $request, string $type)
    {
        abort_unless(in_array($type, ['assets', 'loans', 'audits', 'active-users', 'borrowed-items'], true), 404);
        $activeStatuses = ['berjalan', 'terlambat', 'menunggu_inspeksi'];
        [$headers, $rows] = match ($type) {
            'assets' => [['Kode Aset', 'Jenis', 'Status', 'Kondisi', 'Lokasi', 'Owner'], ToolUnit::with(['toolType', 'location'])->get()->map(fn ($x) => [$x->asset_code, $x->toolType->name, $x->status, $x->condition, $x->location?->name, $x->owner])],
            'loans' => [['Transaksi', 'Peminjam', 'Area', 'Tujuan', 'Mulai', 'Tenggat', 'Status', 'Token'], Loan::with('borrower')->get()->map(fn ($x) => [$x->trx_no, $x->borrower->name, $x->usage_type, $x->purpose, $x->start_date, $x->due_date, $x->status, $x->tokens_used])],
            'audits' => [['Audit', 'Cakupan', 'Jadwal', 'Status', 'Diperiksa', 'Total', 'Catatan'], StockAudit::all()->map(fn ($x) => [$x->name, $x->scope, $x->scheduled_date, $x->status, $x->checked_units, $x->total_units, $x->reviewer_note])],
            'active-users' => [['Transaksi', 'Peminjam', 'Institusi', 'Area', 'Lokasi', 'Tenggat', 'Status', 'Jumlah Unit', 'Item Aktif'], Loan::query()
                ->whereIn('status', $activeStatuses)
                ->with([
                    'borrower:id,name,institution',
                    'items' => fn ($query) => $query->where('return_status', 'belum_dicek'),
                    'items.toolType:id,code,name',
                    'items.unit:id,asset_code',
                ])
                ->whereHas('items', fn ($query) => $query->where('return_status', 'belum_dicek'))
                ->orderBy('due_date')->get()->map(fn ($loan) => [
                    $loan->trx_no,
                    $loan->borrower?->name,
                    $loan->borrower?->institution,
                    $loan->usage_type,
                    $loan->location_text,
                    $loan->due_date,
                    $loan->status,
                    $loan->items->count(),
                    $loan->items->map(fn ($item) => "{$item->toolType->code} - {$item->toolType->name} ({$item->unit?->asset_code})")->join('; '),
                ])],
            'borrowed-items' => [['Kode Item', 'Nama Item', 'Kode Unit', 'Transaksi', 'Peminjam', 'Tenggat', 'Status'], Loan::query()
                ->whereIn('status', $activeStatuses)
                ->with([
                    'borrower:id,name',
                    'items' => fn ($query) => $query->where('return_status', 'belum_dicek'),
                    'items.toolType:id,code,name',
                    'items.unit:id,asset_code',
                ])
                ->whereHas('items', fn ($query) => $query->where('return_status', 'belum_dicek'))
                ->orderBy('due_date')->get()->flatMap(fn ($loan) => $loan->items->map(fn ($item) => [
                    $item->toolType->code,
                    $item->toolType->name,
                    $item->unit?->asset_code,
                    $loan->trx_no,
                    $loan->borrower?->name,
                    $loan->due_date,
                    $loan->status,
                ]))],
        };

        return response()->streamDownload(function () use ($headers, $rows) {
            $out = fopen('php://output', 'w');
            fputcsv($out, $headers);
            foreach ($rows as $row) {
                fputcsv($out, $row);
            } fclose($out);
        }, "tams-{$type}-".now()->format('Ymd').'.csv', ['Content-Type' => 'text/csv']);
    }
}
