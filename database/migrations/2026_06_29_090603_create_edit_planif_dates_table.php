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
        Schema::create('edit_planif_dates', function (Blueprint $table) {
            $table->id();
             $table->string('admin_rds');
            $table->string('admin_bca');
            $table->date('planning_date')->nullable();
            $table->string('admin_contract')->nullable();
            $table->string('admin_prefix')->default('EDITPLANIFDATE');

            // Liaisons
            $table->integer('visite_technique_id')->nullable();
            $table->integer('raccordement_id')->nullable();

            // Métadonnées
            $table->string('source_file')->nullable();
            $table->string('source_prefix')->nullable();
            $table->timestamp('imported_at')->nullable();
            $table->string('file_date')->nullable();
            $table->string('file_time')->nullable();
            $table->integer('file_timestamp')->nullable();
            $table->boolean('is_current_version')->default(true);
            $table->string('edit_zip_path')->nullable(); // chemin du ZIP source

            $table->timestamps();

            $table->index(['admin_rds', 'admin_bca']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('edit_planif_dates');
    }
};
