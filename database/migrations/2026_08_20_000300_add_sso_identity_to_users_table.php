<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('sso_user_id')->nullable()->unique()->after('id');
            $table->string('sso_username')->nullable()->index()->after('sso_user_id');
            $table->timestamp('last_sso_login_at')->nullable()->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['sso_user_id']);
            $table->dropIndex(['sso_username']);
            $table->dropColumn(['sso_user_id', 'sso_username', 'last_sso_login_at']);
        });
    }
};
