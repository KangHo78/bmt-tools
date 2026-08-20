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
        abort_unless(in_array($type, ['assets', 'loans', 'audits'], true), 404);
        [$headers, $rows] = match ($type) {
            'assets' => [['Kode Aset', 'Jenis', 'Status', 'Kondisi', 'Lokasi', 'Owner'], ToolUnit::with(['toolType', 'location'])->get()->map(fn ($x) => [$x->asset_code, $x->toolType->name, $x->status, $x->condition, $x->location?->name, $x->owner])],
            'loans' => [['Transaksi', 'Peminjam', 'Area', 'Tujuan', 'Mulai', 'Tenggat', 'Status', 'Token'], Loan::with('borrower')->get()->map(fn ($x) => [$x->trx_no, $x->borrower->name, $x->usage_type, $x->purpose, $x->start_date, $x->due_date, $x->status, $x->tokens_used])],
            'audits' => [['Audit', 'Cakupan', 'Jadwal', 'Status', 'Diperiksa', 'Total', 'Catatan'], StockAudit::all()->map(fn ($x) => [$x->name, $x->scope, $x->scheduled_date, $x->status, $x->checked_units, $x->total_units, $x->reviewer_note])],
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
