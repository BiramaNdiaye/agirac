<?php

namespace App\Console\Commands;

use App\Services\RouteoptiqueImportService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ImportRouteOptiques extends Command
{
    protected $signature = 'import:routeoptiques';
    protected $description = 'Importe les fichiers ROUTEOPTIQUE depuis le dossier d\'archive';

    public function handle(RouteoptiqueImportService $service)
    {
        $this->info('Début de l\'import des routes optiques...');
        $result = $service->importFromArchive();

        // Sécurité : si le service retourne null (ne devrait pas arriver)
        if ($result === null) {
            $this->error('❌ Le service a retourné null. Vérifiez les logs.');
            Log::error('RouteoptiqueImportService a retourné null');
            return 1;
        }

        // Affichage des statistiques
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
