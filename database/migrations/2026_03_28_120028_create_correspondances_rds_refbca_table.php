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
         Schema::create('correspondances_rds_refbca', function (Blueprint $table) {
            $table->id();
            
            $table->string('admin_rds')->unique();
            $table->string('admin_bca')->unique();
            
            $table->foreignId('commande_id')->constrained()->onDelete('cascade');
            
            $table->datetime('date_appariement');
            $table->string('methode_appariement')->comment('auto, manuel, fichier');
            $table->boolean('est_valide')->default(true);
            
            $table->timestamps();
            
            $table->index('admin_rds');
            $table->index('admin_bca');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('correspondances_rds_refbca');
    }
};
