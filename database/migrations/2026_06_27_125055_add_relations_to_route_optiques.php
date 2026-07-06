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
        Schema::table('route_optiques', function (Blueprint $table) {
            if (!Schema::hasColumn('route_optiques', 'visite_technique_id')) {
                // Utiliser le type INT (non signé ou signé selon vos tables)
                // Si vos id sont INT, utilisez integer()
                $table->integer('visite_technique_id')->unsigned()->nullable()->after('rop_zip_path');
                $table->integer('raccordement_id')->unsigned()->nullable()->after('visite_technique_id');

                // Index pour les recherches
                $table->index('visite_technique_id');
                $table->index('raccordement_id');

                // Si vous voulez la contrainte foreign (optionnel)
                // Assurez-vous que les tables cibles ont bien des clés primaires de type INT UNSIGNED
                $table->foreign('visite_technique_id')->references('id')->on('visite_techniques')->onDelete('set null');
                $table->foreign('raccordement_id')->references('id')->on('raccordements')->onDelete('set null');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('route_optiques', function (Blueprint $table) {
             $table->dropForeign(['visite_technique_id']);
            $table->dropForeign(['raccordement_id']);
            $table->dropIndex(['visite_technique_id']);
            $table->dropIndex(['raccordement_id']);
            $table->dropColumn(['visite_technique_id', 'raccordement_id']);
        });
    }
};
