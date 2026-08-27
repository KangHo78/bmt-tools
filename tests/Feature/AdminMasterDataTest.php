<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\ChecklistItem;
use App\Models\Location;
use App\Models\SsoItem;
use App\Models\ToolType;
use App\Models\ToolUnit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminMasterDataTest extends TestCase
{
    use RefreshDatabase;

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
}
