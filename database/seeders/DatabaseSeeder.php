<?php

namespace Database\Seeders;

use App\Models\AssetCase;
use App\Models\Borrower;
use App\Models\Category;
use App\Models\ChecklistItem;
use App\Models\Loan;
use App\Models\Location;
use App\Models\MaintenanceOrder;
use App\Models\PhysicalToken;
use App\Models\StockAudit;
use App\Models\SystemNotification;
use App\Models\SystemSetting;
use App\Models\ToolType;
use App\Models\ToolUnit;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $password = Hash::make('Bengkel#2026');
        User::create(['name' => 'Rina Wulandari', 'email' => 'admin@tams.id', 'password' => $password, 'role' => 'admin', 'institution' => 'TAMS Pusat']);
        $kepala = User::create(['name' => 'Hendra Wijaya', 'email' => 'kepala@tams.id', 'password' => $password, 'role' => 'kepala_logistik', 'institution' => 'Divisi Logistik']);
        $petugas = User::create(['name' => 'Dedi Kurniawan', 'email' => 'petugas@tams.id', 'password' => $password, 'role' => 'petugas', 'institution' => 'Tool Room A']);
        User::create(['name' => 'Siti Amalia', 'email' => 'petugas2@tams.id', 'password' => $password, 'role' => 'petugas', 'institution' => 'Tool Room B']);
        $budi = User::create(['sso_user_id' => 1005, 'name' => 'Budi Hartono', 'email' => 'user@tams.id', 'password' => $password, 'role' => 'user', 'institution' => 'Workshop Mekanik', 'phone' => '081234567890', 'token_used' => 3]);
        $andi = User::create(['name' => 'Andi Pratama', 'email' => 'andi@tams.id', 'password' => $password, 'role' => 'user', 'institution' => 'Workshop Elektrik', 'token_used' => 1]);
        $fajar = User::create(['name' => 'Fajar Nugroho', 'email' => 'fajar@tams.id', 'password' => $password, 'role' => 'user', 'institution' => 'Project Support', 'token_used' => 2]);

        foreach (User::orderBy('id')->get() as $index => $account) {
            $profile = Borrower::create(['user_id' => $account->id, 'name' => $account->name, 'institution' => $account->institution, 'phone' => $account->phone]);
            foreach (range(1, 10) as $number) {
                PhysicalToken::create(['borrower_id' => $profile->id, 'code' => sprintf('%02d-%02d', $index + 1, $number)]);
            }
        }
        $budiBorrower = Borrower::where('user_id', $budi->id)->firstOrFail();
        $fajarBorrower = Borrower::where('user_id', $fajar->id)->firstOrFail();

        $roomA = Location::create(['name' => 'Tool Room A', 'type' => 'ruang', 'capacity' => 300]);
        $roomB = Location::create(['name' => 'Tool Room B', 'type' => 'ruang', 'capacity' => 150]);
        $rackA = Location::create(['name' => 'Rak A-03 / Slot B', 'type' => 'slot', 'parent_id' => $roomA->id, 'capacity' => 30]);
        $rackB = Location::create(['name' => 'Rak B-01 / Slot A', 'type' => 'slot', 'parent_id' => $roomB->id, 'capacity' => 20]);
        $safetyRack = Location::create(['name' => 'Safety Wall / Bay 02', 'type' => 'slot', 'parent_id' => $roomA->id, 'capacity' => 40]);

        $power = Category::create(['name' => 'Alat Listrik', 'function' => 'Pengeboran, pemotongan, dan pengelasan']);
        $measure = Category::create(['name' => 'Alat Ukur', 'function' => 'Pengukuran dan inspeksi']);
        $access = Category::create(['name' => 'Akses & Angkat', 'function' => 'Akses kerja pada ketinggian']);
        $safety = Category::create(['name' => 'Keselamatan', 'function' => 'Pelindung diri']);

        $definitions = [
            ['TWL-DRL', 'Bor Tangan Cordless', $power, $rackA, '13 mm · 18V', ['Baterai', 'Charger', 'Kotak', 'Buku Panduan']],
            ['TWL-GRD', 'Gerinda Tangan', $power, $rackA, '4 inch · 850W', ['Kaca Pelindung', 'Mata Gerinda', 'Kunci Pas']],
            ['TWL-MLT', 'Multimeter Digital', $measure, $rackB, 'True RMS', ['Probe', 'Baterai 9V', 'Kotak']],
            ['TWL-LSR', 'Waterpass Laser', $measure, $rackB, '20 meter', ['Kotak Keras', 'Tripod', 'Kacamata Laser']],
            ['TWL-TGA', 'Tangga Aluminium', $access, $roomA, '3 meter', ['Kunci Pengaman Kaki', 'Karet Alas']],
            ['TWL-HLM', 'Helm Safety', $safety, $safetyRack, 'Standar proyek', ['Tali Dagu']],
            ['TWL-HAR', 'Full Body Harness', $safety, $safetyRack, 'Double lanyard', ['Pengait D-Ring', 'Tali Lanyard']],
            ['TWL-LAS', 'Mesin Las Inverter', $power, $roomA, '200A', ['Kabel Ground', 'Topeng Las', 'Sarung Tangan']],
        ];

        $types = [];
        $units = [];
        foreach ($definitions as [$code, $name, $category, $location, $size, $checklist]) {
            $type = ToolType::create(['code' => $code, 'name' => $name, 'category_id' => $category->id, 'primary_location_id' => $location->id, 'size' => $size, 'description' => "$name untuk kebutuhan operasional Workshop Trowulan.", 'rules_summary' => 'Periksa kondisi dan kelengkapan sebelum serta sesudah penggunaan.', 'checklist' => $checklist]);
            $checklistIds = collect($checklist)->map(fn (string $item) => ChecklistItem::firstOrCreate(['name' => $item])->id);
            $type->checklistItems()->sync($checklistIds->mapWithKeys(fn (int $id, int $position) => [$id => ['position' => $position]]));
            $types[$code] = $type;
            for ($i = 1; $i <= 6; $i++) {
                $units[$code][$i] = ToolUnit::create(['tool_type_id' => $type->id, 'asset_code' => sprintf('%s-2026-%04d', $code, $i), 'serial_number' => sprintf('SN-%s-%03d', substr($code, 4), $i), 'status' => 'tersedia', 'condition' => 'baik', 'location_id' => $location->id, 'owner' => $budi->name, 'owner_sso_user_id' => $budi->sso_user_id, 'received_at' => now()->subMonths(6)]);
            }
        }

        $running = Loan::create(['trx_no' => 'TRX-1042', 'user_id' => $budi->id, 'borrower_id' => $budiBorrower->id, 'usage_type' => 'dalam_area', 'purpose' => 'Pemasangan rak gudang B', 'location_text' => 'Gudang B - Lantai 2', 'start_date' => now()->subDays(2), 'due_date' => now()->addDay(), 'status' => 'berjalan', 'tokens_used' => 2, 'handover_at' => now()->subDays(2)]);
        $runningTokens = $budiBorrower->tokens()->take(2)->get();
        foreach ([['TWL-DRL', 2], ['TWL-HLM', 2]] as [$code, $idx]) {
            $unit = $units[$code][$idx];
            $unit->update(['status' => 'dipinjam']);
            $token = $runningTokens->shift();
            $token->update(['status' => 'ditahan_tool_room']);
            $running->items()->create(['tool_type_id' => $types[$code]->id, 'physical_token_id' => $token->id, 'unit_id' => $unit->id, 'condition_out' => 'baik', 'checklist' => array_fill_keys($types[$code]->checklist, true)]);
        }

        $pending = Loan::create(['trx_no' => 'TRX-1058', 'user_id' => $fajar->id, 'borrower_id' => $fajarBorrower->id, 'usage_type' => 'luar_area', 'purpose' => 'Renovasi kantor cabang Bekasi', 'location_text' => 'Kantor Cabang Bekasi', 'start_date' => now()->addDay(), 'due_date' => now()->addDays(10), 'status' => 'menunggu_approval', 'letter_url' => '/demo/surat-peminjaman.pdf', 'tokens_used' => 2]);
        $pendingTokens = $fajarBorrower->tokens()->take(2)->get();
        foreach (['TWL-TGA', 'TWL-HAR'] as $code) {
            $token = $pendingTokens->shift();
            $token->update(['status' => 'direservasi']);
            $unit = $units[$code][1];
            $unit->update(['status' => 'direservasi']);
            $pending->items()->create(['tool_type_id' => $types[$code]->id, 'physical_token_id' => $token->id, 'unit_id' => $unit->id]);
        }
        $pending->approvals()->create(['type' => 'owner', 'required_sso_user_id' => $budi->sso_user_id, 'required_user_id' => $budi->id, 'status' => 'menunggu']);
        $pending->approvals()->create(['type' => 'logistik', 'status' => 'tertunda']);

        $late = Loan::create(['trx_no' => 'TRX-0998', 'user_id' => $budi->id, 'borrower_id' => $budiBorrower->id, 'usage_type' => 'dalam_area', 'purpose' => 'Pemeliharaan tangga darurat', 'location_text' => 'Gedung A', 'start_date' => now()->subDays(10), 'due_date' => now()->subDays(6), 'status' => 'terlambat', 'tokens_used' => 1, 'handover_at' => now()->subDays(10)]);
        $units['TWL-TGA'][2]->update(['status' => 'dipinjam']);
        $lateToken = $budiBorrower->tokens()->where('status', 'dipegang_peminjam')->firstOrFail();
        $lateToken->update(['status' => 'ditahan_tool_room']);
        $late->items()->create(['tool_type_id' => $types['TWL-TGA']->id, 'physical_token_id' => $lateToken->id, 'unit_id' => $units['TWL-TGA'][2]->id, 'condition_out' => 'baik']);

        MaintenanceOrder::create(['work_order_no' => 'WO-2026-014', 'unit_id' => $units['TWL-DRL'][4]->id, 'action' => 'Servis motor dan ganti sikat karbon', 'technician' => 'Agus Setiawan', 'status' => 'berjalan', 'scheduled_date' => now()->subDay(), 'notes' => 'Motor berbunyi kasar pada RPM tinggi.']);
        $units['TWL-DRL'][4]->update(['status' => 'perawatan', 'condition' => 'perlu_perhatian']);
        MaintenanceOrder::create(['work_order_no' => 'WO-2026-015', 'unit_id' => $units['TWL-LAS'][3]->id, 'action' => 'Kalibrasi arus dan ganti kipas', 'vendor' => 'CV Sumber Teknik', 'status' => 'dijadwalkan', 'scheduled_date' => now()->addDays(3)]);

        $audit = StockAudit::create(['name' => 'Audit Bulanan Tool Room A', 'scope' => 'Tool Room A · seluruh kategori', 'status' => 'draf', 'assigned_to' => $petugas->name, 'scheduled_date' => now(), 'total_units' => ToolUnit::count(), 'checked_units' => 0]);
        foreach (ToolUnit::all() as $auditUnit) {
            $audit->items()->create(['unit_id' => $auditUnit->id, 'expected_location_id' => $auditUnit->location_id, 'expected_condition' => $auditUnit->condition]);
        }
        StockAudit::create(['name' => 'Audit Alat Ukur', 'scope' => 'Tool Room B', 'status' => 'draf', 'assigned_to' => 'Siti Amalia', 'scheduled_date' => now()->addDays(7), 'total_units' => 12, 'checked_units' => 0]);

        AssetCase::create(['case_no' => 'KSS-2026-005', 'type' => 'hilang', 'stage' => 'investigasi', 'unit_id' => $units['TWL-MLT'][5]->id, 'responsible_user_id' => $andi->id, 'chronology' => 'Unit tidak ditemukan saat audit stok Tool Room B.', 'has_evidence' => true]);
        $units['TWL-MLT'][5]->update(['status' => 'hilang', 'condition' => 'hilang']);

        SystemNotification::create(['user_id' => $budi->id, 'category' => 'perlu_tindakan', 'title' => 'Pengembalian TRX-1042 jatuh tempo besok', 'description' => 'Bor Tangan dan Helm Safety wajib dikembalikan sesuai tenggat.', 'object_type' => 'loan', 'object_id' => $running->id, 'href' => "/peminjaman/{$running->id}"]);
        SystemNotification::create(['user_id' => $budi->id, 'category' => 'perlu_tindakan', 'title' => 'Persetujuan owner diperlukan', 'description' => 'TRX-1058 menunggu persetujuan owner item.', 'object_type' => 'loan', 'object_id' => $pending->id, 'href' => "/peminjaman/{$pending->id}"]);
        SystemNotification::create(['user_id' => $petugas->id, 'category' => 'perlu_tindakan', 'title' => 'TRX-0998 terlambat', 'description' => 'Budi Hartono belum mengembalikan Tangga Aluminium.', 'object_type' => 'loan', 'object_id' => $late->id, 'href' => "/peminjaman/{$late->id}"]);

        foreach ([
            ['key' => 'default_token_quota', 'value' => '10', 'type' => 'integer', 'description' => 'Kuota token default pengguna'],
            ['key' => 'friday_cutoff_time', 'value' => '17:00', 'type' => 'time', 'description' => 'Jam batas peminjaman Jumat'],
            ['key' => 'reservation_expiry_hours', 'value' => '24', 'type' => 'integer', 'description' => 'Masa berlaku reservasi sebelum serah terima'],
            ['key' => 'reminder_days_before_due', 'value' => '2', 'type' => 'integer', 'description' => 'Jarak pengingat sebelum jatuh tempo'],
        ] as $setting) {
            SystemSetting::create($setting);
        }
    }
}
