<?php

namespace App\Console\Commands;

use App\Services\OtplanifvtdateImportService;
use Illuminate\Console\Command;

class ImportOtplanifvtdate extends Command
{
    protected $signature = 'import:otplanifvtdate {--force : Forcer l\'import même si déjà importé}';
    protected $description = 'Importe les données OTPLANIFVTDATE dans la table visite_techniques';
    
    public function handle()
    {
        $this->info('Début de l\'import des visites techniques...');
        
        $service = new OtplanifvtdateImportService();
        $result = $service->importFromCsvData();
        
        if ($result['success']) {
            $this->info('✅ Import terminé avec succès !');
            $this->table(
                ['Type', 'Nombre'],
                [
                    ['Importées', $result['imported']],
                    ['Mises à jour', $result['updated']],
                    ['Ignorées', $result['skipped']],
                    ['Erreurs', count($result['errors'])]
                ]
            );
            
            if (!empty($result['errors'])) {
                $this->warn('Détail des erreurs:');
                foreach ($result['errors'] as $error) {
                    $this->error($error);
                }
            }
        } else {
            $this->error('❌ Erreur lors de l\'import: ' . $result['error']);
            return 1;
        }
        
        return 0;
    }
}
