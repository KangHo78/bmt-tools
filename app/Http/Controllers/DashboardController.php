<?php

namespace App\Http\Controllers;

use App\Models\AssetCase;
use App\Models\Loan;
use App\Models\LoanApproval;
use App\Models\MaintenanceOrder;
use App\Models\StockAudit;
use App\Models\ToolUnit;
use App\Support\ApprovalConfiguration;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __construct(private ApprovalConfiguration $approvalConfiguration) {}

    public function __invoke(Request $request)
    {
        $user = $request->user();
        $baseLoans = Loan::query()->with(['borrower:id,name,institution', 'items.toolType:id,name,code'])->latest();
        if ($user->role === 'user') {
            $baseLoans->where('user_id', $user->id);
        }

        $isLogisticsApprover = $this->approvalConfiguration->isApprover($user);
        $hasOwnerApprovalRole = filled($user->sso_user_id) && LoanApproval::query()
            ->where('type', 'owner')
            ->where('required_sso_user_id', $user->sso_user_id)
            ->exists();
        $pendingApprovals = collect();
        if ($isLogisticsApprover || $hasOwnerApprovalRole) {
            $pendingApprovals = LoanApproval::query()
                ->with([
                    'loan.borrower:id,name,institution',
                    'loan.items.toolType:id,name,code',
                ])
                ->where('status', 'menunggu')
                ->whereHas('loan', fn ($query) => $query->where('status', 'menunggu_approval'))
                ->where(function ($query) use ($user, $isLogisticsApprover) {
                    if (filled($user->sso_user_id)) {
                        $query->where(function ($ownerQuery) use ($user) {
                            $ownerQuery->where('type', 'owner')
                                ->where('required_sso_user_id', $user->sso_user_id);
                        });
                    }
                    if ($isLogisticsApprover) {
                        filled($user->sso_user_id)
                            ? $query->orWhere('type', 'logistik')
                            : $query->where('type', 'logistik');
                    }
                })
                ->latest()
                ->get();
        }

        return Inertia::render('Dashboard', [
            'metrics' => [
                'available_units' => ToolUnit::where('status', 'tersedia')->count(),
                'active_loans' => Loan::whereIn('status', ['berjalan', 'terlambat', 'menunggu_inspeksi'])->count(),
                'pending_approvals' => Loan::where('status', 'menunggu_approval')->whereHas('approvals', fn ($query) => $query->where('type', 'logistik')->where('status', 'menunggu'))->count(),
                'late_loans' => Loan::where('status', 'terlambat')->count(),
                'maintenance_due' => MaintenanceOrder::whereIn('status', ['berjalan', 'terlambat'])->count(),
                'open_cases' => AssetCase::where('stage', '!=', 'selesai')->count(),
            ],
            'loans' => $baseLoans->limit(6)->get(),
            'pendingApprovals' => $pendingApprovals,
            'showApprovalQueue' => $isLogisticsApprover || $hasOwnerApprovalRole,
            'maintenance' => MaintenanceOrder::with('unit.toolType')->latest()->limit(4)->get(),
            'audit' => StockAudit::where('status', 'berjalan')->first(),
        ]);
    }
}
