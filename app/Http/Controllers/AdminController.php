<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Category;
use App\Models\Location;
use App\Models\SystemSetting;
use App\Models\ToolType;
use App\Models\User;
use App\Support\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AdminController extends Controller
{
    public function index()
    {
        return Inertia::render('Operations/Admin', [
            'users' => User::orderBy('name')->get(), 'activity' => ActivityLog::with('user:id,name')->latest()->limit(30)->get(),
            'categories' => Category::orderBy('name')->get(), 'locations' => Location::with('parent:id,name')->orderBy('name')->get(),
            'toolTypes' => ToolType::with(['category:id,name', 'primaryLocation:id,name'])->orderBy('name')->get(), 'settings' => SystemSetting::orderBy('key')->get(),
        ]);
    }

    public function storeUser(Request $request)
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:100'], 'email' => ['required', 'email', 'unique:users'], 'role' => ['required', Rule::in(['user', 'petugas', 'kepala_logistik', 'admin'])], 'institution' => ['nullable', 'string'], 'phone' => ['nullable', 'string'], 'token_quota' => ['required', 'integer', 'min:1', 'max:50'], 'password' => ['required', 'string', 'min:8']]);
        $user = User::create([...$data, 'password' => Hash::make($data['password']), 'is_active' => true]);
        AuditLogger::record('user.created', $user);

        return back()->with('success', 'Pengguna berhasil dibuat.');
    }

    public function updateUser(Request $request, User $user)
    {
        $data = $request->validate(['role' => ['required', Rule::in(['user', 'petugas', 'kepala_logistik', 'admin'])], 'institution' => ['nullable', 'string'], 'token_quota' => ['required', 'integer', 'min:1', 'max:50', 'gte:'.$user->token_used], 'is_active' => ['required', 'boolean'], 'reason' => ['required', 'string', 'min:5']]);
        if ($user->is($request->user()) && ! $data['is_active']) {
            return back()->withErrors(['is_active' => 'Administrator tidak dapat menonaktifkan akunnya sendiri.']);
        }
        $reason = $data['reason'];
        unset($data['reason']);
        $before = $user->only(['role', 'institution', 'token_quota', 'is_active']);
        $user->update($data);
        AuditLogger::record('user.updated', $user, ['before' => $before, 'after' => $data, 'reason' => $reason]);

        return back()->with('success', 'Akses pengguna berhasil diperbarui.');
    }

    public function storeCategory(Request $request)
    {
        $model = Category::create($request->validate(['name' => ['required', 'string', 'unique:categories'], 'function' => ['nullable', 'string']]));
        AuditLogger::record('category.created', $model);

        return back()->with('success', 'Kategori ditambahkan.');
    }

    public function storeLocation(Request $request)
    {
        $model = Location::create($request->validate(['name' => ['required', 'string'], 'type' => ['required', Rule::in(['area', 'ruang', 'rak', 'slot'])], 'parent_id' => ['nullable', 'exists:locations,id'], 'capacity' => ['nullable', 'integer', 'min:1']]));
        AuditLogger::record('location.created', $model);

        return back()->with('success', 'Lokasi ditambahkan.');
    }

    public function storeToolType(Request $request)
    {
        $data = $request->validate(['code' => ['required', 'string', 'max:20', 'unique:tool_types'], 'name' => ['required', 'string'], 'category_id' => ['required', 'exists:categories,id'], 'primary_location_id' => ['required', 'exists:locations,id'], 'size' => ['nullable', 'string'], 'description' => ['nullable', 'string'], 'rules_summary' => ['nullable', 'string'], 'checklist_text' => ['required', 'string']]);
        $data['checklist'] = array_values(array_filter(array_map('trim', preg_split('/\r\n|\r|\n/', $data['checklist_text']))));
        unset($data['checklist_text']);
        $model = ToolType::create($data);
        AuditLogger::record('tool_type.created', $model);

        return back()->with('success', 'Jenis alat ditambahkan.');
    }

    public function updateSettings(Request $request)
    {
        $data = $request->validate(['settings' => ['required', 'array'], 'settings.*' => ['nullable', 'string'], 'reason' => ['required', 'string', 'min:5']]);
        foreach ($data['settings'] as $key => $value) {
            SystemSetting::updateOrCreate(['key' => $key], ['value' => $value]);
        } AuditLogger::record('settings.updated', SystemSetting::firstOrFail(), ['keys' => array_keys($data['settings']), 'reason' => $data['reason']]);

        return back()->with('success', 'Konfigurasi sistem diperbarui.');
    }
}
