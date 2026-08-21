<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Borrower;
use App\Models\Category;
use App\Models\Location;
use App\Models\PhysicalToken;
use App\Models\SystemSetting;
use App\Models\ToolType;
use App\Models\User;
use App\Support\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AdminController extends Controller
{
    public function index()
    {
        return Inertia::render('Operations/Admin', [
            'users' => User::orderBy('name')->get(), 'activity' => ActivityLog::with('user:id,name')->latest()->limit(30)->get(),
            'borrowers' => Borrower::with(['user:id,email', 'tokens' => fn ($query) => $query->orderBy('code')])->orderBy('name')->get(),
            'categories' => Category::orderBy('name')->get(), 'locations' => Location::withCount('units')->with('parent:id,name')->orderBy('name')->get(),
            'toolTypes' => ToolType::with(['category:id,name', 'primaryLocation:id,name'])->orderBy('name')->get(), 'settings' => SystemSetting::orderBy('key')->get(),
        ]);
    }

    public function storeBorrower(Request $request)
    {
        $borrower = Borrower::create($request->validate([
            'name' => ['required', 'string', 'max:255'], 'identifier' => ['nullable', 'string', 'max:100'],
            'institution' => ['nullable', 'string', 'max:255'], 'phone' => ['nullable', 'string', 'max:50'],
        ]));
        AuditLogger::record('borrower.created', $borrower);

        return back()->with('success', 'Profil peminjam tanpa akun ditambahkan.');
    }

    public function storeToken(Request $request, Borrower $borrower)
    {
        $request->merge(['code' => mb_strtoupper(trim((string) $request->input('code')))]);
        $data = $request->validate(['code' => ['required', 'string', 'max:100']]);
        $codes = $this->expandTokenCodes($data['code']);
        $duplicates = PhysicalToken::query()->whereIn('code', $codes)->pluck('code');

        if ($duplicates->isNotEmpty()) {
            throw ValidationException::withMessages(['code' => 'Kode sudah terdaftar: '.$duplicates->join(', ')]);
        }

        DB::transaction(function () use ($borrower, $codes) {
            foreach ($codes as $code) {
                $token = PhysicalToken::create(['borrower_id' => $borrower->id, 'code' => $code, 'status' => 'dipegang_peminjam']);
                AuditLogger::record('physical_token.created', $token, ['borrower_id' => $borrower->id, 'batch_size' => count($codes)]);
            }
        });

        return back()->with('success', count($codes).' token berhasil didaftarkan untuk '.$borrower->name.'.');
    }

    public function transferToken(Request $request, PhysicalToken $physicalToken)
    {
        $data = $request->validate([
            'borrower_id' => ['required', 'integer', Rule::exists('borrowers', 'id')->where('is_active', true), Rule::notIn([$physicalToken->borrower_id])],
            'reason' => ['required', 'string', 'min:3', 'max:500'],
        ]);

        DB::transaction(function () use ($physicalToken, $data) {
            $token = PhysicalToken::query()->lockForUpdate()->findOrFail($physicalToken->id);
            if ($token->status !== 'dipegang_peminjam') {
                throw ValidationException::withMessages(['token' => 'Token sedang digunakan dan belum dapat dipindahkan.']);
            }
            if ($token->borrower_id === (int) $data['borrower_id']) {
                throw ValidationException::withMessages(['borrower_id' => 'Pemilik baru harus berbeda dari pemilik saat ini.']);
            }

            $before = $token->borrower_id;
            $token->update(['borrower_id' => $data['borrower_id']]);
            AuditLogger::record('physical_token.transferred', $token, [
                'from_borrower_id' => $before, 'to_borrower_id' => $data['borrower_id'], 'reason' => $data['reason'],
            ]);
        });

        return back()->with('success', "Token {$physicalToken->code} berhasil dipindahkan.");
    }

    public function updateUser(Request $request, User $user)
    {
        $data = $request->validate(['institution' => ['nullable', 'string'], 'is_active' => ['required', 'boolean'], 'reason' => ['required', 'string', 'min:5']]);
        if ($user->is($request->user()) && ! $data['is_active']) {
            return back()->withErrors(['is_active' => 'Administrator tidak dapat menonaktifkan akunnya sendiri.']);
        }
        $reason = $data['reason'];
        unset($data['reason']);
        $before = $user->only(['institution', 'is_active']);
        $user->update($data);
        AuditLogger::record('user.updated', $user, ['before' => $before, 'after' => $data, 'reason' => $reason]);

        return back()->with('success', 'Profil aplikasi pengguna berhasil diperbarui.');
    }

    public function storeCategory(Request $request)
    {
        $model = Category::create($this->categoryData($request));
        AuditLogger::record('category.created', $model);

        return back()->with('success', 'Kategori ditambahkan.');
    }

    public function updateCategory(Request $request, Category $category)
    {
        $before = $category->only(['name', 'function']);
        $category->update($this->categoryData($request, $category));
        AuditLogger::record('category.updated', $category, ['before' => $before, 'after' => $category->only(['name', 'function'])]);

        return back()->with('success', 'Kategori diperbarui.');
    }

    public function destroyCategory(Category $category)
    {
        if ($category->toolTypes()->exists()) {
            return back()->with('error', 'Kategori masih digunakan oleh master aset dan tidak dapat dihapus.');
        }

        AuditLogger::record('category.deleted', $category, ['name' => $category->name]);
        $category->delete();

        return back()->with('success', 'Kategori dihapus.');
    }

    public function storeLocation(Request $request)
    {
        $model = Location::create($request->validate(['name' => ['required', 'string'], 'type' => ['required', Rule::in(['area', 'ruang', 'rak', 'slot'])], 'parent_id' => ['nullable', 'exists:locations,id'], 'capacity' => ['nullable', 'integer', 'min:1']]));
        AuditLogger::record('location.created', $model);

        return back()->with('success', 'Lokasi ditambahkan.');
    }

    public function storeToolType(Request $request)
    {
        $data = $this->toolTypeData($request);
        $model = ToolType::create($data);
        AuditLogger::record('tool_type.created', $model);

        return back()->with('success', 'Jenis alat ditambahkan.');
    }

    public function updateToolType(Request $request, ToolType $toolType)
    {
        $before = $toolType->only(['code', 'name', 'category_id', 'primary_location_id', 'size', 'description', 'rules_summary', 'checklist']);
        $toolType->update($this->toolTypeData($request, $toolType));
        AuditLogger::record('tool_type.updated', $toolType, ['before' => $before, 'after' => $toolType->only(array_keys($before))]);

        return back()->with('success', 'Master aset diperbarui.');
    }

    public function destroyToolType(ToolType $toolType)
    {
        $isUsed = $toolType->units()->exists()
            || DB::table('loan_items')->where('tool_type_id', $toolType->id)->exists();

        if ($isUsed) {
            return back()->with('error', 'Master aset sudah memiliki unit atau transaksi dan tidak dapat dihapus.');
        }

        AuditLogger::record('tool_type.deleted', $toolType, ['code' => $toolType->code, 'name' => $toolType->name]);
        $toolType->delete();

        return back()->with('success', 'Master aset dihapus.');
    }

    private function categoryData(Request $request, ?Category $category = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('categories')->ignore($category)],
            'function' => ['nullable', 'string', 'max:255'],
        ]);
    }

    /** @return list<string> */
    private function expandTokenCodes(string $input): array
    {
        $input = mb_strtoupper(trim($input));
        if (! preg_match('/^(.*?)(\d+)-(\d+)$/', $input, $matches)) {
            return [$input];
        }

        [$all, $prefix, $startText, $endText] = $matches;
        $start = (int) $startText;
        $end = (int) $endText;
        if ($end < $start) {
            throw ValidationException::withMessages(['code' => 'Nomor akhir rentang harus sama atau lebih besar dari nomor awal.']);
        }
        if (($end - $start + 1) > 200) {
            throw ValidationException::withMessages(['code' => 'Maksimal 200 token dalam satu kali input.']);
        }

        $width = max(strlen($startText), strlen($endText));

        return array_map(fn (int $number) => $prefix.str_pad((string) $number, $width, '0', STR_PAD_LEFT), range($start, $end));
    }

    private function toolTypeData(Request $request, ?ToolType $toolType = null): array
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:20', Rule::unique('tool_types')->ignore($toolType)],
            'name' => ['required', 'string', 'max:255'],
            'category_id' => ['required', 'exists:categories,id'],
            'primary_location_id' => ['required', 'exists:locations,id'],
            'size' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'rules_summary' => ['nullable', 'string'],
            'checklist_text' => ['required', 'string'],
        ]);
        $data['checklist'] = array_values(array_filter(array_map('trim', preg_split('/\r\n|\r|\n/', $data['checklist_text']))));
        unset($data['checklist_text']);

        return $data;
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
