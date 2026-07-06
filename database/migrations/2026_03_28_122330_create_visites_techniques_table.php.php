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
         Schema::create('visites_techniques', function (Blueprint $table) {
            $table->id();
            
            $table->foreignId('commande_id')->constrained()->onDelete('cascade');
            $table->foreignId('fichier_importe_id')->constrained()->onDelete('cascade');
            
            // Informations visite technique
            $table->datetime('date_visite')->nullable();
            $table->string('technicien_nom')->nullable();
            $table->string('technicien_matricule')->nullable();
            $table->string('statut_visite')->nullable();
            $table->text('commentaire_visite')->nullable();
            
            // Résultats de la visite
            $table->boolean('acces_site')->default(false);
            $table->boolean('travaux_possibles')->default(false);
            $table->text('observations')->nullable();
            $table->json('materiels_necessaires')->nullable();
            $table->json('photos')->nullable();
            
            $table->timestamps();
            
            $table->index('date_visite');
            $table->index('statut_visite');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('visites_techniques');
    }
};
