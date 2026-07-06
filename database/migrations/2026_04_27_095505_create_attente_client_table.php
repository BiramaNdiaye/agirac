<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('attente_client', function (Blueprint $table) {
            $table->id();
 
            $table->uuid('uuid')->unique()->nullable();
            $table->string('admin_rds', 100)->index();
            $table->string('admin_bca', 100)->index();
            $table->string('admin_contract', 100)->nullable();
            $table->string('admin_prefix', 50)->nullable();
            $table->string('project_name', 255)->nullable();
            $table->string('operator_name', 100)->nullable();
            $table->date('begin_client_wait')->nullable();
            $table->date('client_wait_end')->nullable();
            $table->text('comment')->nullable();
            $table->string('source_file', 255)->nullable();
            $table->string('source_prefix', 50)->nullable();
            $table->timestamp('imported_at')->nullable();
            $table->timestamps();

            $table->index(['admin_rds', 'admin_bca']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attente_client');
    }
};
