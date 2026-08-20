<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Location;
use App\Models\ToolType;
use App\Models\ToolUnit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminMasterDataTest extends TestCase
{
    use RefreshDatabase;

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
            'checklist_text' => "Kabel\nChuck key",
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
}
