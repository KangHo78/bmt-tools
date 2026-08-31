<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\AssetCase;
use App\Models\Loan;
use App\Models\LoanExtension;
use App\Models\Location;
use App\Models\MaintenanceOrder;
use App\Models\StockAudit;
use App\Models\ToolUnit;
use App\Models\User;
use Inertia\Inertia;

class OperationsController extends Controller
{
    public function approvals()
    {
        return Inertia::render('Operations/Approvals', ['loans' => Loan::with(['borrower:id,name,institution', 'items.toolType:id,name,code'])->where('status', 'menunggu_approval')->whereHas('approvals', fn ($query) => $query->where('type', 'logistik')->where('status', 'menunggu'))->latest()->get(), 'extensions' => LoanExtension::with(['loan.borrower:id,name,institution', 'requester:id,name'])->where('status', 'menunggu_approval')->latest()->get()]);
    }

    public function returns()
    {
        return Inertia::render('Operations/Returns', ['loans' => Loan::with([
            'borrower:id,name,institution',
            'items' => fn ($query) => $query->where('return_status', 'belum_dicek'),
            'items.toolType:id,name,code',
        ])->whereIn('status', ['berjalan', 'terlambat', 'menunggu_inspeksi'])->orderBy('due_date')->get()]);
    }

    public function inventory()
    {
        return Inertia::render('Operations/Registry', ['kind' => 'inventory', 'title' => 'Inventaris', 'subtitle' => 'Passport seluruh unit aset dan posisi terakhir.', 'rows' => ToolUnit::with(['toolType:id,name,code', 'location:id,name'])->orderBy('asset_code')->get()]);
    }

    public function locations()
    {
        return Inertia::render('Operations/Registry', ['kind' => 'locations', 'title' => 'Lokasi Penyimpanan', 'subtitle' => 'Kapasitas ruang, rak, dan slot tool room.', 'rows' => Location::withCount('units')->with('parent:id,name')->orderBy('name')->get()]);
    }

    public function maintenance()
    {
        return Inertia::render('Operations/Registry', ['kind' => 'maintenance', 'title' => 'Pemeliharaan', 'subtitle' => 'Jadwal servis, kalibrasi, dan pekerjaan tertunda.', 'rows' => MaintenanceOrder::with('unit.toolType')->orderBy('scheduled_date')->get()]);
    }

    public function audits()
    {
        return Inertia::render('Operations/Registry', ['kind' => 'audits', 'title' => 'Audit Stok', 'subtitle' => 'Stock opname bulanan dan progres rekonsiliasi.', 'rows' => StockAudit::orderByDesc('scheduled_date')->get()]);
    }

    public function cases()
    {
        return Inertia::render('Operations/Registry', ['kind' => 'cases', 'title' => 'Kasus Kerusakan & Kehilangan', 'subtitle' => 'Berita acara dan pertanggungjawaban aset.', 'rows' => AssetCase::with(['unit.toolType', 'responsibleUser:id,name,institution'])->latest()->get()]);
    }

    public function reports()
    {
        $monthly = Loan::orderBy('created_at')->get(['created_at'])->groupBy(fn ($loan) => $loan->created_at->format('Y-m'))->map(fn ($rows, $period) => ['period' => $period, 'total' => $rows->count()])->values();

        $activeLoans = Loan::query()
            ->whereIn('status', ['berjalan', 'terlambat', 'menunggu_inspeksi'])
            ->whereHas('items', fn ($query) => $query->where('return_status', 'belum_dicek'))
            ->with([
                'borrower:id,name,institution',
                'items' => fn ($query) => $query->where('return_status', 'belum_dicek'),
                'items.toolType:id,code,name',
                'items.unit:id,asset_code',
            ])
            ->orderBy('due_date')
            ->get();

        $activeUsage = $activeLoans->map(fn (Loan $loan) => [
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

        $borrowedByItem = $activeLoans->flatMap(fn (Loan $loan) => $loan->items->map(fn ($item) => [
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

        return Inertia::render('Operations/Reports', [
            'summary' => [
                'total' => ToolUnit::count(),
                'available' => ToolUnit::where('status', 'tersedia')->count(),
                'borrowed' => ToolUnit::where('status', 'dipinjam')->count(),
                'maintenance' => ToolUnit::where('status', 'perawatan')->count(),
                'lost_or_damaged' => ToolUnit::whereIn('status', ['rusak', 'hilang'])->count(),
                'active_users' => $activeLoans->pluck('borrower_id')->unique()->count(),
            ],
            'byStatus' => ToolUnit::selectRaw('status, count(*) as total')->groupBy('status')->get(),
            'monthlyLoans' => $monthly,
            'activeUsage' => $activeUsage,
            'borrowedByItem' => $borrowedByItem,
        ]);
    }

    public function admin()
    {
        return Inertia::render('Operations/Admin', ['users' => User::orderBy('name')->get(['id', 'name', 'email', 'role', 'institution', 'token_quota', 'token_used']), 'activity' => ActivityLog::with('user:id,name')->latest()->limit(20)->get()]);
    }
}
