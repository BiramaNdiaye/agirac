<?php

namespace App\Services;

use App\Mail\NewImportNotification;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class ImportNotifierService
{
    protected $email;

    public function __construct()
    {
        $this->email = config('import.notification_email', env('NOTIFICATION_EMAIL', 'admin@example.com'));
    }

    public function notifyNewFiles($files, $type)
    {
        if (empty($files)) {
            return;
        }

        try {
            Mail::to($this->email)->send(new NewImportNotification($files, $type));
            Log::info("Email de notification envoyé pour {$type} : " . implode(', ', $files));
        } catch (\Exception $e) {
            Log::error("Erreur lors de l'envoi de l'email de notification : " . $e->getMessage());
        }
    }

    public function notifyNewFile($fileName, $type)
    {
        $this->notifyNewFiles([$fileName], $type);
    }
}
