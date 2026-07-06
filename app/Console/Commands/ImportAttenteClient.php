<?php

namespace App\Console\Commands;

use App\Services\ImportAttenteClientService;
use Illuminate\Console\Command;

class ImportAttenteClient extends Command
{
    protected $signature = 'import:attente-client {--force : Forcer l\'import} {--show-details}';
    protected $description = 'Importe les fichiers ATTENTECLIENT depuis /OUT';

    public function handle()
    {
        $this->info('📥 Import des fichiers ATTENTECLIENT...');
        $service = new ImportAttenteClientService();
        $service->importFromSftpOut();
        $this->info('✅ Import terminé.');

        if ($this->option('show-details')) {
            $stats = $service->getStats(); // ← utilisation de la méthode d'accès
            $this->table(['Statut', 'Nombre'], [
                ['Fichiers traités', $stats['processed']],
                ['Enregistrements importés', $stats['imported']],
                ['Ignorés', $stats['skipped']],
                ['Erreurs', count($stats['errors'])],
            ]);
        }

        return 0;
    }
}
