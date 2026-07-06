<?php

namespace App\Console\Commands;

use App\Services\ImportInFilesService;
use Illuminate\Console\Command;

class ImportInFiles extends Command
{
    protected $signature = 'import:in-files 
                            {--force : Forcer l\'import même si déjà importé}
                            {--type= : Importer seulement un type spécifique (planification, impossibilite, crvt)}';
    
    protected $description = 'Importe les fichiers du dossier /IN (fichiers sortants) vers la base de données';
    
    public function handle()
    {
        $this->info('🔍 Début de l\'import des fichiers /IN...');
        $this->newLine();
        
        $service = new ImportInFilesService();
        $result = $service->importFromInDirectory();
        
        if ($result['success']) {
            $this->info('✅ Import terminé avec succès !');
            $this->newLine();
            
            $this->table(
                ['Type', 'Nombre'],
                [
                    ['Fichiers traités', $result['stats']['processed']],
                    ['Actions importées', $result['stats']['imported']],
                    ['Ignorés (déjà existants)', $result['stats']['skipped']],
                    ['Erreurs', count($result['stats']['errors'])],
                ]
            );
            
            if (!empty($result['stats']['errors'])) {
                $this->newLine();
                $this->warn('⚠️ Détail des erreurs:');
                foreach ($result['stats']['errors'] as $error) {
                    $this->error("  • $error");
                }
            }
        } else {
            $this->error('❌ Erreur lors de l\'import:');
            foreach ($result['stats']['errors'] as $error) {
                $this->error("  • $error");
            }
            return 1;
        }
        
        return 0;
    }
}
