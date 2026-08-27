<?php

namespace App\Console\Commands;

use App\Services\ImportDockoService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ImportDocko extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'import:docko
                            {--show-details : Afficher les détails de l\'importation}
                            {--auto-create : Créer automatiquement les commandes manquantes (défaut: true)}
                            {--no-auto-create : Désactiver la création automatique des commandes}
                            {--file= : Importer un fichier spécifique (chemin complet)}
                            {--limit= : Limiter le nombre de lignes à importer}
                            {--debug : Mode debug avec logs plus détaillés}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Importe les fichiers DOCKO depuis le SFTP et les archives locales';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $this->info('📥 Import des fichiers DOCKO...');
        $this->newLine();

        // Déterminer si on doit créer automatiquement les commandes
        $autoCreate = !$this->option('no-auto-create');
        if ($this->option('auto-create')) {
            $autoCreate = true;
        }

        // Mode debug
        if ($this->option('debug')) {
            $this->info('🐛 Mode DEBUG activé');
            Log::info('🐛 Mode DEBUG activé pour import DOCKO');
        }

        // Créer le service
        $service = new ImportDockoService($autoCreate);

        // Si un fichier spécifique est passé en paramètre
        if ($this->option('file')) {
            $filePath = $this->option('file');
            $this->info("📂 Import du fichier spécifique: {$filePath}");
            
            if (!file_exists($filePath)) {
                $this->error("❌ Le fichier n'existe pas: {$filePath}");
                return 1;
            }

            $filename = basename($filePath);
            $this->info("📂 Traitement du fichier: {$filename}");
            
            // Traiter le fichier ZIP local
            $this->processSpecificFile($service, $filePath, $filename);
            
        } else {
            // Importer depuis toutes les sources
            $this->info('🔍 Recherche des fichiers DOCKO...');
            $result = $service->importFromAllSources();
        }

        // Statistiques
        $stats = $service->getStats();
        
        $this->newLine();
        $this->line('═══════════════════════════════════════════');
        $this->line('📊 STATISTIQUES D\'IMPORTATION');
        $this->line('═══════════════════════════════════════════');
        $this->line("📦 Fichiers traités     : {$stats['processed']}");
        $this->line("✅ Lignes importées     : {$stats['imported']}");
        $this->line("⏭️ Lignes ignorées      : {$stats['skipped']}");
        
        if (isset($stats['created'])) {
            $this->line("🆕 Commandes créées    : {$stats['created']}");
        }
        
        if (!empty($stats['errors'])) {
            $this->line("❌ Erreurs              : " . count($stats['errors']));
        }
        $this->line('═══════════════════════════════════════════');
        $this->newLine();

        // Afficher les détails si demandé
        if ($this->option('show-details') || $this->option('debug')) {
            $this->showDetails($stats);
        }

        // Afficher les erreurs
        if (!empty($stats['errors'])) {
            $this->error('⚠️ Des erreurs sont survenues lors de l\'importation:');
            $this->newLine();
            
            $errorCount = count($stats['errors']);
            $maxErrors = min($errorCount, 20);
            
            for ($i = 0; $i < $maxErrors; $i++) {
                $this->error("  ❌ " . $stats['errors'][$i]);
            }
            
            if ($errorCount > 20) {
                $this->warn("  ... et " . ($errorCount - 20) . " autres erreurs");
            }
            
            $this->newLine();
            $this->info('📝 Consultez les logs pour plus de détails:');
            $this->info('   tail -f storage/logs/laravel.log | grep DOCKO');
            $this->newLine();
            
            return 1;
        }

        if ($stats['imported'] > 0) {
            $this->info('✅ Importation terminée avec succès ! 🎉');
            $this->newLine();
            
            // Afficher le résumé des notifications
            $this->info('🔔 Vérifiez les notifications dans l\'application');
        } else {
            $this->warn('⚠️ Aucune donnée importée.');
            $this->newLine();
            
            $this->info('Vérifiez que:');
            $this->info('  1. Les fichiers sont nommés correctement (DOCKO_*.zip)');
            $this->info('  2. Les CSV contiennent les colonnes admin_rds et admin_bca');
            $this->info('  3. Les commandes existent en BDD (ou activez --auto-create)');
            $this->info('  4. Les fichiers sont dans storage/app/archives/DOCKO/');
        }

        return 0;
    }

    /**
     * Traite un fichier spécifique
     */
    protected function processSpecificFile($service, $filePath, $filename)
    {
        $this->info("📂 Traitement du fichier ZIP spécifique: {$filename}");
        
        // Extraire le ZIP
        $extractDir = storage_path('app/temp_docko/' . pathinfo($filename, PATHINFO_FILENAME));
        if (!is_dir($extractDir)) {
            mkdir($extractDir, 0755, true);
        }

        $zip = new \ZipArchive();
        if ($zip->open($filePath) !== true) {
            $this->error("❌ ZIP invalide: {$filename}");
            return;
        }
        
        $zip->extractTo($extractDir);
        $zip->close();

        $csvFiles = \Illuminate\Support\Facades\File::glob($extractDir . '/*.csv');
        $this->info("📄 Fichiers CSV extraits: " . count($csvFiles));
        
        if (empty($csvFiles)) {
            $this->warn("⚠️ Aucun CSV trouvé dans le ZIP");
            \Illuminate\Support\Facades\File::deleteDirectory($extractDir);
            return;
        }

        // Limiter le nombre de lignes si demandé
        $limit = $this->option('limit') ? (int)$this->option('limit') : null;
        
        foreach ($csvFiles as $csvPath) {
            $this->info("📄 Traitement du CSV: " . basename($csvPath));
            $this->processSpecificCsv($service, $csvPath, $filename, $limit);
        }

        \Illuminate\Support\Facades\File::deleteDirectory($extractDir);
        
        // Déplacer le fichier vers processed
        $processedDir = storage_path('app/archives/DOCKO/processed/');
        if (!is_dir($processedDir)) {
            mkdir($processedDir, 0755, true);
        }
        
        $destination = $processedDir . '/' . $filename;
        if (!file_exists($destination)) {
            rename($filePath, $destination);
            $this->info("📦 Fichier déplacé vers: {$destination}");
        }
    }

    /**
     * Traite un CSV spécifique
     */
    protected function processSpecificCsv($service, $csvPath, $zipFilename, $limit = null)
    {
        $fileHandle = fopen($csvPath, 'r');
        if (!$fileHandle) {
            $this->error("❌ Impossible d'ouvrir le CSV: {$csvPath}");
            return;
        }

        // Détection du séparateur
        $firstLine = fgets($fileHandle);
        rewind($fileHandle);
        
        $separator = ',';
        if (strpos($firstLine, ';') !== false) {
            $separator = ';';
        } elseif (strpos($firstLine, "\t") !== false) {
            $separator = "\t";
        }

        $this->info("📋 Séparateur utilisé: '" . ($separator === "\t" ? '\\t' : $separator) . "'");

        $headers = fgetcsv($fileHandle, 0, $separator);
        if (!$headers) {
            $this->error("❌ En-têtes CSV invalides");
            fclose($fileHandle);
            return;
        }

        // Nettoyer les en-têtes
        $headers = array_map(function($header) {
            return trim(trim($header), "\xEF\xBB\xBF");
        }, $headers);

        $this->info("📋 En-têtes trouvés: " . count($headers));

        // Vérifier les colonnes essentielles
        $requiredColumns = ['admin_rds', 'admin_bca'];
        $missingColumns = array_diff($requiredColumns, $headers);
        if (!empty($missingColumns)) {
            $this->error("❌ Colonnes manquantes: " . implode(', ', $missingColumns));
            fclose($fileHandle);
            return;
        }

        $rowNumber = 0;
        $importedCount = 0;
        $skippedCount = 0;
        
        $this->info("📊 Début de l'importation...");
        $progressBar = $this->output->createProgressBar();
        $progressBar->setFormat(' %current%/%max% [%bar%] %percent:3s%% %elapsed:6s% %estimated:-6s%');
        
        // Compter le nombre total de lignes
        $totalLines = 0;
        while (($row = fgetcsv($fileHandle, 0, $separator)) !== false) {
            $totalLines++;
        }
        rewind($fileHandle);
        fgetcsv($fileHandle, 0, $separator); // Skip headers
        
        $progressBar->start($totalLines);

        while (($row = fgetcsv($fileHandle, 0, $separator)) !== false) {
            $rowNumber++;
            
            // Vérifier la limite
            if ($limit && $rowNumber > $limit) {
                $this->info("\n⏹️ Limite atteinte: {$limit} lignes traitées");
                break;
            }
            
            if (count($headers) !== count($row)) {
                $skippedCount++;
                continue;
            }
            
            $data = array_combine($headers, $row);
            
            // Utiliser la réflexion pour appeler la méthode privée
            try {
                $reflection = new \ReflectionClass($service);
                $method = $reflection->getMethod('importRow');
                $method->setAccessible(true);
                $method->invoke($service, $data, $zipFilename);
                $importedCount++;
            } catch (\Exception $e) {
                $this->error("\n❌ Erreur ligne {$rowNumber}: " . $e->getMessage());
                $skippedCount++;
            }
            
            $progressBar->advance();
            
            // Log toutes les 10 lignes
            if ($rowNumber % 10 === 0 && $this->option('debug')) {
                $this->line("\n📝 Ligne {$rowNumber} traitée");
            }
        }

        $progressBar->finish();
        $this->newLine(2);
        
        fclose($fileHandle);
        
        $this->info("✅ CSV traité: {$rowNumber} lignes, {$importedCount} importées, {$skippedCount} ignorées");
    }

    /**
     * Affiche les détails
     */
    protected function showDetails($stats)
    {
        $this->info('📋 DÉTAILS DE L\'IMPORTATION');
        $this->line('─────────────────────────────────────────');
        
        $this->table(
            ['Métrique', 'Valeur'],
            [
                ['Fichiers traités', $stats['processed']],
                ['Lignes importées', $stats['imported']],
                ['Lignes ignorées', $stats['skipped']],
                ['Commandes créées', $stats['created'] ?? 0],
                ['Erreurs', count($stats['errors'])],
            ]
        );

        if (!empty($stats['errors'])) {
            $this->newLine();
            $this->error('❌ LISTE DES ERREURS:');
            $this->line('─────────────────────────────────────────');
            
            $errors = array_slice($stats['errors'], 0, 10);
            foreach ($errors as $index => $error) {
                $this->error(($index + 1) . '. ' . $error);
            }
            
            if (count($stats['errors']) > 10) {
                $this->warn('... et ' . (count($stats['errors']) - 10) . ' autres erreurs');
            }
        }

        $this->newLine();
        
        // Afficher les logs récents
        if ($this->option('debug')) {
            $this->info('📝 DERNIERS LOGS DOCKO:');
            $this->line('─────────────────────────────────────────');
            
            $logs = $this->getRecentLogs();
            foreach ($logs as $log) {
                $this->line($log);
            }
            $this->newLine();
        }
    }

    /**
     * Récupère les logs récents
     */
    protected function getRecentLogs($lines = 20)
    {
        $logFile = storage_path('logs/laravel.log');
        if (!file_exists($logFile)) {
            return ['Aucun log trouvé'];
        }

        $logs = [];
        $handle = fopen($logFile, 'r');
        if ($handle) {
            $lines_array = [];
            while (($line = fgets($handle)) !== false) {
                if (strpos($line, 'DOCKO') !== false) {
                    $lines_array[] = trim($line);
                }
            }
            fclose($handle);
            
            // Prendre les derniers logs
            $logs = array_slice($lines_array, -$lines);
        }

        return $logs;
    }
}
