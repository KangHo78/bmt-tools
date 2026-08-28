<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tool_units', function (Blueprint $table) {
            $table->unsignedBigInteger('owner_sso_user_id')->nullable()->after('owner');
            $table->unsignedBigInteger('source_npb_id')->nullable()->after('owner_sso_user_id');
            $table->unsignedBigInteger('source_npb_item_id')->nullable()->after('source_npb_id');
            $table->string('source_reference')->nullable()->after('source_npb_item_id');
            $table->index('owner_sso_user_id');
            $table->index('source_npb_id');
            $table->index('source_npb_item_id');
        });
    }

    public function down(): void
    {
        Schema::table('tool_units', function (Blueprint $table) {
            $table->dropIndex(['owner_sso_user_id']);
            $table->dropIndex(['source_npb_id']);
            $table->dropIndex(['source_npb_item_id']);
            $table->dropColumn(['owner_sso_user_id', 'source_npb_id', 'source_npb_item_id', 'source_reference']);
        });
    }
};
