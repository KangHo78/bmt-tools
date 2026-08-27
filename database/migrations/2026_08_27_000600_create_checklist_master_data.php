<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('checklist_items', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        Schema::create('checklist_item_tool_type', function (Blueprint $table) {
            $table->foreignId('checklist_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tool_type_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('position')->default(0);
            $table->primary(['checklist_item_id', 'tool_type_id']);
        });

        DB::table('tool_types')
            ->select(['id', 'checklist'])
            ->orderBy('id')
            ->each(function ($toolType): void {
                $items = is_string($toolType->checklist)
                    ? json_decode($toolType->checklist, true)
                    : $toolType->checklist;

                foreach (array_values(array_filter((array) $items)) as $position => $name) {
                    $name = trim((string) $name);
                    if ($name === '') {
                        continue;
                    }

                    $item = DB::table('checklist_items')->where('name', $name)->first();
                    $itemId = $item?->id ?? DB::table('checklist_items')->insertGetId([
                        'name' => $name,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    DB::table('checklist_item_tool_type')->insertOrIgnore([
                        'checklist_item_id' => $itemId,
                        'tool_type_id' => $toolType->id,
                        'position' => $position,
                    ]);
                }
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('checklist_item_tool_type');
        Schema::dropIfExists('checklist_items');
    }
};
