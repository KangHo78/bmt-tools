<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('borrowers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->unique()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('identifier')->nullable()->index();
            $table->string('institution')->nullable();
            $table->string('phone')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('physical_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('borrower_id')->constrained()->restrictOnDelete();
            $table->string('code')->unique();
            $table->string('status')->default('dipegang_peminjam');
            $table->string('notes')->nullable();
            $table->timestamps();
        });

        Schema::table('loans', function (Blueprint $table) {
            $table->foreignId('borrower_id')->nullable()->after('user_id')->constrained()->restrictOnDelete();
            $table->foreignId('created_by')->nullable()->after('borrower_id')->constrained('users')->nullOnDelete();
        });
        Schema::table('loan_items', function (Blueprint $table) {
            $table->foreignId('physical_token_id')->nullable()->after('tool_type_id')->constrained()->restrictOnDelete();
        });

        DB::table('users')->orderBy('id')->each(function ($user) {
            DB::table('borrowers')->insert([
                'user_id' => $user->id,
                'name' => $user->name,
                'institution' => $user->institution,
                'phone' => $user->phone,
                'is_active' => $user->is_active,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });
        $borrowerIds = DB::table('borrowers')->whereNotNull('user_id')->pluck('id', 'user_id');
        DB::table('loans')->whereNotNull('user_id')->get(['id', 'user_id'])->each(function ($loan) use ($borrowerIds): void {
            if (isset($borrowerIds[$loan->user_id])) {
                DB::table('loans')->where('id', $loan->id)->update(['borrower_id' => $borrowerIds[$loan->user_id]]);
            }
        });
        Schema::table('loans', fn (Blueprint $table) => $table->unsignedBigInteger('user_id')->nullable()->change());
    }

    public function down(): void
    {
        Schema::table('loan_items', fn (Blueprint $table) => $table->dropConstrainedForeignId('physical_token_id'));
        Schema::table('loans', function (Blueprint $table) {
            $table->dropConstrainedForeignId('created_by');
            $table->dropConstrainedForeignId('borrower_id');
        });
        Schema::dropIfExists('physical_tokens');
        Schema::dropIfExists('borrowers');
    }
};
