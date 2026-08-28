<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tool_units', function (Blueprint $table) {
            $table->unsignedBigInteger('source_po_id')->nullable()->after('source_npb_item_id');
            $table->unsignedBigInteger('source_po_item_id')->nullable()->after('source_po_id');
            $table->index('source_po_id');
            $table->index('source_po_item_id');
        });
    }

    public function down(): void
    {
        Schema::table('tool_units', function (Blueprint $table) {
            $table->dropIndex(['source_po_id']);
            $table->dropIndex(['source_po_item_id']);
            $table->dropColumn(['source_po_id', 'source_po_item_id']);
        });
    }
};
