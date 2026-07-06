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
         Schema::create('fichiers_importes', function (Blueprint $table) {
            $table->id();
            
            // Informations fichier
            $table->string('nom_fichier');
            $table->string('prefixe')->comment('OTPLANIFVTDATE, COMMENT, CRVTCLIKO, OTPLANIFRACCODATE');
            $table->enum('type_fichier', ['RDS', 'REFBCA'])->comment('admin_rds ou admin_bca');
            $table->string('reference')->comment('Référence commune (admin_rds ou admin_bca)');
            
            // Stockage
            $table->string('chemin_stockage');
            $table->string('chemin_zip')->nullable()->comment('Chemin du fichier zip original');
            $table->string('nom_zip')->nullable()->comment('Nom du fichier zip original');
            
            // Contenu extrait
            $table->json('contenu_brut')->nullable()->comment('Contenu brut du fichier');
            $table->json('donnees_extraites')->nullable()->comment('Données structurées extraites');
            
            // Métadonnées
            $table->datetime('date_fichier')->nullable()->comment('Date extraite du nom de fichier');
            $table->string('hash_fichier')->nullable()->comment('Hash du fichier pour éviter les doublons');
            $table->integer('taille_fichier')->nullable()->comment('Taille en octets');
            
            // Relations
            $table->foreignId('commande_id')->nullable()->constrained()->onDelete('cascade');
            
            // Statut
            $table->enum('statut_traitement', ['pending', 'processing', 'completed', 'failed'])->default('pending');
            $table->text('erreur_message')->nullable();
            
            $table->timestamps();
            
            // Index
            $table->index('prefixe');
            $table->index('type_fichier');
            $table->index('reference');
            $table->index('statut_traitement');
            $table->index('hash_fichier');
            
            // Index unique pour éviter les doublons
            $table->unique(['nom_fichier', 'hash_fichier']);
            
            // Index composite
            $table->index(['reference', 'prefixe', 'type_fichier']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fichiers_importes');
    }
};
