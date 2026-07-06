<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use App\Models\HubSubscription;
use Illuminate\Support\Str;

class HubSubscriber
{
    protected string $hubBaseUrl;

    public function __construct()
    {
        $this->hubBaseUrl = config('services.tmf_hub.url'); // Définir dans config/services.php
    }

    /**
     * Crée un abonnement sur le hub externe.
     */
    public function subscribe(string $callbackUrl, array $filters = []): HubSubscription
    {
        $secret = Str::random(32);

        $response = Http::post($this->hubBaseUrl . '/hub', [
            'callback' => $callbackUrl,
            'secret'   => $secret,
            'filters'  => $filters,
        ]);

        if ($response->status() !== 201) {
            throw new \Exception("Hub subscription failed: " . $response->body());
        }

        $hubId = $response->json('id'); // Selon la réponse du hub

        return HubSubscription::create([
            'hub_id'       => $hubId,
            'callback_url' => $callbackUrl,
            'secret'       => $secret,
            'filters'      => $filters,
            'status'       => 'active',
            'expires_at'   => now()->addDays(30), // Exemple
        ]);
    }

    /**
     * Supprime un abonnement existant.
     */
    public function unsubscribe(HubSubscription $subscription): void
    {
        Http::delete($this->hubBaseUrl . '/hub/' . $subscription->hub_id);
        $subscription->update(['status' => 'deleted']);
    }

    /**
     * Rafraîchit la durée de vie de l’abonnement (si le hub supporte le renew).
     */
    public function renew(HubSubscription $subscription): void
    {
        // Implémentation selon l’API du hub
    }
}