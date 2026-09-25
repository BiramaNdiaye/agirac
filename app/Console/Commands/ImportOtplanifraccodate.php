<?php

namespace App\Console\Commands;

use App\Services\OtplanifraccodateImportService;
use Illuminate\Console\Command;

class ImportOtplanifraccodate extends Command
{
    protected $signature = 'import:otplanifraccodate';
    protected $description = 'Importe les fichiers OTPLANIFRACCODATE';

    public function handle(OtplanifraccodateImportService $service)
    {
        $this->info('🚀 Import OTPLANIFRACCODATE...');
        
        // ✅ Utiliser la méthode qui existe
        $result = $service->importFromAllSources();
        
        if ($result['success']) {
            $this->info('✅ Import réussi !');
            $this->table(
                ['Statistique', 'Valeur'],
                [
                    ['Importés', $result['imported'] ?? 0],
                    ['Mis à jour', $result['updated'] ?? 0],
                    ['Ignorés', $result['skipped'] ?? 0],
                    ['Fichiers traités', count($result['processed_files'] ?? [])],
                    ['Erreurs', count($result['errors'] ?? [])],
                ]
            );
            
            if (!empty($result['processed_files'])) {
                $this->info('📦 Fichiers traités:');
                foreach ($result['processed_files'] as $file) {
                    $this->line("  - {$file}");
                }
            }
            
            if (!empty($result['errors'])) {
                $this->warn('⚠️ Erreurs rencontrées:');
                foreach ($result['errors'] as $error) {
                    $this->error("  - {$error}");
                }
            }
        } else {
            $this->error('❌ Échec: ' . ($result['error'] ?? 'Erreur inconnue'));
        }
    }
}
