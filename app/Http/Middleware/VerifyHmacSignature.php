<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\HubSubscription;

class VerifyHmacSignature
{
    public function handle(Request $request, Closure $next)
    {
        // Récupération de l'identifiant hub
        $hubId = $request->header('X-Hub-Id');
        if (!$hubId) {
            return response()->json(['error' => 'Missing X-Hub-Id header'], 401);
        }

        $subscription = HubSubscription::where('hub_id', $hubId)->first();
        if (!$subscription) {
            return response()->json(['error' => 'Unknown subscription'], 401);
        }

        $signatureHeader = $request->header('X-Hub-Signature');
        if (!$signatureHeader) {
            return response()->json(['error' => 'Missing X-Hub-Signature header'], 401);
        }

        if (!str_starts_with($signatureHeader, 'sha256=')) {
            return response()->json(['error' => 'Invalid signature format'], 401);
        }

        $expectedHash = substr($signatureHeader, 7);
        $rawBody = $request->getContent();
        $computedHash = hash_hmac('sha256', $rawBody, $subscription->secret);

        if (!hash_equals($expectedHash, $computedHash)) {
            return response()->json(['error' => 'Invalid signature'], 401);
        }

        // Tout est OK, on continue vers le contrôleur
        return $next($request);
    }
}
