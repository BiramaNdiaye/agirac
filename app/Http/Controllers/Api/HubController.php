// app/Http/Controllers/Api/HubController.php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hub;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class HubController extends Controller
{
    /**
     * Enregistre un abonnement (callback) de Covage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'callback' => 'required|url',
            'eventTypes' => 'nullable|array',
        ]);

        $hub = Hub::create([
            'id' => (string) Str::uuid(),
            'callback' => $validated['callback'],
            'event_types' => $validated['eventTypes'] ?? null,
        ]);

        return response()->json([
            'id' => $hub->id,
            'callback' => $hub->callback,
            'createdAt' => $hub->created_at->toIso8601String(),
        ], 201);
    }

    /**
     * Supprime un abonnement.
     */
    public function destroy($id)
    {
        $hub = Hub::findOrFail($id);
        $hub->delete();
        return response()->noContent();
    }
}
