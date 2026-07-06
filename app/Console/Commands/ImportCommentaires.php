<?php

namespace App\Console\Commands;

use App\Services\ImportCommentairesService;
use Illuminate\Console\Command;

class ImportCommentaires extends Command
{
    protected $signature = 'import:commentaires 
                            {--force : Forcer l\'import même si le commentaire existe déjà}
                            {--show-details : Afficher les détails de l\'import}';
    
    protected $description = 'Importe les fichiers COMMENT (échanges de commentaires) depuis les archives et SFTP';
    
    public function handle()
    {
        $this->info('💬 Import des commentaires...');
        $this->newLine();
        
        $service = new ImportCommentairesService();
        $result = $service->importFromAllSources();
        
        $this->displayResult($result);
        
        return $result['success'] ? 0 : 1;
    }
    
    protected function displayResult($result)
    {
        $this->newLine();
        
        if ($result['success']) {
            $this->info('✅ Import des commentaires terminé !');
        } else {
            $this->error('❌ Erreur lors de l\'import des commentaires');
        }
        
        $this->table(
            ['Type', 'Nombre'],
            [
                ['Fichiers traités', $result['stats']['processed']],
                ['Commentaires importés', $result['stats']['imported']],
                ['Ignorés', $result['stats']['skipped']],
                ['Erreurs', count($result['stats']['errors'])],
            ]
        );
        
        if ($this->option('show-details') && !empty($result['stats']['details'])) {
            $this->newLine();
            $this->info('📋 Détails:');
            foreach ($result['stats']['details'] as $detail) {
                $this->line("  • {$detail}");
            }
        }
        
        if (!empty($result['stats']['errors'])) {
            $this->newLine();
            $this->warn('⚠️ Erreurs:');
            foreach ($result['stats']['errors'] as $error) {
                $this->error("  • {$error}");
            }
        }
    }
}
