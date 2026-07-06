<?php
// app/Console/Commands/SyncCommandes.php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Http\Controllers\SftpUploadController;
use App\Models\TraitementLog;

class SyncCommandes extends Command
{
    protected $signature = 'commandes:sync {--force : Force la synchronisation même si déjà faite}';
    protected $description = 'Synchronise les commandes depuis les fichiers CSV';
    
    public function handle(SftpUploadController $controller)
    {
        $this->info('Début de la synchronisation des commandes...');
        
        try {
            $response = $controller->getCsvData();
            $data = $response->getData(true);
            
            if ($data['success'] ?? false) {
                $this->info('Synchronisation terminée avec succès');
                $this->table(
                    ['Total ZIP', 'ZIP traités', 'Commandes'],
                    [[
                        $data['stats']['total_zips'] ?? 0,
                        $data['stats']['processed_zips'] ?? 0,
                        Commande::count()
                    ]]
                );
            } else {
                $this->error('Erreur lors de la synchronisation');
            }
            
        } catch (\Exception $e) {
            $this->error('Erreur: ' . $e->getMessage());
            return 1;
        }
        
        return 0;
    }
}
