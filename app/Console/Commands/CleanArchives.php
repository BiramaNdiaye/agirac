<?php
// app/Console/Commands/CleanArchives.php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class CleanArchives extends Command
{
    protected $signature = 'archives:clean {--days=90 : Nombre de jours à conserver}';
    protected $description = 'Nettoyer les archives locales des fichiers IN';
    
    public function handle()
    {
        $days = $this->option('days');
        $archiveDir = storage_path('app/archives/');
        $cutoff = now()->subDays($days);
        
        if (!File::isDirectory($archiveDir)) {
            $this->info("Le dossier d'archives n'existe pas");
            return 0;
        }
        
        $files = File::files($archiveDir);
        $deleted = 0;
        $size = 0;
        
        foreach ($files as $file) {
            $modified = \Carbon\Carbon::createFromTimestamp($file->getMTime());
            
            if ($modified->lt($cutoff)) {
                $size += $file->getSize();
                File::delete($file);
                $deleted++;
            }
        }
        
        $this->info("Archives nettoyées:");
        $this->info("  - Fichiers supprimés: {$deleted}");
        $this->info("  - Espace libéré: " . $this->formatSize($size));
        
        return 0;
    }
    
    private function formatSize($bytes)
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $i = 0;
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }
        return round($bytes, 2) . ' ' . $units[$i];
    }
}
