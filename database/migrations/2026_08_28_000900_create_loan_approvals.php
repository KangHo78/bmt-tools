<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loan_approvals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_id')->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->unsignedBigInteger('required_sso_user_id')->nullable();
            $table->foreignId('required_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('menunggu');
            $table->foreignId('approved_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('approved_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();
            $table->index(['loan_id', 'type', 'status']);
            $table->index('required_sso_user_id');
        });

        $now = now();
        DB::table('loans')->where('status', 'menunggu_approval')->pluck('id')->each(function ($loanId) use ($now): void {
            DB::table('loan_approvals')->insert([
                'loan_id' => $loanId,
                'type' => 'logistik',
                'status' => 'menunggu',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loan_approvals');
    }
};
