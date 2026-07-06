<?php

namespace App\Jobs;

use App\Models\Tmf688Topic;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DeliverTmf688Event implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $topic;
    public $eventPayload;

    public function __construct(Tmf688Topic $topic, array $eventPayload)
    {
        $this->topic = $topic;
        $this->eventPayload = $eventPayload;
    }

    public function handle()
    {
        $hubs = $this->topic->hubs()->where('active', true)->get();

        foreach ($hubs as $hub) {
            try {
                $notification = [
                    'eventId'   => $this->eventPayload['eventId'],
                    'eventType' => $this->eventPayload['eventType'],
                    'eventTime' => $this->eventPayload['eventTime'],
                    'event'     => $this->eventPayload['event'],
                    'domain'    => $this->eventPayload['domain'] ?? null,
                    'priority'  => $this->eventPayload['priority'] ?? null,
                ];

                $signature = hash_hmac('sha256', json_encode($notification), $hub->secret);

                $response = Http::timeout(5)
                    ->withHeaders([
                        'X-TMF-Signature' => $signature,
                        'Content-Type'    => 'application/json',
                    ])
                    ->post($hub->callback_url, $notification);

                $success = $response->successful();
                $hub->markDeliveryAttempt($success);

                if (!$success) {
                    Log::warning("Échec livraison événement TMF688 au hub {$hub->id}", [
                        'status' => $response->status(),
                        'url'    => $hub->callback_url,
                    ]);
                }
            } catch (\Exception $e) {
                Log::error("Exception livraison TMF688: " . $e->getMessage());
                $hub->markDeliveryAttempt(false);
            }
        }
    }
}
