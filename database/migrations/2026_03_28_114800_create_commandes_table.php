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
       Schema::create('commandes', function (Blueprint $table) {
            $table->id();
            
            // Identifiants
            $table->string('admin_rds')->nullable()->comment('Identifiant RDS');
            $table->string('admin_bca')->nullable()->comment('Identifiant REFBCA');
            $table->string('admin_prefix')->nullable();
            $table->string('admin_contract')->nullable();
            $table->string('operator_client_ref')->nullable()->comment('Référence client opérateur');
            $table->string('oi_reference')->nullable()->comment('Référence OI');
            $table->string('rop_ref')->nullable()->comment('Référence ROP');
            
            // Adresse du site A
            $table->string('address_site_a_name')->nullable();
            $table->string('address_site_a_street')->nullable();
            $table->string('address_site_a_town')->nullable();
            $table->string('address_site_a_postal')->nullable();
            $table->decimal('address_site_a_x', 10, 7)->nullable()->comment('Coordonnée X');
            $table->decimal('address_site_a_y', 10, 7)->nullable()->comment('Coordonnée Y');
            $table->string('insee_code', 10)->nullable()->comment('Code INSEE');
            
            // Informations techniques
            $table->string('techno')->nullable()->comment('Technologie');
            $table->string('network')->nullable()->comment('Réseau');
            $table->string('offer')->nullable()->comment('Offre');
            $table->string('bandwith')->nullable()->comment('Bande passante');
            $table->string('nro_name')->nullable()->comment('Nom NRO');
            $table->string('nro_port')->nullable()->comment('Port NRO');
            $table->string('bpe_piquage')->nullable()->comment('BPE piquage');
            $table->string('mer_number')->nullable()->comment('Numéro MER');
            $table->string('equipement_number')->nullable()->comment('Numéro équipement');
            $table->string('article_designation')->nullable()->comment('Désignation article');
            
            // Informations bâtiment
            $table->string('building_code')->nullable()->comment('Code bâtiment');
            $table->string('project_name')->nullable()->comment('Nom du projet');
            
            // Informations client
            $table->string('client_directive_access')->nullable()->comment('Directive accès client');
            $table->string('client_directive_intervention')->nullable()->comment('Directive intervention client');
            $table->string('client_directive_planning')->nullable()->comment('Directive planning client');
            
            // Contact sur site
            $table->string('contact_on_site_firstname')->nullable();
            $table->string('contact_on_site_lastname')->nullable();
            $table->string('contact_on_site_mail')->nullable();
            $table->string('contact_on_site_phone')->nullable();
            
            // Contact Covage
            $table->string('covage_contact_name')->nullable();
            $table->string('covage_contact_mail')->nullable();
            
            // Opérateur
            $table->string('operator_name')->nullable()->comment('Nom opérateur');
            
            // Dates
            $table->date('order_date')->nullable()->comment('Date commande');
            $table->date('begin_client_wait')->nullable()->comment('Début attente client');
            $table->date('client_wait_end')->nullable()->comment('Fin attente client');
            
            // Données complémentaires
            $table->text('comment')->nullable()->comment('Commentaire général');
            
            // Métadonnées de traitement
            $table->string('statut')->default('en_cours')->comment('Statut de la commande');
            $table->json('metadata')->nullable()->comment('Métadonnées supplémentaires');
            
            $table->timestamps();
            $table->softDeletes();
            
            // Index pour optimiser les recherches
            $table->index('admin_rds');
            $table->index('admin_bca');
            $table->index('operator_client_ref');
            $table->index('oi_reference');
            $table->index('order_date');
            $table->index('statut');
            $table->index('insee_code');
            $table->index('nro_name');
            
            // Index composite pour les recherches fréquentes
            $table->index(['admin_rds', 'admin_bca']);
            $table->index(['operator_client_ref', 'oi_reference']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
       Schema::dropIfExists('commandes');
    }
};
