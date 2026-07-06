<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class EventLogger
{
    public static function log(string $type, array $data): void
    {
        Log::channel('stack')->info($type, $data);
    }

    public function info(string $message, array $context = []): void
    {
        Log::info($message, $context);
    }
}