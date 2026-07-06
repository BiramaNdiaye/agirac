<?php

namespace App\Console\Commands;

use App\Services\ImportRaccordementArchivesService;
use Illuminate\Console\Command;

class ImportPlanifRaccoDateKo extends Command
{
    protected $signature = 'import:planif-racco-ko 
                            {--force : Forcer l\'import même si l\'action existe déjà}
                            {--show-details : Afficher les détails de l\'import}';
    
    protected $description = 'Importe les fichiers PLANIFRACCODATEKO (impossibilité de raccordement) depuis le dossier archives';
    
    public function handle()
    {
        $this->info('⚠️ Import des fichiers PLANIFRACCODATEKO (impossibilité de raccordement)...');
        $this->newLine();
        
        $service = new ImportRaccordementArchivesService();
        $result = $service->importFromArchive('PLANIFRACCODATEKO', $this->option('force'));
        
        $this->displayResult($result);
        
        return $result['success'] ? 0 : 1;
    }
    
    protected function displayResult($result)
    {
        $this->newLine();
        
        if ($result['success']) {
            $this->info('✅ Import PLANIFRACCODATEKO terminé !');
        } else {
            $this->error('❌ Erreur lors de l\'import PLANIFRACCODATEKO');
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
