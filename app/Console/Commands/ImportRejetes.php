<?php

namespace App\Console\Commands;

use App\Services\DockoImportService;
use Illuminate\Console\Command;

class ImportRejetes extends Command
{
    protected $signature = 'import:rejetes';
    protected $description = 'Importe les fichiers DOCKO et enregistre les données dans la table rejetes';

    public function handle(DockoImportService $service)
    {
        $this->info('Début de l\'import des rejets DOCKO...');
        $result = $service->importFromCsvData();

        if ($result['success']) {
            $this->info('✅ Import terminé avec succès.');
            $this->table(
                ['Indicateur', 'Valeur'],
                [
                    ['Importés (nouveaux)', $result['imported']],
                    ['Mises à jour (versions désactivées)', $result['updated']],
                    ['Ignorés (version plus récente existante)', $result['skipped']],
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
