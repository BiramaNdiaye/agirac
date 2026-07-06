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
 Schema::disableForeignKeyConstraints();
         Schema::create('commentaires', function (Blueprint $table) {
            $table->id();
            
            $table->foreignId('commande_id')->constrained()->onDelete('cascade');
            $table->foreignId('fichier_importe_id')->constrained()->onDelete('cascade');
            
            // Commentaires
            $table->text('contenu');
            $table->string('auteur')->nullable();
            $table->datetime('date_commentaire')->nullable();
            $table->enum('type_commentaire', ['general', 'technique', 'client', 'interne'])->default('general');
            $table->boolean('est_important')->default(false);
            
            $table->timestamps();
            
            $table->index('type_commentaire');
            $table->index('date_commentaire');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('commentaires');
    }
};
