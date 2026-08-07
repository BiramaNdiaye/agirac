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
        Schema::create('otposecpecvg', function (Blueprint $table) {
            $table->id();
		$table->string('address_site_a_name')->nullable();
            $table->string('address_site_a_postal')->nullable();
            $table->string('address_site_a_street')->nullable();
            $table->string('address_site_a_town')->nullable();
            $table->string('address_site_a_x')->nullable();
            $table->string('address_site_a_y')->nullable();

            $table->string('admin_bca')->nullable();
            $table->string('admin_contract')->nullable();
            $table->string('admin_prefix')->nullable();
            $table->string('admin_rds')->nullable();

            $table->string('bandwith')->nullable();
            $table->string('bpe_piquage')->nullable();
            $table->string('building_code')->nullable();

            $table->text('client_directive_access')->nullable();
            $table->text('client_directive_intervention')->nullable();
            $table->text('client_directive_planning')->nullable();
            $table->text('comment')->nullable();

            $table->string('contact_on_site_firstname')->nullable();
            $table->string('contact_on_site_lastname')->nullable();
            $table->string('contact_on_site_mail')->nullable();
            $table->string('contact_on_site_phone')->nullable();

            $table->string('covage_contact_name')->nullable();
            $table->string('fail_reason')->nullable();
            $table->string('network')->nullable();

            $table->string('nro_name')->nullable();
            $table->string('nro_port')->nullable();
            $table->string('offer')->nullable();
            $table->string('oi_reference')->nullable();
            $table->string('operator_client_ref')->nullable();
            $table->string('operator_name')->nullable();

            $table->date('order_date')->nullable();

            $table->string('project_name')->nullable();
            $table->string('rop_ref')->nullable();
            $table->string('techno')->nullable();
            $table->string('article_designation')->nullable();

            $table->string('insee_code')->nullable();

            $table->date('begin_client_wait')->nullable();
            $table->date('client_wait_end')->nullable();

            $table->string('mer_number')->nullable();
            $table->string('equipement_number')->nullable();

            $table->date('cancellation_date')->nullable();

            $table->string('one_shot_info')->nullable();

            $table->string('odf_pop')->nullable();
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
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('otposecpecvg');
    }
};
