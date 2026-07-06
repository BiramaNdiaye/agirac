<?php
// app/Console/Commands/ImportPlanifDateVtko.php

namespace App\Console\Commands;

use App\Services\ImportArchivedFilesService;
use Illuminate\Console\Command;

class ImportPlanifDateVtko extends Command
{
    protected $signature = 'import:planif-date-vtko 
                            {--force : Forcer l\'import même si l\'action existe déjà}
                            {--show-details : Afficher les détails de l\'import}';
    
    protected $description = 'Importe les fichiers PLANIFDATEVTKO depuis le dossier archives';
    
    public function handle()
    {
        $this->info('⚠️ Import des fichiers PLANIFDATEVTKO (impossibilité de VT)...');
        $this->newLine();
        
        $service = new ImportArchivedFilesService();
        $result = $service->importFromArchive('PLANIFDATEVTKO', $this->option('force'));
        
        $this->displayResult($result);
        
        return $result['success'] ? 0 : 1;
    }
    
    protected function displayResult($result)
    {
        $this->newLine();
        
        if ($result['success']) {
            $this->info('✅ Import PLANIFDATEVTKO terminé !');
        } else {
            $this->error('❌ Erreur lors de l\'import PLANIFDATEVTKO');
        }
        
        $this->table(
            ['Type', 'Nombre'],
            [
                ['Fichiers traités', $result['stats']['processed']],
                ['Actions importées', $result['stats']['imported']],
                ['Ignorés', $result['stats']['skipped']],
                ['Erreurs', count($result['stats']['errors'])],
            ]
        );
        
        if ($this->option('show-details') && !empty($result['stats']['details'])) {
            $this->newLine();
            $this->info('📋 Détails des opérations:');
            foreach ($result['stats']['details'] as $detail) {
                $this->line("  • {$detail}");
            }
        }
        
        if (!empty($result['stats']['errors'])) {
            $this->newLine();
            $this->warn('⚠️ Détail des erreurs:');
            foreach ($result['stats']['errors'] as $error) {
                $this->error("  • {$error}");
            }
        }
    }
}
