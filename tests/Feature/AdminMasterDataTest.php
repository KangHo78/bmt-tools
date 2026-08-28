<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\ChecklistItem;
use App\Models\Location;
use App\Models\SsoItem;
use App\Models\SsoNpb;
use App\Models\ToolType;
use App\Models\ToolUnit;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Tests\TestCase;

class AdminMasterDataTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        if (DB::connection('sso')->getDriverName() !== 'sqlite') {
            return;
        }

        Schema::connection('sso')->dropIfExists('m_item');
        Schema::connection('sso')->dropIfExists('npb_item');
        Schema::connection('sso')->dropIfExists('npb');
        Schema::connection('sso')->dropIfExists('users');
        Schema::connection('sso')->create('m_item', function (Blueprint $table) {
            $table->id();
            $table->string('item_no')->unique();
            $table->string('item_name');
            $table->string('item_type')->default('Tool');
            $table->boolean('is_active')->default(true);
            $table->unsignedTinyInteger('flag')->default(1);
            $table->string('manufacture_pn')->nullable();
            $table->string('original_manufacture')->nullable();
            $table->string('article_no')->nullable();
            $table->string('unit')->nullable();
            $table->text('specification')->nullable();
            $table->string('image')->nullable();
        });
        DB::connection('sso')->table('m_item')->insert([
            'item_no' => '603840',
            'item_name' => 'Mesin Las Uji',
            'item_type' => 'Tool',
            'is_active' => true,
            'flag' => 1,
            'manufacture_pn' => 'PN-603840',
            'original_manufacture' => 'Pabrikan Uji',
            'article_no' => 'ART-01',
            'unit' => 'PCS',
            'specification' => 'Spesifikasi alat uji',
        ]);
        Schema::connection('sso')->create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('username');
            $table->boolean('is_active')->default(true);
            $table->boolean('is_group')->default(false);
        });
        Schema::connection('sso')->create('npb', function (Blueprint $table) {
            $table->id();
            $table->string('npb__no');
            $table->unsignedBigInteger('peminta_id');
            $table->boolean('flag')->default(true);
        });
        Schema::connection('sso')->create('npb_item', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('npb_id');
            $table->unsignedBigInteger('item_id');
            $table->unsignedInteger('qty');
        });
        DB::connection('sso')->table('users')->insert([
            'id' => 10,
            'name' => 'Peminta Tools Uji',
            'username' => 'peminta.tools',
            'is_active' => true,
            'is_group' => false,
        ]);
        DB::connection('sso')->table('npb')->insert([
            'id' => 20,
            'npb__no' => '0475/WO-PO/04/2026',
            'peminta_id' => 10,
            'flag' => true,
        ]);
        DB::connection('sso')->table('npb_item')->insert([
            'id' => 30,
            'npb_id' => 20,
            'item_id' => 1,
            'qty' => 2,
        ]);
    }

    public function test_administrator_creates_master_asset_from_buana_multi_item(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $category = Category::create(['name' => 'Welding Tools']);
        $location = Location::create(['name' => 'Ruang Tools', 'type' => 'ruang']);
        $source = SsoItem::tools()->where('item_no', '603840')->firstOrFail();
        $physicalCondition = ChecklistItem::create(['name' => 'Kondisi fisik']);
        $completeness = ChecklistItem::create(['name' => 'Kelengkapan']);

        $this->actingAs($admin)->post(route('admin.tool-types.store'), [
            'sso_item_id' => $source->id,
            'category_id' => $category->id,
            'primary_location_id' => $location->id,
            'rules_summary' => 'Digunakan sesuai prosedur welding.',
            'checklist_item_ids' => [$physicalCondition->id, $completeness->id],
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('tool_types', [
            'sso_item_id' => $source->id,
            'code' => $source->item_no,
            'name' => $source->item_name,
            'manufacture_pn' => $source->manufacture_pn,
            'article_no' => $source->article_no,
            'unit' => $source->unit,
        ]);
        $toolType = ToolType::where('sso_item_id', $source->id)->firstOrFail();
        $this->assertSame(['Kondisi fisik', 'Kelengkapan'], $toolType->checklist);
        $this->assertDatabaseHas('checklist_item_tool_type', [
            'tool_type_id' => $toolType->id,
            'checklist_item_id' => $physicalCondition->id,
            'position' => 0,
        ]);
    }

    public function test_administrator_can_update_and_delete_unused_master_data(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $category = Category::create(['name' => 'Perkakas', 'function' => 'Lama']);
        $location = Location::create(['name' => 'Rak A', 'type' => 'rak']);
        $toolType = ToolType::create([
            'code' => 'OLD-01',
            'name' => 'Bor Lama',
            'category_id' => $category->id,
            'primary_location_id' => $location->id,
            'checklist' => ['Kabel'],
        ]);
        $cable = ChecklistItem::create(['name' => 'Kabel']);
        $chuckKey = ChecklistItem::create(['name' => 'Chuck key']);

        $this->actingAs($admin)->put("/administrasi/kategori/{$category->id}", [
            'name' => 'Perkakas Listrik',
            'function' => 'Pekerjaan listrik',
        ])->assertSessionHasNoErrors();

        $this->actingAs($admin)->put("/administrasi/jenis-alat/{$toolType->id}", [
            'code' => 'DRL-01',
            'name' => 'Bor Tangan',
            'category_id' => $category->id,
            'primary_location_id' => $location->id,
            'size' => '13 mm',
            'description' => 'Bor listrik',
            'rules_summary' => 'Gunakan APD',
            'checklist_item_ids' => [$cable->id, $chuckKey->id],
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('categories', [
            'id' => $category->id,
            'name' => 'Perkakas Listrik',
        ]);
        $this->assertDatabaseHas('tool_types', [
            'id' => $toolType->id,
            'code' => 'DRL-01',
            'name' => 'Bor Tangan',
        ]);

        $this->actingAs($admin)
            ->delete("/administrasi/jenis-alat/{$toolType->id}")
            ->assertSessionHas('success');
        $this->actingAs($admin)
            ->delete("/administrasi/kategori/{$category->id}")
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('tool_types', ['id' => $toolType->id]);
        $this->assertDatabaseMissing('categories', ['id' => $category->id]);
    }

    public function test_master_data_in_use_cannot_be_deleted(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $category = Category::create(['name' => 'Perkakas']);
        $location = Location::create(['name' => 'Rak A', 'type' => 'rak']);
        $toolType = ToolType::create([
            'code' => 'DRL-01',
            'name' => 'Bor Tangan',
            'category_id' => $category->id,
            'primary_location_id' => $location->id,
            'checklist' => ['Kabel'],
        ]);
        ToolUnit::create([
            'tool_type_id' => $toolType->id,
            'asset_code' => 'AST-001',
            'status' => 'tersedia',
            'condition' => 'baik',
            'location_id' => $location->id,
        ]);

        $this->actingAs($admin)
            ->delete("/administrasi/jenis-alat/{$toolType->id}")
            ->assertSessionHas('error');
        $this->actingAs($admin)
            ->delete("/administrasi/kategori/{$category->id}")
            ->assertSessionHas('error');

        $this->assertDatabaseHas('tool_types', ['id' => $toolType->id]);
        $this->assertDatabaseHas('categories', ['id' => $category->id]);
    }

    public function test_administrator_manages_reusable_checklist_master_data(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)->post(route('admin.checklists.store'), [
            'name' => 'Kabel daya tidak terkelupas',
        ])->assertSessionHasNoErrors();

        $item = ChecklistItem::where('name', 'Kabel daya tidak terkelupas')->firstOrFail();

        $this->actingAs($admin)->put(route('admin.checklists.update', $item), [
            'name' => 'Kabel daya dalam kondisi baik',
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('checklist_items', [
            'id' => $item->id,
            'name' => 'Kabel daya dalam kondisi baik',
        ]);

        $this->actingAs($admin)
            ->delete(route('admin.checklists.destroy', $item))
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('checklist_items', ['id' => $item->id]);
    }

    public function test_administrator_imports_complete_tool_codes_and_master_data_from_excel(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        [$source, $document] = $this->toolSourcePair();

        $file = $this->masterAssetWorkbook([
            [$source->item_no, 2, $source->item_no.'.1', $document->npb__no],
            [null, null, $source->item_no.'.2'],
        ]);
        $this->actingAs($admin)
            ->post(route('admin.tool-types.import'), ['import_file' => $file])
            ->assertSessionHasNoErrors()
            ->assertSessionHas('success', 'Import selesai: 1 master aset ditambahkan, 0 diperbarui, dan 2 unit tool dibuat.');

        $toolType = ToolType::where('sso_item_id', $source->id)->firstOrFail();
        $this->assertSame($source->item_name, $toolType->name);
        $this->assertSame($source->manufacture_pn, $toolType->manufacture_pn);
        $this->assertDatabaseHas('tool_units', ['tool_type_id' => $toolType->id, 'asset_code' => $source->item_no.'.1']);
        $this->assertDatabaseHas('tool_units', ['tool_type_id' => $toolType->id, 'asset_code' => $source->item_no.'.2']);
        $this->assertDatabaseHas('tool_units', [
            'asset_code' => $source->item_no.'.1',
            'owner' => $document->requester->name ?: $document->requester->username,
            'owner_sso_user_id' => $document->requester->id,
            'source_npb_id' => $document->id,
            'source_npb_item_id' => $document->items->firstWhere('item_id', $source->id)->id,
            'source_reference' => $document->npb__no,
        ]);
    }

    public function test_import_rejects_incomplete_tool_codes_without_partial_changes(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        [$source, $document] = $this->toolSourcePair();
        $file = $this->masterAssetWorkbook([
            [$source->item_no, 2, $source->item_no.'.1', $document->npb__no],
        ]);

        $this->actingAs($admin)
            ->post(route('admin.tool-types.import'), ['import_file' => $file])
            ->assertSessionHasErrors('import_file');

        $this->assertDatabaseMissing('tool_types', ['sso_item_id' => $source->id]);
        $this->assertDatabaseMissing('tool_units', ['asset_code' => $source->item_no.'.1']);
    }

    public function test_import_finds_required_columns_in_full_opname_layout(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        [$source, $document] = $this->toolSourcePair();
        $file = $this->masterAssetWorkbook([
            [1, $source->item_no, $source->item_name, 1, $source->item_no.'.1', $document->npb__no, 'Ruang Tools'],
        ], ['No', 'Item No', 'Nama Barang', 'QTY', 'No. Tool', 'PO NO', 'Location']);

        $this->actingAs($admin)
            ->post(route('admin.tool-types.import'), ['import_file' => $file])
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('tool_units', ['asset_code' => $source->item_no.'.1']);
    }

    /** @param list<array<int, int|string|null>> $rows */
    private function masterAssetWorkbook(array $rows, array $headers = ['ITEM NO', 'QTY', 'NO. TOOL', 'PO NO']): UploadedFile
    {
        $spreadsheet = new Spreadsheet;
        $spreadsheet->getActiveSheet()->fromArray([
            $headers,
            ...$rows,
        ]);
        $path = tempnam(sys_get_temp_dir(), 'master-asset-import-');
        (new Xlsx($spreadsheet))->save($path);
        $spreadsheet->disconnectWorksheets();

        return new UploadedFile(
            $path,
            'master-aset.xlsx',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            null,
            true,
        );
    }

    /** @return array{SsoItem, SsoNpb} */
    private function toolSourcePair(): array
    {
        $document = SsoNpb::query()
            ->where('flag', 1)
            ->whereHas('items.item', fn ($query) => $query->tools())
            ->whereHas('requester', fn ($query) => $query->where('is_active', 1)->where('is_group', 0))
            ->with(['requester', 'items.item'])
            ->firstOrFail();
        $source = $document->items->pluck('item')->first(fn ($item) => $item && $item->item_type === 'Tool' && $item->is_active && $item->flag);

        return [$source, $document];
    }
}
