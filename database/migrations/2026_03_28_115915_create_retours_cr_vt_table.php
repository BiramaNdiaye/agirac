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
         Schema::create('retours_cr_vt', function (Blueprint $table) {
            $table->id();
            
            $table->foreignId('commande_id')->constrained()->onDelete('cascade');
            $table->foreignId('fichier_importe_id')->constrained()->onDelete('cascade');
            
            // Informations retour CR VT
            $table->datetime('date_retour')->nullable();
            $table->string('reference_cr')->nullable();
            $table->string('statut_cr')->nullable();
            
            // Résultats
            $table->text('conclusion')->nullable();
            $table->json('anomalies')->nullable();
            $table->json('preconisations')->nullable();
            
            // Validations
            $table->boolean('valide_technique')->default(false);
            $table->boolean('valide_administratif')->default(false);
            $table->datetime('date_validation')->nullable();
            $table->string('validateur_nom')->nullable();
            
            $table->timestamps();
            
            $table->index('date_retour');
            $table->index('statut_cr');
            $table->index('reference_cr');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('retours_cr_vt');
    }
};
