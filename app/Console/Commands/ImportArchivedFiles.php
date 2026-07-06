<?php

namespace App\Console\Commands;

use App\Services\ImportArchivedFilesService;
use Illuminate\Console\Command;

class ImportArchivedFiles extends Command
{
    protected $signature = 'import:archived-files 
                            {--prefix= : OTPLANIFVTDATE, PLANIFVTDATE, PLANIFDATEVTKO, CRVTCLI}
                            {--force : Forcer l\'import même si l\'action existe déjà}
                            {--show-details : Afficher les détails de l\'import}';
    
    protected $description = 'Importe les fichiers VT depuis le SFTP /OUT (sftp_in) et les archives';
    
    public function handle()
    {
        $this->info('🔍 Import des fichiers VT...');
        $this->newLine();
        
        $prefix = $this->option('prefix');
        $force = $this->option('force');
        $showDetails = $this->option('show-details');
        
        $this->info("📍 Source: SFTP /OUT (sftp_in) - fichiers entrants de Covage");
        
        if ($prefix) {
            $this->info("📁 Type spécifique: {$prefix}");
        } else {
            $this->info("📁 Tous les types VT");
        }
        
        if ($force) {
            $this->warn("⚠️ Mode force activé - les actions existantes seront remplacées");
        }
        
        $this->newLine();
        
        $service = new ImportArchivedFilesService();
        $result = $service->importFromAllSources($prefix, $force);
        
        $this->displayResult($result, $showDetails);
        
        return $result['success'] ? 0 : 1;
    }
    
    protected function displayResult($result, $showDetails)
    {
        $this->newLine();
        
        if ($result['success']) {
            $this->info('✅ Import des VT terminé avec succès !');
        } else {
            $this->error('❌ Erreur lors de l\'import des VT');
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
        
        if ($showDetails && !empty($result['stats']['details'])) {
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
