<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AssetCaseController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\LoanController;
use App\Http\Controllers\MaintenanceController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OperationsController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\StockAuditController;
use App\Http\Controllers\UploadController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => auth()->check() ? to_route('dashboard') : to_route('login'));

Route::get('/login', fn () => redirect()->away(config('sso.main_app_url')))
    ->name('login');

Route::post('/logout', function (Request $request) {
    Auth::guard('web')->logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();

    return redirect()->away(config('sso.main_app_url'));
})->name('logout');

Route::middleware(['auth', 'sso.group'])->group(function () {
    Route::get('/dashboard', DashboardController::class)->name('dashboard');
    Route::get('/katalog', [CatalogController::class, 'index'])->name('catalog.index');
    Route::get('/katalog/{toolType}', [CatalogController::class, 'show'])->name('catalog.show');
    Route::get('/peminjaman', [LoanController::class, 'index'])->name('loans.index');
    Route::get('/peminjaman/baru', [LoanController::class, 'create'])->name('loans.create');
    Route::post('/peminjaman', [LoanController::class, 'store'])->name('loans.store');
    Route::get('/peminjaman/{loan}', [LoanController::class, 'show'])->name('loans.show');
    Route::post('/peminjaman/{loan}/perpanjang', [LoanController::class, 'extend'])->name('loans.extend');
    Route::get('/notifikasi', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifikasi/baca-semua', [NotificationController::class, 'readAll'])->name('notifications.read-all');
    Route::post('/notifikasi/{notification}/baca', [NotificationController::class, 'read'])->name('notifications.read');

    Route::middleware('approver')->group(function () {
        Route::get('/approval', [OperationsController::class, 'approvals'])->name('approvals.index');
        Route::post('/peminjaman/{loan}/setujui', [LoanController::class, 'approve'])->name('loans.approve');
        Route::post('/peminjaman/{loan}/tolak', [LoanController::class, 'reject'])->name('loans.reject');
        Route::post('/perpanjangan/{extension}/setujui', [LoanController::class, 'approveExtension'])->name('extensions.approve');
        Route::post('/perpanjangan/{extension}/tolak', [LoanController::class, 'rejectExtension'])->name('extensions.reject');
    });

    Route::middleware('role:kepala_logistik,admin')->group(function () {
        Route::get('/laporan', [OperationsController::class, 'reports'])->name('reports.index');
        Route::get('/laporan/ekspor/{type}', [ReportController::class, 'export'])->name('reports.export');
    });

    Route::middleware('role:petugas,admin')->group(function () {
        Route::get('/serah-terima/{loan}', [LoanController::class, 'handoverForm'])->name('loans.handover.form');
        Route::post('/serah-terima/{loan}', [LoanController::class, 'handover'])->name('loans.handover');
        Route::get('/pengembalian', [OperationsController::class, 'returns'])->name('returns.index');
        Route::get('/pengembalian/{loan}', [LoanController::class, 'returnForm'])->name('loans.return.form');
        Route::post('/pengembalian/{loan}', [LoanController::class, 'completeReturn'])->name('loans.return');
        Route::get('/inventaris', [InventoryController::class, 'index'])->name('inventory.index');
        Route::get('/inventaris/penerimaan/baru', [InventoryController::class, 'create'])->name('inventory.receipts.create');
        Route::post('/inventaris/penerimaan', [InventoryController::class, 'store'])->name('inventory.receipts.store');
        Route::get('/inventaris/penerimaan/{receipt}', [InventoryController::class, 'showReceipt'])->name('inventory.receipts.show');
        Route::get('/inventaris/penerimaan/{receipt}/label', [InventoryController::class, 'labels'])->name('inventory.labels');
        Route::get('/katalog/{toolType}/label', [CatalogController::class, 'labels'])->name('catalog.labels');
        Route::post('/inventaris/unit/{unit}/pindah', [InventoryController::class, 'move'])->name('inventory.move');
        Route::get('/lokasi', [OperationsController::class, 'locations'])->name('locations.index');
        Route::get('/pemeliharaan', [MaintenanceController::class, 'index'])->name('maintenance.index');
        Route::post('/pemeliharaan', [MaintenanceController::class, 'store'])->name('maintenance.store');
        Route::post('/pemeliharaan/{maintenance}', [MaintenanceController::class, 'update'])->name('maintenance.update');
        Route::get('/audit', [StockAuditController::class, 'index'])->name('audits.index');
        Route::post('/audit', [StockAuditController::class, 'store'])->name('audits.store');
        Route::get('/audit/{audit}', [StockAuditController::class, 'show'])->name('audits.show');
        Route::post('/audit/{audit}/scan', [StockAuditController::class, 'scan'])->name('audits.scan');
        Route::post('/audit/{audit}/selesai', [StockAuditController::class, 'complete'])->name('audits.complete');
    });

    Route::middleware('role:petugas,kepala_logistik,admin')->group(function () {
        Route::get('/kasus', [AssetCaseController::class, 'index'])->name('cases.index');
        Route::get('/kasus/{case}', [AssetCaseController::class, 'show'])->name('cases.show');
        Route::post('/kasus/{case}', [AssetCaseController::class, 'update'])->name('cases.update');
        Route::post('/peminjaman/{loan}/ingatkan', [LoanController::class, 'remind'])->name('loans.remind');
    });

    Route::middleware('role:admin')->group(function () {
        Route::get('/administrasi', [AdminController::class, 'index'])->name('admin.index');
        Route::post('/administrasi/pengguna/{user}', [AdminController::class, 'updateUser'])->name('admin.users.update');
        Route::post('/administrasi/peminjam', [AdminController::class, 'storeBorrower'])->name('admin.borrowers.store');
        Route::post('/administrasi/peminjam/{borrower}/token', [AdminController::class, 'storeToken'])->name('admin.tokens.store');
        Route::post('/administrasi/token/{physicalToken}/pindah', [AdminController::class, 'transferToken'])->name('admin.tokens.transfer');
        Route::post('/administrasi/kategori', [AdminController::class, 'storeCategory'])->name('admin.categories.store');
        Route::put('/administrasi/kategori/{category}', [AdminController::class, 'updateCategory'])->name('admin.categories.update');
        Route::delete('/administrasi/kategori/{category}', [AdminController::class, 'destroyCategory'])->name('admin.categories.destroy');
        Route::post('/administrasi/checklist', [AdminController::class, 'storeChecklistItem'])->name('admin.checklists.store');
        Route::put('/administrasi/checklist/{checklistItem}', [AdminController::class, 'updateChecklistItem'])->name('admin.checklists.update');
        Route::delete('/administrasi/checklist/{checklistItem}', [AdminController::class, 'destroyChecklistItem'])->name('admin.checklists.destroy');
        Route::post('/administrasi/lokasi', [AdminController::class, 'storeLocation'])->name('admin.locations.store');
        Route::post('/administrasi/jenis-alat', [AdminController::class, 'storeToolType'])->name('admin.tool-types.store');
        Route::put('/administrasi/jenis-alat/{toolType}', [AdminController::class, 'updateToolType'])->name('admin.tool-types.update');
        Route::delete('/administrasi/jenis-alat/{toolType}', [AdminController::class, 'destroyToolType'])->name('admin.tool-types.destroy');
        Route::post('/administrasi/pengaturan', [AdminController::class, 'updateSettings'])->name('admin.settings.update');
        Route::post('/administrasi/approver', [AdminController::class, 'updateApprovers'])->name('admin.approvers.update');
    });
    Route::get('/api/search', [SearchController::class, 'search'])->name('search');
    Route::get('/api/scan', [SearchController::class, 'scan'])->name('scan');
    Route::get('/scan/{code}', [SearchController::class, 'openCode'])->name('scan.open');
    Route::post('/api/upload', UploadController::class)->name('upload');
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});
