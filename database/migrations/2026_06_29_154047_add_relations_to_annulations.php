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
        Schema::table('annulations', function (Blueprint $table) {
              if (!Schema::hasColumn('annulations', 'visite_technique_id')) {
                $table->integer('visite_technique_id')->nullable()->after('admin_bca');
                $table->integer('raccordement_id')->nullable()->after('visite_technique_id');

                $table->index('visite_technique_id');
                $table->index('raccordement_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('annulations', function (Blueprint $table) {
             $table->dropIndex(['visite_technique_id']);
            $table->dropIndex(['raccordement_id']);
            $table->dropColumn(['visite_technique_id', 'raccordement_id']);
        });
    }
};
