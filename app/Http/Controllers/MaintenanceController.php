<?php

namespace App\Http\Controllers;

use App\Models\MaintenanceOrder;
use App\Models\ToolUnit;
use App\Support\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class MaintenanceController extends Controller
{
    public function index()
    {
        return Inertia::render('Maintenance/Index', ['orders' => MaintenanceOrder::with('unit.toolType')->orderBy('scheduled_date')->get(), 'units' => ToolUnit::with('toolType:id,name,code')->whereNotIn('status', ['hilang', 'dihapuskan'])->orderBy('asset_code')->get()]);
    }

    public function store(Request $request)
    {
        $data = $request->validate(['unit_id' => ['required', 'exists:tool_units,id'], 'type' => ['required', Rule::in(['pembersihan', 'inspeksi', 'kalibrasi', 'servis', 'perbaikan'])], 'action' => ['required', 'string', 'max:500'], 'technician' => ['nullable', 'string'], 'vendor' => ['nullable', 'string'], 'scheduled_date' => ['required', 'date'], 'notes' => ['nullable', 'string']]);
        $order = MaintenanceOrder::create([...$data, 'work_order_no' => 'WO-'.now()->format('Y').'-'.str_pad((string) (MaintenanceOrder::count() + 1), 4, '0', STR_PAD_LEFT), 'status' => 'dijadwalkan']);
        $order->unit()->update(['status' => 'perawatan']);
        AuditLogger::record('maintenance.created', $order);

        return back()->with('success', 'Work order berhasil dijadwalkan.');
    }

    public function update(Request $request, MaintenanceOrder $maintenance)
    {
        $data = $request->validate(['status' => ['required', Rule::in(['dijadwalkan', 'berjalan', 'selesai', 'terlambat'])], 'cost' => ['nullable', 'numeric', 'min:0'], 'notes' => ['nullable', 'string'], 'next_schedule_date' => ['nullable', 'date'], 'after_photo' => ['nullable', 'image', 'max:5120']]);
        if ($request->hasFile('after_photo')) {
            $data['after_photo_url'] = $request->file('after_photo')->store('maintenance', 'public');
        }
        if ($data['status'] === 'selesai') {
            $data['completed_date'] = now();
        }
        $maintenance->update($data);
        $maintenance->unit()->update(['status' => $data['status'] === 'selesai' ? 'tersedia' : 'perawatan', 'condition' => $data['status'] === 'selesai' ? 'baik' : $maintenance->unit->condition]);
        AuditLogger::record('maintenance.updated', $maintenance, ['status' => $data['status']]);

        return back()->with('success', 'Work order berhasil diperbarui.');
    }
}
