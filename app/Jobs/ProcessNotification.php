<?php

namespace App\Jobs;

use App\Models\Notification;
use App\Services\EventLogger;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\Middleware\ThrottlesExceptions;
use Throwable;

class ProcessNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, SerializesModels;

    public int $tries = 5;

    public function __construct(protected Notification $notification)
    {
        $this->onQueue('notifications');
    }

    /**
     * Délais exponentiels entre les tentatives.
     */
    public function backoff(): array
    {
        return [2, 4, 8, 16, 32];
    }

    /**
     * Middleware pour limiter les exceptions récurrentes.
     */
    public function middleware(): array
    {
        return [
            (new ThrottlesExceptions(10, 5))->backoff(2),
        ];
    }

    /**
     * Traitement principal de la notification.
     */
    public function handle(EventLogger $logger): void
    {
        $logger->info("Traitement de la notification", [
            'event_id' => $this->notification->event_id
        ]);

        // --- Votre logique métier ici ---
        if (rand(0, 2) === 0) {
            throw new \RuntimeException("Échec temporaire du traitement");
        }
        // --- Fin logique métier ---

        $this->notification->update([
            'status'   => 'processed',
            'attempts' => $this->attempts,
        ]);

        $logger->info("Notification traitée avec succès", [
            'event_id' => $this->notification->event_id
        ]);
    }

    /**
     * Gère les échecs définitifs (dead-letter).
     */
    public function failed(Throwable $e): void
    {
        $this->notification->update([
            'status'        => 'failed',
            'error_message' => $e->getMessage(),
            'attempts'      => $this->attempts,
        ]);

        EventLogger::log('dead_letter', [
            'event_id' => $this->notification->event_id,
            'error'    => $e->getMessage(),
        ]);
    }
}
