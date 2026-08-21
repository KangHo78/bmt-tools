<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tool_types', function (Blueprint $table) {
            $table->unsignedBigInteger('sso_item_id')->nullable()->unique()->after('id');
            $table->string('manufacture_pn')->nullable()->after('name');
            $table->string('original_manufacture')->nullable()->after('manufacture_pn');
            $table->string('article_no')->nullable()->after('original_manufacture');
            $table->string('unit', 100)->nullable()->after('article_no');
        });
    }

    public function down(): void
    {
        Schema::table('tool_types', function (Blueprint $table) {
            $table->dropUnique(['sso_item_id']);
            $table->dropColumn(['sso_item_id', 'manufacture_pn', 'original_manufacture', 'article_no', 'unit']);
        });
    }
};
