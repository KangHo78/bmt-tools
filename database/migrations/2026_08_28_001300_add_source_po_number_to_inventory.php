<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('asset_receipt_items', function (Blueprint $table) {
            $table->string('source_po_number', 100)->nullable()->after('source_reference');
        });
        Schema::table('tool_units', function (Blueprint $table) {
            $table->string('source_po_number', 100)->nullable()->after('source_reference');
            $table->index('source_po_number');
        });

        DB::table('tool_units')
            ->whereNotNull('source_po_id')
            ->whereNotNull('source_reference')
            ->update(['source_po_number' => DB::raw('source_reference')]);
    }

    public function down(): void
    {
        Schema::table('tool_units', function (Blueprint $table) {
            $table->dropIndex(['source_po_number']);
            $table->dropColumn('source_po_number');
        });
        Schema::table('asset_receipt_items', function (Blueprint $table) {
            $table->dropColumn('source_po_number');
        });
    }
};
