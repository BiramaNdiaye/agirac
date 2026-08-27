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
         Schema::create('docko_responses', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            
            // Références à la commande
            $table->string('rds', 100);
            $table->string('bca', 100);
            $table->enum('commande_type', ['vt', 'raccordement']);
            $table->unsignedBigInteger('commande_id')->nullable();
            
            // Référence à l'action concernée (CRVTCLI envoyé)
            $table->unsignedBigInteger('action_id')->nullable();
            $table->string('action_type', 50)->nullable(); // 'livraison_crvt' ou 'livraison_cr'
            
            // Informations du retour DOCKO
            $table->enum('status', ['accepte', 'refuse'])->nullable();
            $table->text('fail_reason')->nullable();
            $table->text('comment')->nullable();
            $table->date('effective_date')->nullable();
            
            // Fichier source
            $table->string('source_file', 255)->nullable();
            
            // Métadonnées
            $table->timestamp('imported_at')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            
            $table->timestamps();
            
            // Index
            $table->index(['rds', 'bca']);
            $table->index(['commande_type', 'commande_id']);
            $table->index('status');
            $table->index('is_read');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('docko_responses');
    }
};
