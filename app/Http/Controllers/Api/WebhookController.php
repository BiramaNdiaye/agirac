// app/Http/Controllers/Api/WebhookController.php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class WebhookController extends Controller
{

private function verifySignature(Request $request): bool
{
    $signature = $request->header('X-Webhook-Signature');
    $payload = $request->getContent();
    $secret = config('services.covage.webhook_secret');
    $computed = hash_hmac('sha256', $payload, $secret);
    return hash_equals($computed, $signature);
}
    /**
     * Endpoint appelé par Covage pour nous notifier d'un événement.
     */
    public function handleEvent(Request $request)
    {
        // 1. Vérifier la signature HMAC (à implémenter plus tard)
        // if (!$this->verifySignature($request)) {
        //     return response()->json(['error' => 'Invalid signature'], 401);
        // }

        // 2. Valider le payload selon le standard TMF
        $validated = $request->validate([
            'eventId' => 'required|string',
            'eventTime' => 'required|date',
            'eventType' => 'required|string',
            'event' => 'required|array',
            'fieldPath' => 'nullable|string',
            'resourcePath' => 'nullable|string',
        ]);

        // 3. Stocker l'événement en base (pour traçabilité)
        $notification = Notification::create([
            'id' => (string) Str::uuid(),
            'event_id' => $validated['eventId'],
            'event_type' => $validated['eventType'],
            'payload' => $validated,
            'received_at' => now(),
        ]);

        // 4. Déclencher un job asynchrone pour traiter l'événement
        ProcessCovageEvent::dispatch($notification);

        // 5. Répondre rapidement (202 Accepted)
        return response()->json(['status' => 'accepted'], 202);
    }
}
