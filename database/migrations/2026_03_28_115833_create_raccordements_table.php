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
      Schema::create('raccordements', function (Blueprint $table) {
            $table->id();
            
            $table->foreignId('commande_id')->constrained()->onDelete('cascade');
            $table->foreignId('fichier_importe_id')->constrained()->onDelete('cascade');
            
            // Informations raccordement
            $table->datetime('date_raccordement')->nullable();
            $table->string('type_raccordement')->nullable();
            $table->string('statut_raccordement')->nullable();
            
            // Détails techniques
            $table->string('pm_zde')->nullable()->comment('Point de mutualisation ZDE');
            $table->string('cable_utilise')->nullable();
            $table->integer('longueur_cable')->nullable()->comment('Longueur en mètres');
            $table->string('numero_prise')->nullable();
            
            // Tests
            $table->boolean('test_continuité')->default(false);
            $table->boolean('test_puissance_optique')->default(false);
            $table->float('puissance_optique_db')->nullable();
            $table->text('resultats_tests')->nullable();
            
            $table->timestamps();
            
            $table->index('date_raccordement');
            $table->index('statut_raccordement');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
         Schema::dropIfExists('raccordements');
    }
};
