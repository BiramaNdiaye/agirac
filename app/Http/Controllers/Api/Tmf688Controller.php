<?php

namespace App\Http\Controllers\Api;

use App\Models\Tmf688Topic;
use App\Models\Tmf688Hub;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Jobs\DeliverTmf688Event;
use App\Http\Controllers\Controller;

class Tmf688Controller extends Controller
{
    /**
     * Créer un nouveau topic (utilisé en interne ou par un admin)
     * POST /api/tmf688/topic
     */
    public function createTopic(Request $request)
    {
        $request->validate(['name' => 'required|string|unique:tmf688_topics']);
        $topic = Tmf688Topic::create($request->only('name', 'description'));
        return response()->json($topic, 201);
    }

    /**
     * Publier un événement dans un topic
     * POST /api/tmf688/topic/{topicId}/event
     */
    public function publishEvent(Request $request, $topicId)
    {
        $topic = Tmf688Topic::findOrFail($topicId);

        $validated = $request->validate([
            'eventId'   => 'required|string',
            'eventType' => 'required|string',
            'eventTime' => 'required|date',
            'event'     => 'required|array',
            'domain'    => 'sometimes|string',
            'priority'  => 'sometimes|string',
        ]);

        // Dispatcher le job qui va notifier tous les hubs
        DeliverTmf688Event::dispatch($topic, $validated);

        return response()->json(['status' => 'accepted'], 202);
    }

    /**
     * Enregistrer un nouveau hub (abonnement client)
     * POST /api/tmf688/topic/{topicId}/hub
     */
    public function createHub(Request $request, $topicId)
    {
        $topic = Tmf688Topic::findOrFail($topicId);

        $validated = $request->validate([
            'callback' => 'required|url',
            'query'    => 'nullable|string',
        ]);

        $hub = $topic->hubs()->create([
            'callback_url' => $validated['callback'],
            'query'        => $validated['query'] ?? null,
            'secret'       => Str::random(32),
            'active'       => true,
        ]);

        return response()->json([
            'id'         => $hub->id,
            'callback'   => $hub->callback_url,
            'query'      => $hub->query,
            'secret'     => $hub->secret,
        ], 201);
    }

    /**
     * Supprimer un hub (désabonnement)
     * DELETE /api/tmf688/topic/{topicId}/hub/{hubId}
     */
    public function deleteHub($topicId, $hubId)
    {
        $hub = Tmf688Hub::where('topic_id', $topicId)->findOrFail($hubId);
        $hub->delete();
        return response()->json(null, 204);
    }
}
