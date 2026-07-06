<?php

namespace App\Console\Commands;

use App\Services\EditplanifdateImportService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ImportEditplanifdate extends Command
{
    protected $signature = 'import:editplanifdate';
    protected $description = 'Importe les fichiers EDITPLANIFDATE et met à jour les dates de planification';

    public function handle(EditplanifdateImportService $service)
    {
        $this->info('Début de l\'import EDITPLANIFDATE...');
        $result = $service->importFromArchive();

        if ($result === null) {
            $this->error('Le service a retourné null.');
            return 1;
        }

        if ($result['success']) {
            $this->info('✅ Import terminé avec succès.');
            $this->table(
                ['Indicateur', 'Valeur'],
                [
                    ['Traités', $result['stats']['processed']],
                    ['Importés', $result['stats']['imported']],
                    ['Ignorés', $result['stats']['skipped']],
                    ['Erreurs', count($result['stats']['errors'])],
                ]
            );
            if (!empty($result['stats']['errors'])) {
                $this->warn('⚠️ Détails des erreurs :');
                foreach ($result['stats']['errors'] as $error) {
                    $this->line(" - $error");
                }
            }
        } else {
            $this->error('❌ Échec de l\'import :');
            foreach ($result['stats']['errors'] as $error) {
                $this->line(" - $error");
            }
        }

        return 0;
    }
}
