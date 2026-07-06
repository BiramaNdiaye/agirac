<?php

namespace App\Console\Commands;

use App\Services\AnnulationImportService;
use Illuminate\Console\Command;

class ImportAnnulations extends Command
{
    protected $signature = 'import:annulations';
    protected $description = 'Importe les fichiers ANNULATION et enregistre dans la table annulations';

    public function handle(AnnulationImportService $service)
    {
        $this->info('Début de l\'import des annulations...');
        $result = $service->importFromCsvData();

        if ($result['success']) {
            $this->info('✅ Import terminé avec succès.');
            $this->table(
                ['Indicateur', 'Valeur'],
                [
                    ['Importés', $result['imported']],
                    ['Mises à jour', $result['updated']],
                    ['Ignorés', $result['skipped']],
                    ['Erreurs', count($result['errors'])],
                ]
            );
            if (!empty($result['errors'])) {
                $this->warn('⚠️ Détails des erreurs :');
                foreach ($result['errors'] as $error) {
                    $this->line(" - $error");
                }
            }
        } else {
            $this->error('❌ Erreur : ' . ($result['error'] ?? 'Inconnue'));
            if (!empty($result['errors'])) {
                $this->warn('Détails des erreurs :');
                foreach ($result['errors'] as $error) {
                    $this->line(" - $error");
                }
            }
        }
    }
}
