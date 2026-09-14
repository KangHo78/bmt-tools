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
        ])->whereIn('status', ['berjalan', 'terlambat', 'menunggu_inspeksi'])
            ->whereHas('items', fn ($query) => $query->where('return_status', 'belum_dicek'))
            ->orderBy('due_date')->get()]);
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

    public function admin()
    {
        return Inertia::render('Operations/Admin', ['users' => User::orderBy('name')->get(['id', 'name', 'email', 'role', 'institution', 'token_quota', 'token_used']), 'activity' => ActivityLog::with('user:id,name')->latest()->limit(20)->get()]);
    }
}
