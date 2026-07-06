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
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type', 50);                 // ex: vt, raccordement, commentaire, attente, test
            $table->string('title');                    // Titre de la notification
            $table->text('message');                    // Message détaillé
            $table->string('link')->nullable();         // Lien vers la page concernée
            $table->timestamp('read_at')->nullable();   // Date de lecture (null = non lue)
            $table->timestamps();    
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
