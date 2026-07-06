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
        Schema::create('rejetes', function (Blueprint $table) {
            $table->id();
             $table->string('admin_rds');
    $table->string('admin_bca');
    $table->string('admin_contract')->nullable();
    $table->string('admin_prefix')->default('DOCKO');
    $table->text('fail_reason')->nullable();
    // Métadonnées
    $table->string('source_file')->nullable();
    $table->string('source_prefix')->nullable();
    $table->timestamp('imported_at')->nullable();
    $table->string('file_date')->nullable();
    $table->string('file_time')->nullable();
    $table->integer('file_timestamp')->nullable();
    $table->boolean('is_current_version')->default(true);
    $table->timestamps();

    // Index pour les recherches
    $table->index(['admin_rds', 'admin_bca', 'source_prefix']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rejetes');
    }
};
