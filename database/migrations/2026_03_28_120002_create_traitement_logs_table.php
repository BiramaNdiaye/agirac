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
     Schema::create('traitement_logs', function (Blueprint $table) {
            $table->id();
            
            $table->string('type_action')->comment('import, extraction, envoi_sftp, etc.');
            $table->string('fichier_nom')->nullable();
            $table->foreignId('commande_id')->nullable()->constrained();
            $table->foreignId('fichier_importe_id')->nullable()->constrained();
            
            $table->enum('statut', ['success', 'warning', 'error'])->default('success');
            $table->text('message');
            $table->json('details')->nullable();
            $table->string('ip_source')->nullable();
            $table->string('user_agent')->nullable();
            
            $table->timestamps();
            
            $table->index('type_action');
            $table->index('statut');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('traitement_logs');
    }
};
