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
        Schema::create('hub_subscriptions', function (Blueprint $table) {
            $table->id();
		 $table->string('hub_id')->unique();          // ID retourné par le hub externe
    $table->string('callback_url');               // Notre URL /api/notifications
    $table->string('secret');                     // Secret partagé pour HMAC
    $table->json('filters')->nullable();          // Critères d’abonnement
    $table->string('status')->default('active');  // active, expired, deleted
    $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hub_subscriptions');
    }
};
