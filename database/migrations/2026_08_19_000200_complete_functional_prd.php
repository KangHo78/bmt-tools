<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_active')->default(true)->after('token_used');
        });
        Schema::table('tool_units', function (Blueprint $table) {
            $table->dateTime('last_audited_at')->nullable();
        });
        Schema::table('loan_items', function (Blueprint $table) {
            $table->json('return_checklist')->nullable();
        });
        Schema::table('maintenance_orders', function (Blueprint $table) {
            $table->string('type')->default('servis');
            $table->string('before_photo_url')->nullable();
            $table->string('after_photo_url')->nullable();
        });
        Schema::table('asset_cases', function (Blueprint $table) {
            $table->json('evidence_urls')->nullable();
            $table->string('resolution_status')->default('belum_diproses');
            $table->foreignId('replacement_unit_id')->nullable()->constrained('tool_units')->nullOnDelete();
            $table->dateTime('closed_at')->nullable();
        });

        Schema::create('asset_receipts', function (Blueprint $table) {
            $table->id();
            $table->string('reference_no')->unique();
            $table->string('request_reference')->nullable();
            $table->string('owner_institution');
            $table->date('received_date');
            $table->foreignId('received_by')->constrained('users');
            $table->string('status')->default('draf');
            $table->text('notes')->nullable();
            $table->string('document_url')->nullable();
            $table->timestamps();
        });
        Schema::create('asset_receipt_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_receipt_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tool_type_id')->constrained()->restrictOnDelete();
            $table->foreignId('location_id')->constrained()->restrictOnDelete();
            $table->unsignedInteger('requested_quantity');
            $table->unsignedInteger('received_quantity');
            $table->string('initial_condition')->default('baik');
            $table->text('difference_reason')->nullable();
            $table->timestamps();
        });
        Schema::table('tool_units', function (Blueprint $table) {
            $table->foreignId('asset_receipt_item_id')->nullable()->constrained()->nullOnDelete();
        });
        Schema::create('location_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tool_unit_id')->constrained()->cascadeOnDelete();
            $table->foreignId('from_location_id')->nullable()->constrained('locations')->nullOnDelete();
            $table->foreignId('to_location_id')->constrained('locations')->restrictOnDelete();
            $table->foreignId('moved_by')->constrained('users');
            $table->text('reason');
            $table->timestamps();
        });
        Schema::create('stock_audit_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_audit_id')->constrained()->cascadeOnDelete();
            $table->foreignId('unit_id')->constrained('tool_units')->cascadeOnDelete();
            $table->foreignId('expected_location_id')->nullable()->constrained('locations')->nullOnDelete();
            $table->foreignId('actual_location_id')->nullable()->constrained('locations')->nullOnDelete();
            $table->string('expected_condition')->nullable();
            $table->string('actual_condition')->nullable();
            $table->string('status')->default('belum_discan');
            $table->text('note')->nullable();
            $table->foreignId('scanned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('scanned_at')->nullable();
            $table->timestamps();
            $table->unique(['stock_audit_id', 'unit_id']);
        });
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('type')->default('string');
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_settings');
        Schema::dropIfExists('stock_audit_items');
        Schema::dropIfExists('location_movements');
        Schema::table('tool_units', fn (Blueprint $table) => $table->dropConstrainedForeignId('asset_receipt_item_id'));
        Schema::dropIfExists('asset_receipt_items');
        Schema::dropIfExists('asset_receipts');
        Schema::table('asset_cases', fn (Blueprint $table) => $table->dropColumn(['evidence_urls', 'resolution_status', 'replacement_unit_id', 'closed_at']));
        Schema::table('maintenance_orders', fn (Blueprint $table) => $table->dropColumn(['type', 'before_photo_url', 'after_photo_url']));
        Schema::table('tool_units', fn (Blueprint $table) => $table->dropColumn('last_audited_at'));
        Schema::table('loan_items', fn (Blueprint $table) => $table->dropColumn('return_checklist'));
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn('is_active'));
    }
};
