<?php
// app/Console/Commands/ArchivePlanifVt.php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class ArchivePlanifVt extends Command
{
    protected $signature = 'archive:planif-vt 
                            {--force : Forcer l\'archivage même si les fichiers existent déjà}
                            {--prefix=PLANIFVTDATE : Préfixe des fichiers à archiver}
                            {--source=IN : Source des fichiers (IN ou OUT)}';

    protected $description = 'Archiver les fichiers du dossier /IN vers le stockage local';

    public function handle()
    {
        $this->info('🔍 Recherche des fichiers à archiver...');
        
        $archiveDirectory = storage_path('app/archives/');
        $prefix = $this->option('prefix');
        $force = $this->option('force');
        $source = $this->option('source');
        
        // Déterminer le disque à utiliser
        $diskName = $source === 'IN' ? 'sftp_out' : 'sftp_in';
        $disk = Storage::disk($diskName);
        
        $this->info("📂 Source: {$source} (disque: {$diskName})");
        $this->info("🏷️  Préfixe: {$prefix}");
        
        // Créer le dossier d'archive pour le préfixe
        $prefixArchiveDir = $archiveDirectory . $prefix . '/';
        if (!File::isDirectory($prefixArchiveDir)) {
            File::makeDirectory($prefixArchiveDir, 0755, true);
            $this->info("📁 Dossier d'archive créé: {$prefixArchiveDir}");
        }

        $archived = 0;
        $errors = 0;
        $skipped = 0;

        try {
            // Lister tous les fichiers à la racine du disque
            $allFiles = $disk->files('/');
            $this->info("📂 Fichiers trouvés sur le SFTP ({$source}): " . count($allFiles));
            
            // Afficher les premiers fichiers pour debug
            if (count($allFiles) > 0) {
                $this->line("📄 Échantillon des fichiers trouvés:");
                foreach (array_slice($allFiles, 0, 10) as $file) {
                    $this->line("   - " . basename($file));
                }
                if (count($allFiles) > 10) {
                    $this->line("   ... et " . (count($allFiles) - 10) . " autres");
                }
            }
            
            // Filtrer les fichiers avec le préfixe spécifié
            $filteredFiles = collect($allFiles)
                ->filter(fn($f) => str_starts_with(basename($f), $prefix))
                ->filter(fn($f) => strtolower(pathinfo($f, PATHINFO_EXTENSION)) === 'zip')
                ->values();

            $this->newLine();
            $this->info("📦 {$filteredFiles->count()} fichier(s) {$prefix} trouvé(s)");

            if ($filteredFiles->isEmpty()) {
                $this->warn("⚠️ Aucun fichier {$prefix} trouvé dans {$source}");
                $this->line("💡 Astuce: Vérifiez que les fichiers sont bien dans le dossier /{$source}");
                return 0;
            }

            $this->newLine();
            $this->table(
                ['#', 'Fichier', 'Taille', 'Statut'],
                $filteredFiles->map(function ($file, $index) use ($disk) {
                    return [
                        $index + 1,
                        basename($file),
                        $this->formatSize($disk->size($file)),
                        'En attente...'
                    ];
                })->toArray()
            );
            $this->newLine();

            foreach ($filteredFiles as $index => $file) {
                $filename = basename($file);
                $archivePath = $prefixArchiveDir . $filename;
                
                $this->info("📦 Traitement du fichier: {$filename}");
                
                // Vérifier si le fichier existe déjà dans l'archive
                if (file_exists($archivePath) && !$force) {
                    $this->line("  ⏭️  Fichier déjà archivé (utilisation --force pour écraser)");
                    $skipped++;
                    continue;
                }
                
                try {
                    // Lire le contenu du fichier depuis le SFTP
                    $stream = $disk->readStream($file);
                    if ($stream === false) {
                        throw new \Exception("Impossible d'ouvrir le flux de lecture");
                    }
                    
                    $content = stream_get_contents($stream);
                    fclose($stream);
                    
                    if ($content === false || $content === '') {
                        throw new \Exception("Le fichier est vide ou impossible à lire");
                    }
                    
                    // Sauvegarder dans l'archive
                    $bytesWritten = file_put_contents($archivePath, $content);
                    
                    if ($bytesWritten === false) {
                        throw new \Exception("Impossible d'écrire le fichier dans l'archive");
                    }
                    
                    $archived++;
                    $this->line("  ✅ Archivé avec succès (" . $this->formatSize($bytesWritten) . ")");
                    
                    // Log de l'archivage
                    Log::info("Fichier archivé", [
                        'file' => $filename,
                        'prefix' => $prefix,
                        'source' => $source,
                        'size' => $bytesWritten,
                        'archive_path' => $archivePath
                    ]);
                    
                } catch (\Exception $e) {
                    $errors++;
                    $this->error("  ❌ Erreur: " . $e->getMessage());
                    Log::error("Erreur archivage", [
                        'file' => $filename,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                }
                
                $this->newLine();
            }
            
            $this->newLine();
            $this->info("📊 RÉSULTAT DE L'ARCHIVAGE:");
            $this->info("  ✅ Archivés: {$archived}");
            $this->info("  ⏭️  Ignorés (déjà existants): {$skipped}");
            $this->info("  ❌ Erreurs: {$errors}");
            $this->info("  📁 Dossier d'archive: {$prefixArchiveDir}");
            
            // Afficher la taille totale des fichiers archivés
            if (File::isDirectory($prefixArchiveDir)) {
                $totalSize = 0;
                $archiveFiles = File::files($prefixArchiveDir);
                foreach ($archiveFiles as $file) {
                    $totalSize += $file->getSize();
                }
                $this->info("  💾 Taille totale de l'archive: " . $this->formatSize($totalSize));
            }
            
        } catch (\Exception $e) {
            $this->error("❌ Erreur de connexion SFTP: " . $e->getMessage());
            Log::error("Erreur connexion SFTP", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'disk' => $diskName,
                'source' => $source
            ]);
            return 1;
        }
        
        return 0;
    }
    
    private function formatSize($bytes)
    {
        if ($bytes === null) return '? B';
        if ($bytes === 0) return '0 B';
        
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $i = 0;
        $bytes = (float)$bytes;
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }
        return round($bytes, 2) . ' ' . $units[$i];
    }
}
