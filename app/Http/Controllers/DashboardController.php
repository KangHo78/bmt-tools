<?php

namespace App\Http\Controllers;

use App\Models\AssetCase;
use App\Models\Loan;
use App\Models\MaintenanceOrder;
use App\Models\StockAudit;
use App\Models\ToolUnit;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        $user = $request->user();
        $baseLoans = Loan::query()->with(['borrower:id,name,institution', 'items.toolType:id,name,code'])->latest();
        if ($user->role === 'user') {
            $baseLoans->where('user_id', $user->id);
        }

        return Inertia::render('Dashboard', [
            'metrics' => [
                'available_units' => ToolUnit::where('status', 'tersedia')->count(),
                'active_loans' => Loan::whereIn('status', ['berjalan', 'terlambat', 'menunggu_inspeksi'])->count(),
                'pending_approvals' => Loan::where('status', 'menunggu_approval')->count(),
                'late_loans' => Loan::where('status', 'terlambat')->count(),
                'maintenance_due' => MaintenanceOrder::whereIn('status', ['berjalan', 'terlambat'])->count(),
                'open_cases' => AssetCase::where('stage', '!=', 'selesai')->count(),
            ],
            'loans' => $baseLoans->limit(6)->get(),
            'maintenance' => MaintenanceOrder::with('unit.toolType')->latest()->limit(4)->get(),
            'audit' => StockAudit::where('status', 'berjalan')->first(),
        ]);
    }
}
