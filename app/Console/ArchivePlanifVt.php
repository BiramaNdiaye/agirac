<?php
// app/Console/Commands/ArchivePlanifVt.php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class ArchivePlanifVt extends Command
{
    protected $signature = 'archive:planif-vt {--force : Forcer l\'archivage même si les fichiers existent déjà}';
    protected $description = 'Archiver tous les fichiers PLANIFVTDATE du SFTP';

    public function handle()
    {
        $this->info('🔍 Recherche des fichiers PLANIFVTDATE...');
        
        $archiveDirectory = storage_path('app/archives/PLANIFVTDATE/');
        if (!File::isDirectory($archiveDirectory)) {
            File::makeDirectory($archiveDirectory, 0755, true);
        }

        $archived = 0;
        $errors = 0;

        try {
            $diskOut = Storage::disk('sftp_out');
            $files = $diskOut->files('/');
            
            $planifVtFiles = collect($files)
                ->filter(fn($f) => str_starts_with(basename($f), 'PLANIFVTDATE'))
                ->filter(fn($f) => strtolower(pathinfo($f, PATHINFO_EXTENSION)) === 'zip')
                ->values();

            $this->info("📦 {$planifVtFiles->count()} fichier(s) PLANIFVTDATE trouvé(s)");

            foreach ($planifVtFiles as $file) {
                $filename = basename($file);
                $archivePath = $archiveDirectory . $filename;
                
                if (file_exists($archivePath) && !$this->option('force')) {
                    $this->line("  ⏭️  Fichier déjà archivé: {$filename}");
                    continue;
                }
                
                try {
                    $stream = $diskOut->readStream($file);
                    $content = stream_get_contents($stream);
                    fclose($stream);
                    
                    file_put_contents($archivePath, $content);
                    $archived++;
                    $this->line("  ✅ Archivé: {$filename}");
                    
                } catch (\Exception $e) {
                    $errors++;
                    $this->error("  ❌ Erreur: {$filename} - " . $e->getMessage());
                }
            }
            
            $this->info("\n📊 Résultat:");
            $this->info("  - Archivés: {$archived}");
            $this->info("  - Erreurs: {$errors}");
            
        } catch (\Exception $e) {
            $this->error("Erreur de connexion SFTP: " . $e->getMessage());
            return 1;
        }
        
        return 0;
    }
}
