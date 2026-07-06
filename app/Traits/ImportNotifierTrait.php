<?php

namespace App\Traits;

use App\Services\ImportNotifierService;
use Illuminate\Support\Facades\Log;

trait ImportNotifierTrait
{
    protected $processedFiles = [];

    protected function addProcessedFile($fileName)
    {
        if (!empty($fileName)) {
            $this->processedFiles[] = $fileName;
        }
    }

    protected function sendNotificationIfNeeded($type)
    {
        if (empty($this->processedFiles)) {
            return;
        }

        try {
            $notifier = app(ImportNotifierService::class);
            $notifier->notifyNewFiles($this->processedFiles, $type);
        } catch (\Exception $e) {
            Log::error("Erreur lors de l'envoi de la notification pour {$type} : " . $e->getMessage());
        }
    }

    protected function resetProcessedFiles()
    {
        $this->processedFiles = [];
    }
}
