// app/Jobs/ProcessCovageEvent.php
<?php

namespace App\Jobs;

use App\Models\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessCovageEvent implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, SerializesModels;

    protected $notification;

    public function __construct(Notification $notification)
    {
        $this->notification = $notification;
    }

    public function handle()
    {
        $event = $this->notification->payload;
        $eventType = $event['eventType'];

        Log::info('Traitement événement Covage', ['type' => $eventType, 'id' => $event['eventId']]);

        switch ($eventType) {
            case 'NewFileUploadedEvent':
                // Récupérer les infos du fichier depuis $event['event']
                $fileInfo = $event['event'];
                $this->handleNewFile($fileInfo);
                break;

            case 'WorkOrderStateChangeEvent':
                $workOrder = $event['event'];
                $this->handleWorkOrderChange($workOrder);
                break;

            default:
                Log::warning('Type d\'événement non géré', ['type' => $eventType]);
        }

        // Marquer la notification comme traitée (optionnel)
        $this->notification->processed_at = now();
        $this->notification->save();
    }

    protected function handleNewFile($fileInfo)
    {
        // Exemple : déclencher l'import du fichier
        // $filename = $fileInfo['filename'];
        // $this->importFile($filename);
        Log::info('Nouveau fichier détecté', $fileInfo);
    }

    protected function handleWorkOrderChange($workOrder)
    {
        Log::info('Changement de statut Work Order', $workOrder);
    }
}
