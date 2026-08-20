<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('locations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type')->default('slot');
            $table->foreignId('parent_id')->nullable()->constrained('locations')->nullOnDelete();
            $table->unsignedInteger('capacity')->nullable();
            $table->timestamps();
        });

        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('function')->nullable();
            $table->timestamps();
        });

        Schema::create('tool_types', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('size')->nullable();
            $table->foreignId('primary_location_id')->nullable()->constrained('locations')->nullOnDelete();
            $table->text('description')->nullable();
            $table->text('rules_summary')->nullable();
            $table->string('image_url')->nullable();
            $table->json('checklist')->nullable();
            $table->boolean('requires_outside_letter')->default(true);
            $table->timestamps();
        });

        Schema::create('tool_units', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tool_type_id')->constrained()->cascadeOnDelete();
            $table->string('asset_code')->unique();
            $table->string('serial_number')->nullable()->unique();
            $table->string('status')->default('tersedia')->index();
            $table->string('condition')->default('baik');
            $table->foreignId('location_id')->nullable()->constrained()->nullOnDelete();
            $table->string('owner')->nullable();
            $table->text('notes')->nullable();
            $table->string('photo_url')->nullable();
            $table->date('received_at')->nullable();
            $table->timestamps();
        });

        Schema::create('loans', function (Blueprint $table) {
            $table->id();
            $table->string('trx_no')->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('usage_type');
            $table->text('purpose');
            $table->string('location_text');
            $table->dateTime('start_date');
            $table->dateTime('due_date');
            $table->string('status')->default('menunggu_approval')->index();
            $table->string('letter_url')->nullable();
            $table->foreignId('approved_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('approved_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->unsignedTinyInteger('tokens_used')->default(0);
            $table->dateTime('handover_at')->nullable();
            $table->string('handover_photo_url')->nullable();
            $table->dateTime('returned_at')->nullable();
            $table->timestamps();
        });

        Schema::create('loan_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tool_type_id')->constrained()->restrictOnDelete();
            $table->foreignId('unit_id')->nullable()->constrained('tool_units')->nullOnDelete();
            $table->string('condition_out')->nullable();
            $table->string('condition_in')->nullable();
            $table->string('return_status')->default('belum_dicek');
            $table->json('checklist')->nullable();
            $table->text('return_note')->nullable();
            $table->json('photos_out')->nullable();
            $table->json('photos_in')->nullable();
            $table->timestamps();
        });

        Schema::create('loan_extensions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_id')->constrained()->cascadeOnDelete();
            $table->dateTime('old_due_date');
            $table->dateTime('new_due_date');
            $table->text('reason');
            $table->foreignId('requested_by')->constrained('users');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('disetujui');
            $table->timestamps();
        });

        Schema::create('maintenance_orders', function (Blueprint $table) {
            $table->id();
            $table->string('work_order_no')->unique();
            $table->foreignId('unit_id')->constrained('tool_units')->cascadeOnDelete();
            $table->string('action');
            $table->string('technician')->nullable();
            $table->string('vendor')->nullable();
            $table->string('status')->default('dijadwalkan');
            $table->date('scheduled_date');
            $table->date('completed_date')->nullable();
            $table->decimal('cost', 14, 2)->nullable();
            $table->text('notes')->nullable();
            $table->date('next_schedule_date')->nullable();
            $table->timestamps();
        });

        Schema::create('stock_audits', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('scope');
            $table->string('status')->default('draf');
            $table->string('assigned_to')->nullable();
            $table->date('scheduled_date');
            $table->unsignedInteger('total_units')->default(0);
            $table->unsignedInteger('checked_units')->default(0);
            $table->text('reviewer_note')->nullable();
            $table->timestamps();
        });

        Schema::create('asset_cases', function (Blueprint $table) {
            $table->id();
            $table->string('case_no')->unique();
            $table->string('type');
            $table->string('stage')->default('dilaporkan');
            $table->foreignId('unit_id')->nullable()->constrained('tool_units')->nullOnDelete();
            $table->foreignId('loan_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('responsible_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('chronology');
            $table->text('decision')->nullable();
            $table->string('report_url')->nullable();
            $table->boolean('has_evidence')->default(false);
            $table->boolean('has_berita_acara')->default(false);
            $table->boolean('has_decision')->default(false);
            $table->timestamps();
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('category')->default('informasi');
            $table->string('title');
            $table->text('description');
            $table->string('object_type')->nullable();
            $table->unsignedBigInteger('object_id')->nullable();
            $table->string('href')->nullable();
            $table->dateTime('read_at')->nullable();
            $table->timestamps();
        });

        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action');
            $table->string('subject_type');
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->json('properties')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        foreach (['activity_logs', 'notifications', 'asset_cases', 'stock_audits', 'maintenance_orders', 'loan_extensions', 'loan_items', 'loans', 'tool_units', 'tool_types', 'categories', 'locations'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
