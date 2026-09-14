<?php

namespace App\Http\Controllers;

use App\Models\AssetCase;
use App\Models\Loan;
use App\Models\StockAudit;
use App\Models\ToolUnit;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;

class ReportController extends Controller
{
    private const ACTIVE_STATUSES = ['berjalan', 'terlambat', 'menunggu_inspeksi'];

    public function index()
    {
        $activeLoans = $this->activeLoans();

        return Inertia::render('Operations/Reports', [
            'counts' => [
                'assets' => ToolUnit::count(),
                'loans' => Loan::count(),
                'audits' => StockAudit::count(),
                'active_users' => $activeLoans->pluck('borrower_id')->unique()->count(),
                'borrowed_items' => $activeLoans->sum(fn (Loan $loan) => $loan->items->count()),
                'cases' => AssetCase::count(),
            ],
        ]);
    }

    public function assets()
    {
        return Inertia::render('Operations/ReportDetail', [
            'kind' => 'assets',
            'summary' => [
                'total' => ToolUnit::count(),
                'available' => ToolUnit::where('status', 'tersedia')->count(),
                'borrowed' => ToolUnit::where('status', 'dipinjam')->count(),
                'maintenance' => ToolUnit::where('status', 'perawatan')->count(),
                'lost_or_damaged' => ToolUnit::whereIn('status', ['rusak', 'hilang'])->count(),
            ],
            'byStatus' => ToolUnit::selectRaw('status, count(*) as total')->groupBy('status')->orderBy('status')->get(),
            'rows' => ToolUnit::with(['toolType:id,code,name', 'location:id,name'])->orderBy('asset_code')->get(),
        ]);
    }

    public function loans()
    {
        $rows = Loan::with(['borrower:id,name,institution', 'items:id,loan_id'])->latest('created_at')->get();

        return Inertia::render('Operations/ReportDetail', [
            'kind' => 'loans',
            'summary' => [
                'total' => $rows->count(),
                'active' => $rows->whereIn('status', self::ACTIVE_STATUSES)->count(),
                'overdue' => $rows->where('status', 'terlambat')->count(),
                'completed' => $rows->where('status', 'selesai')->count(),
            ],
            'byStatus' => $rows->countBy('status')->map(fn ($total, $status) => compact('status', 'total'))->values(),
            'monthlyLoans' => $rows->sortBy('created_at')->groupBy(fn (Loan $loan) => $loan->created_at->format('Y-m'))->map(fn ($items, $period) => ['period' => $period, 'total' => $items->count()])->values(),
            'rows' => $rows,
        ]);
    }

    public function audits()
    {
        $rows = StockAudit::orderByDesc('scheduled_date')->get();

        return Inertia::render('Operations/ReportDetail', [
            'kind' => 'audits',
            'summary' => [
                'total' => $rows->count(),
                'completed' => $rows->where('status', 'selesai')->count(),
                'in_progress' => $rows->where('status', 'berjalan')->count(),
                'units_checked' => $rows->sum('checked_units'),
            ],
            'rows' => $rows,
        ]);
    }

    public function activeUsers()
    {
        $rows = $this->activeUsage($this->activeLoans());

        return Inertia::render('Operations/ReportDetail', [
            'kind' => 'active-users',
            'summary' => [
                'users' => $rows->pluck('borrower.id')->filter()->unique()->count(),
                'transactions' => $rows->count(),
                'overdue' => $rows->where('status', 'terlambat')->count(),
                'units' => $rows->sum(fn ($row) => count($row['items'])),
            ],
            'rows' => $rows,
        ]);
    }

    public function borrowedItems()
    {
        $rows = $this->borrowedByItem($this->activeLoans());

        return Inertia::render('Operations/ReportDetail', [
            'kind' => 'borrowed-items',
            'summary' => [
                'types' => $rows->count(),
                'units' => $rows->sum('total_borrowed'),
                'overdue' => $rows->sum(fn ($row) => collect($row['units'])->where('status', 'terlambat')->count()),
            ],
            'rows' => $rows,
        ]);
    }

    public function cases()
    {
        $rows = AssetCase::with([
            'unit.toolType:id,code,name',
            'loan:id,trx_no',
            'responsibleUser:id,name,institution',
            'replacementUnit:id,asset_code',
        ])->latest('created_at')->get();

        return Inertia::render('Operations/ReportDetail', [
            'kind' => 'cases',
            'summary' => [
                'total' => $rows->count(),
                'open' => $rows->where('stage', '!=', 'selesai')->count(),
                'completed' => $rows->where('stage', 'selesai')->count(),
                'damaged' => $rows->where('type', 'rusak')->count(),
                'lost' => $rows->where('type', 'hilang')->count(),
            ],
            'rows' => $rows,
        ]);
    }

    public function export(Request $request, string $type)
    {
        abort_unless(in_array($type, ['assets', 'loans', 'audits', 'active-users', 'borrowed-items', 'cases'], true), 404);
        [$headers, $rows] = match ($type) {
            'assets' => [['Kode Aset', 'Jenis', 'Status', 'Kondisi', 'Lokasi', 'Owner'], ToolUnit::with(['toolType', 'location'])->get()->map(fn ($x) => [$x->asset_code, $x->toolType->name, $x->status, $x->condition, $x->location?->name, $x->owner])],
            'loans' => [['Transaksi', 'Peminjam', 'Area', 'Tujuan', 'Mulai', 'Tenggat', 'Status', 'Token'], Loan::with('borrower')->get()->map(fn ($x) => [$x->trx_no, $x->borrower->name, $x->usage_type, $x->purpose, $x->start_date, $x->due_date, $x->status, $x->tokens_used])],
            'audits' => [['Audit', 'Cakupan', 'Jadwal', 'Status', 'Diperiksa', 'Total', 'Catatan'], StockAudit::all()->map(fn ($x) => [$x->name, $x->scope, $x->scheduled_date, $x->status, $x->checked_units, $x->total_units, $x->reviewer_note])],
            'active-users' => [['Transaksi', 'Peminjam', 'Institusi', 'Area', 'Lokasi', 'Tenggat', 'Status', 'Jumlah Unit', 'Item Aktif'], Loan::query()
                ->whereIn('status', self::ACTIVE_STATUSES)
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
                ->whereIn('status', self::ACTIVE_STATUSES)
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
            'cases' => [['Nomor Kasus', 'Jenis', 'Tahap', 'Kode Unit', 'Nama Alat', 'Transaksi', 'Penanggung Jawab', 'Institusi', 'Penyelesaian', 'Bukti', 'Berita Acara', 'Keputusan', 'Tanggal Dibuat', 'Tanggal Ditutup'], AssetCase::with([
                'unit.toolType:id,name',
                'loan:id,trx_no',
                'responsibleUser:id,name,institution',
            ])->latest('created_at')->get()->map(fn ($case) => [
                $case->case_no,
                $case->type,
                $case->stage,
                $case->unit?->asset_code,
                $case->unit?->toolType?->name,
                $case->loan?->trx_no,
                $case->responsibleUser?->name,
                $case->responsibleUser?->institution,
                $case->resolution_status,
                $case->has_evidence ? 'Lengkap' : 'Belum',
                $case->has_berita_acara ? 'Lengkap' : 'Belum',
                $case->has_decision ? 'Lengkap' : 'Belum',
                $case->created_at,
                $case->closed_at,
            ])],
        };

        return response()->streamDownload(function () use ($headers, $rows) {
            $out = fopen('php://output', 'w');
            fputcsv($out, $headers);
            foreach ($rows as $row) {
                fputcsv($out, $row);
            } fclose($out);
        }, "tams-{$type}-".now()->format('Ymd').'.csv', ['Content-Type' => 'text/csv']);
    }

    private function activeLoans(): Collection
    {
        return Loan::query()
            ->whereIn('status', self::ACTIVE_STATUSES)
            ->whereHas('items', fn ($query) => $query->where('return_status', 'belum_dicek'))
            ->with([
                'borrower:id,name,institution',
                'items' => fn ($query) => $query->where('return_status', 'belum_dicek'),
                'items.toolType:id,code,name',
                'items.unit:id,asset_code',
            ])
            ->orderBy('due_date')
            ->get();
    }

    private function activeUsage(Collection $loans): Collection
    {
        return $loans->map(fn (Loan $loan) => [
            'id' => $loan->id,
            'trx_no' => $loan->trx_no,
            'borrower' => $loan->borrower?->only(['id', 'name', 'institution']),
            'usage_type' => $loan->usage_type,
            'location_text' => $loan->location_text,
            'due_date' => $loan->due_date,
            'status' => $loan->status,
            'items' => $loan->items->map(fn ($item) => [
                'id' => $item->id,
                'name' => $item->toolType->name,
                'code' => $item->toolType->code,
                'asset_code' => $item->unit?->asset_code,
            ])->values(),
        ])->values();
    }

    private function borrowedByItem(Collection $loans): Collection
    {
        return $loans->flatMap(fn (Loan $loan) => $loan->items->map(fn ($item) => [
            'tool_type_id' => $item->tool_type_id,
            'name' => $item->toolType->name,
            'code' => $item->toolType->code,
            'asset_code' => $item->unit?->asset_code,
            'loan_id' => $loan->id,
            'trx_no' => $loan->trx_no,
            'borrower_name' => $loan->borrower?->name,
            'due_date' => $loan->due_date,
            'status' => $loan->status,
        ]))->groupBy('tool_type_id')->map(fn ($items) => [
            'tool_type_id' => $items->first()['tool_type_id'],
            'name' => $items->first()['name'],
            'code' => $items->first()['code'],
            'total_borrowed' => $items->count(),
            'units' => $items->values(),
        ])->sortBy('name')->values();
    }
}
