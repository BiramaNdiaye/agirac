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
        Schema::table('visite_techniques', function (Blueprint $table) {
            $table->string('odf_client')->nullable();

            $table->string('address_site_b_name')->nullable();
            $table->string('address_site_b_postal')->nullable();
            $table->string('address_site_b_street')->nullable();
            $table->string('address_site_b_town')->nullable();
            $table->string('insee_code_site_b')->nullable();

            $table->string('address_site_b_x')->nullable();
            $table->string('address_site_b_y')->nullable();

            $table->string('bpe_piquage_2')->nullable();

            $table->string('contact_on_site_b_firstname')->nullable();
            $table->string('contact_on_site_b_lastname')->nullable();
            $table->string('contact_on_site_b_mail')->nullable();
            $table->string('contact_on_site_b_phone')->nullable();

            $table->string('number_fibers_fon')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('visite_techniques', function (Blueprint $table) {
             $table->dropColumn([
                'odf_client',
                'address_site_b_name',
                'address_site_b_postal',
                'address_site_b_street',
                'address_site_b_town',
                'insee_code_site_b',
                'address_site_b_x',
                'address_site_b_y',
                'bpe_piquage_2',
                'contact_on_site_b_firstname',
                'contact_on_site_b_lastname',
                'contact_on_site_b_mail',
                'contact_on_site_b_phone',
                'number_fibers_fon',
            ]);
        });
    }
};
