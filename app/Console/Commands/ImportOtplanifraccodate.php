<?php

namespace App\Console\Commands;

use App\Services\ImportRaccordementArchivesService;
use Illuminate\Console\Command;

class ImportOtplanifraccodate extends Command
{
    protected $signature = 'import:otplanifraccodate 
                            {--force : Forcer l\'import même si l\'action existe déjà}
                            {--show-details : Afficher les détails de l\'import}';
    
    protected $description = 'Importe les fichiers OTPLANIFRACCODATE depuis le SFTP /OUT (demandes de raccordement Covage)';
    
    public function handle()
    {
        $this->info('📥 Import des demandes de raccordement (OTPLANIFRACCODATE)...');
        $this->newLine();
        
        $service = new ImportRaccordementArchivesService();
        $result = $service->importFromAllSources('OTPLANIFRACCODATE', $this->option('force'));
        
        $this->displayResult($result);
        
        return $result['success'] ? 0 : 1;
    }
    
    protected function displayResult($result)
    {
        $this->newLine();
        
        if ($result['success']) {
            $this->info('✅ Import OTPLANIFRACCODATE terminé !');
        } else {
            $this->error('❌ Erreur lors de l\'import OTPLANIFRACCODATE');
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
            foreach ($result['stats']['details'] as $detail) {
                $this->line("  • {$detail}");
            }
        }
    }
}
