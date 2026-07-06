<?php
// app/Console/Commands/ImportFichiersRdsRefbca.php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\SynchronisationService;
use Illuminate\Support\Facades\Storage;

class ImportFichiersRdsRefbca extends Command
{
    protected $signature = 'import:fichiers {--type=all} {--prefixe=}';
    protected $description = 'Importer les fichiers RDS et REFBCA';
    
    protected $synchronisationService;
    
    public function __construct(SynchronisationService $synchronisationService)
    {
        parent::__construct();
        $this->synchronisationService = $synchronisationService;
    }
    
    public function handle()
    {
        $types = $this->option('type') === 'all' ? ['RDS', 'REFBCA'] : [$this->option('type')];
        
        foreach ($types as $type) {
            $this->info("Traitement des fichiers {$type}");
            
            $dossier = "imports/{$type}";
            $fichiers = Storage::files($dossier);
            
            $bar = $this->output->createProgressBar(count($fichiers));
            
            foreach ($fichiers as $fichier) {
                $nomFichier = basename($fichier);
                
                // Filtrer par préfixe si spécifié
                if ($this->option('prefixe')) {
                    $prefixe = explode('_', $nomFichier)[0];
                    if ($prefixe !== $this->option('prefixe')) {
                        $bar->advance();
                        continue;
                    }
                }
                
                try {
                    $this->synchronisationService->traiterFichier(
                        Storage::path($fichier),
                        $nomFichier,
                        $type
                    );
                    
                    // Déplacer le fichier traité
                    Storage::move($fichier, "processed/{$type}/{$nomFichier}");
                    
                } catch (\Exception $e) {
                    $this->error("Erreur: {$nomFichier} - " . $e->getMessage());
                    Storage::move($fichier, "failed/{$type}/{$nomFichier}");
                }
                
                $bar->advance();
            }
            
            $bar->finish();
            $this->line('');
        }
        
        $this->info('Import terminé');
    }
}
