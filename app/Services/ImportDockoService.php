<?php

namespace App\Services;

use App\Models\VisiteTechnique;
use App\Models\Raccordement;
use App\Models\VisiteTechniqueAction;
use App\Models\RaccordementAction;
use App\Models\DockoResponse;
use App\Models\Notification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use ZipArchive;
use Carbon\Carbon;

class ImportDockoService
{
    protected $stats = [
        'processed' => 0,
        'imported' => 0,
        'skipped' => 0,
        'created' => 0,
        'duplicates_skipped' => 0,
        'errors' => [],
    ];

    protected $tempDir;
    protected $archiveDir;
    protected $autoCreateCommands;
    protected $currentSourceFile;
    protected $currentZipFilename;

    public function __construct($autoCreateCommands = true)
    {
        $this->tempDir = storage_path('app/temp_docko/');
        $this->archiveDir = storage_path('app/archives/DOCKO/');
        $this->autoCreateCommands = $autoCreateCommands;
        $this->currentSourceFile = null;
        $this->currentZipFilename = null;
        
        if (!is_dir($this->tempDir)) {
            mkdir($this->tempDir, 0755, true);
        }
        if (!is_dir($this->archiveDir)) {
            mkdir($this->archiveDir, 0755, true);
        }
    }

    /**
     * 🚀 POINT D'ENTRÉE PRINCIPAL - Importe depuis toutes les sources
     */
    public function importFromAllSources()
    {
        Log::info('🚀 Début import DOCKO depuis toutes les sources');
        
        // 1. Importer depuis le SFTP
        $this->importFromOutDirectory();
        
        // 2. Importer depuis les archives locales
        $this->importFromArchive();
        
        Log::info('📊 Statistiques finales:', $this->stats);
        
        return $this->getResult();
    }

    /**
     * Importe depuis le dossier d'archive local
     */
    protected function importFromArchive()
    {
        Log::info('📁 Recherche de fichiers DOCKO dans les archives locales...');
        
        // Chercher dans le dossier principal
        $zipFiles = File::glob($this->archiveDir . '*.zip');
        
        // Chercher aussi dans le dossier processed
        $processedFiles = File::glob($this->archiveDir . 'processed/*.zip');
        $zipFiles = array_merge($zipFiles, $processedFiles);
        
        if (empty($zipFiles)) {
            Log::info('Aucun fichier DOCKO trouvé dans les archives');
            return;
        }

        Log::info('📦 Fichiers DOCKO trouvés dans les archives: ' . count($zipFiles));

        foreach ($zipFiles as $localPath) {
            $filename = basename($localPath);
            $prefix = explode('_', $filename)[0];
            
            if ($prefix !== 'DOCKO') {
                continue;
            }
            
            Log::info("📂 Traitement du fichier archive: {$filename}");
            $this->processLocalZip($localPath, $filename);
        }
    }

    /**
     * Importe depuis le SFTP
     */
    protected function importFromOutDirectory()
    {
        try {
            $disk = Storage::disk('sftp_in');
            
            // Essayer plusieurs chemins
            $paths = ['/', '/OUT', '/ERROR'];
            $allFiles = [];
            
            foreach ($paths as $path) {
                try {
                    $files = $disk->files($path);
                    Log::info("Fichiers trouvés dans {$path}: " . count($files));
                    $allFiles = array_merge($allFiles, $files);
                } catch (\Exception $e) {
                    Log::warning("Impossible de lister {$path}: " . $e->getMessage());
                }
            }

            if (empty($allFiles)) {
                Log::info('Aucun fichier trouvé sur le SFTP');
                return;
            }

            $zipFiles = array_filter($allFiles, fn($f) => str_ends_with($f, '.zip'));

            if (empty($zipFiles)) {
                Log::info('Aucun fichier ZIP trouvé sur le SFTP');
                return;
            }

            foreach ($zipFiles as $remotePath) {
                $filename = basename($remotePath);
                $prefix = explode('_', $filename)[0];
                
                if ($prefix !== 'DOCKO') {
                    continue;
                }
                $this->processRemoteZip($disk, $remotePath, $filename);
            }

        } catch (\Exception $e) {
            Log::error('Erreur import DOCKO depuis SFTP: ' . $e->getMessage());
            $this->stats['errors'][] = $e->getMessage();
        }
    }

    /**
     * Traite un fichier ZIP local
     */
    protected function processLocalZip($localPath, $filename)
    {
        Log::info("📂 Traitement du fichier ZIP local: {$filename}");
        
        // Stocker le nom du fichier pour les actions
        $this->currentSourceFile = $filename;
        $this->currentZipFilename = $filename;
        
        $extractDir = $this->tempDir . pathinfo($filename, PATHINFO_FILENAME);
        if (!is_dir($extractDir)) mkdir($extractDir, 0755, true);

        $zip = new ZipArchive();
        if ($zip->open($localPath) !== true) {
            Log::error("ZIP DOCKO invalide: {$filename}");
            $this->stats['errors'][] = "ZIP invalide: {$filename}";
            return;
        }
        
        $zip->extractTo($extractDir);
        $zip->close();

        $csvFiles = File::glob($extractDir . '/*.csv');
        Log::info("Fichiers CSV extraits: " . count($csvFiles));
        
        if (empty($csvFiles)) {
            Log::warning("Aucun CSV trouvé dans le ZIP DOCKO: {$filename}");
            File::deleteDirectory($extractDir);
            return;
        }

        foreach ($csvFiles as $csvPath) {
            $this->processCsv($csvPath, $filename);
        }

        File::deleteDirectory($extractDir);
        
        // Déplacer le fichier vers processed s'il n'y est pas déjà
        $processedDir = $this->archiveDir . 'processed/';
        if (!is_dir($processedDir)) mkdir($processedDir, 0755, true);
        
        // Vérifier si le fichier est déjà dans processed
        if (strpos($localPath, 'processed') === false) {
            $destination = $processedDir . '/' . $filename;
            if (!file_exists($destination)) {
                rename($localPath, $destination);
            }
        }
        
        $this->stats['processed']++;
        Log::info("✅ Fichier DOCKO traité: {$filename}");
        
        // Réinitialiser
        $this->currentSourceFile = null;
        $this->currentZipFilename = null;
    }

    /**
     * Traite un fichier ZIP distant
     */
    protected function processRemoteZip($disk, $remotePath, $filename)
    {
        Log::info("📂 Traitement du fichier ZIP distant: {$filename}");
        
        // Stocker le nom du fichier pour les actions
        $this->currentSourceFile = $filename;
        $this->currentZipFilename = $filename;
        
        $localZip = $this->tempDir . $filename;
        try {
            file_put_contents($localZip, $disk->readStream($remotePath));
        } catch (\Exception $e) {
            Log::error("Téléchargement DOCKO échoué: {$filename}");
            $this->stats['errors'][] = "Téléchargement échoué: {$filename}";
            return;
        }

        $extractDir = $this->tempDir . pathinfo($filename, PATHINFO_FILENAME);
        if (!is_dir($extractDir)) mkdir($extractDir, 0755, true);

        $zip = new ZipArchive();
        if ($zip->open($localZip) !== true) {
            Log::error("ZIP DOCKO invalide: {$filename}");
            $this->stats['errors'][] = "ZIP invalide: {$filename}";
            File::delete($localZip);
            return;
        }
        $zip->extractTo($extractDir);
        $zip->close();

        $csvFiles = File::glob($extractDir . '/*.csv');
        
        if (empty($csvFiles)) {
            Log::warning("Aucun CSV trouvé dans le ZIP DOCKO: {$filename}");
            File::deleteDirectory($extractDir);
            File::delete($localZip);
            return;
        }

        foreach ($csvFiles as $csvPath) {
            $this->processCsv($csvPath, $filename);
        }

        File::deleteDirectory($extractDir);
        File::delete($localZip);
        
        // Déplacer le fichier distant
        try {
            $processedDir = '/OUT/DOCKO/processed';
            if (!$disk->exists($processedDir)) {
                $disk->makeDirectory($processedDir);
            }
            $disk->move($remotePath, $processedDir . '/' . $filename);
        } catch (\Exception $e) {
            Log::warning("Impossible de déplacer DOCKO distant {$filename}");
        }
        
        $this->stats['processed']++;
        Log::info("✅ Fichier DOCKO distant traité: {$filename}");
        
        // Réinitialiser
        $this->currentSourceFile = null;
        $this->currentZipFilename = null;
    }

    /**
     * Traite un fichier CSV
     */
    protected function processCsv($csvPath, $zipFilename)
    {
        Log::info("📄 Traitement du CSV: " . basename($csvPath));
        
        $fileHandle = fopen($csvPath, 'r');
        if (!$fileHandle) {
            Log::error("Impossible d'ouvrir le CSV: {$csvPath}");
            return;
        }
        
        // Détection automatique du séparateur
        $firstLine = fgets($fileHandle);
        rewind($fileHandle);
        
        $separator = ',';
        if (strpos($firstLine, ';') !== false) {
            $separator = ';';
        } elseif (strpos($firstLine, "\t") !== false) {
            $separator = "\t";
        }
        
        Log::info("📋 Séparateur utilisé: '" . ($separator === "\t" ? '\\t' : $separator) . "'");
        
        $headers = fgetcsv($fileHandle, 0, $separator);
        if (!$headers) {
            Log::warning("❌ En-têtes CSV vides ou invalides");
            fclose($fileHandle);
            return;
        }

        // Nettoyer les en-têtes (supprimer les BOM, espaces, etc.)
        $headers = array_map(function($header) {
            return trim(trim($header), "\xEF\xBB\xBF");
        }, $headers);

        Log::info("📋 En-têtes trouvés: " . count($headers));
        Log::info("📋 Premiers en-têtes: " . implode(', ', array_slice($headers, 0, 10)) . '...');

        // Vérifier que les colonnes essentielles existent
        $requiredColumns = ['admin_rds', 'admin_bca'];
        $missingColumns = array_diff($requiredColumns, $headers);
        if (!empty($missingColumns)) {
            Log::error("❌ Colonnes manquantes dans le CSV: " . implode(', ', $missingColumns));
            Log::error("📋 En-têtes disponibles: " . implode(', ', $headers));
            fclose($fileHandle);
            return;
        }

        $rowNumber = 0;
        $importedCount = 0;
        $skippedCount = 0;
        
        while (($row = fgetcsv($fileHandle, 0, $separator)) !== false) {
            $rowNumber++;
            
            if (count($headers) !== count($row)) {
                Log::warning("Ligne {$rowNumber} ignorée: nombre de colonnes incorrect");
                $skippedCount++;
                continue;
            }
            
            $data = array_combine($headers, $row);
            
            // Log pour la première ligne
            if ($rowNumber === 1) {
                Log::info("📝 Première ligne de données:", [
                    'rds' => $data['admin_rds'] ?? 'NON TROUVÉ',
                    'bca' => $data['admin_bca'] ?? 'NON TROUVÉ',
                    'admin_prefix' => $data['admin_prefix'] ?? 'NON TROUVÉ',
                    'fail_reason' => $data['fail_reason'] ?? 'vide'
                ]);
            }
            
            $this->importRow($data, $zipFilename);
            $importedCount++;
        }
        
        fclose($fileHandle);
        
        Log::info("✅ CSV traité: {$rowNumber} lignes, {$importedCount} importées, {$skippedCount} ignorées");
    }

    /**
     * Importe une ligne du CSV avec gestion des doublons
     */
    protected function importRow($data, $zipFilename)
    {
        try {
            $rds = $data['admin_rds'] ?? $data['rds'] ?? null;
            $bca = $data['admin_bca'] ?? $data['bca'] ?? null;
            $adminContract = $data['admin_contract'] ?? null;
            $adminPrefix = $data['admin_prefix'] ?? null;

            Log::info("🔍 Import ligne: RDS={$rds}, BCA={$bca}, Prefix={$adminPrefix}");

            if (!$rds || !$bca) {
                Log::warning("❌ Ligne ignorée: RDS ou BCA manquant");
                $this->stats['skipped']++;
                return;
            }

            // 1. CHERCHER LA COMMANDE
            $commande = $this->findOrCreateCommand($rds, $bca, $data);
            
            if (!$commande) {
                Log::warning("❌ Impossible de trouver/créer la commande pour {$rds} - {$bca}");
                $this->stats['skipped']++;
                return;
            }

            // 2. VÉRIFIER LES DOUBLONS - Garder uniquement le plus récent
            $shouldSkip = $this->checkDuplicate($rds, $bca, $adminPrefix);
            
            if ($shouldSkip) {
                Log::info("⏭️ Doublon ignoré pour {$rds} - {$bca}");
                $this->stats['duplicates_skipped']++;
                return;
            }

            // 3. RÉCUPÉRER OU CRÉER L'ACTION
            $action = $this->getOrCreateAction($commande);
            
            if (!$action) {
                Log::warning("❌ Impossible de créer l'action pour {$rds} - {$bca}");
                $this->stats['skipped']++;
                return;
            }

            // 4. TRAITER LA RÉPONSE DOCKO
            $this->processDockoResponse($data, $commande, $action, $zipFilename);

            $this->stats['imported']++;
            Log::info("✅ DOCKO IMPORTÉ AVEC SUCCÈS");

        } catch (\Exception $e) {
            Log::error('❌ Erreur fatale import ligne DOCKO', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'data' => $data
            ]);
            $this->stats['errors'][] = "Erreur fatale: " . $e->getMessage();
        }
    }

    /**
     * Vérifie si un doublon existe et gère la priorité
     * Retourne true si le doublon est plus récent (à ignorer)
     */
    protected function checkDuplicate($rds, $bca, $adminPrefix)
    {
        // Récupérer tous les enregistrements existants pour ce couple RDS/BCA
        $existing = DockoResponse::where('rds', $rds)
            ->where('bca', $bca)
            ->orderBy('created_at', 'desc')
            ->get();

        if ($existing->isEmpty()) {
            Log::info("✅ Pas de doublon pour {$rds} - {$bca}");
            return false;
        }

        Log::info("🔍 {$existing->count()} enregistrement(s) existant(s) pour {$rds} - {$bca}");

        // Si le nouveau n'a pas de prefix, on considère qu'il est moins prioritaire
        if (empty($adminPrefix)) {
            Log::info("⏭️ Nouvel enregistrement sans prefix, ignoré car des versions existent");
            return true;
        }

        // Extraire la date du prefix (format: YYYYMMDD_HHMM ou similaire)
        $newDate = $this->extractDateFromPrefix($adminPrefix);
        
        if (!$newDate) {
            // Si on ne peut pas extraire la date, on garde l'existant par précaution
            Log::warning("⚠️ Impossible d'extraire la date du prefix: {$adminPrefix}");
            return true;
        }

        Log::info("📅 Date du nouveau prefix: " . $newDate->format('Y-m-d H:i:s'));

        // Vérifier si un enregistrement existant a un prefix plus récent
        foreach ($existing as $record) {
            $existingPrefix = $record->admin_prefix;
            if (empty($existingPrefix)) {
                continue;
            }
            
            $existingDate = $this->extractDateFromPrefix($existingPrefix);
            
            if ($existingDate) {
                Log::info("📅 Date du prefix existant: " . $existingDate->format('Y-m-d H:i:s') . " ({$existingPrefix})");
                
                if ($existingDate >= $newDate) {
                    Log::info("⏭️ Doublon avec prefix plus récent: {$existingPrefix} >= {$adminPrefix}");
                    return true; // Le nouveau est moins récent, on l'ignore
                }
            }
        }

        // Si le nouveau est plus récent, supprimer les anciens
        if ($newDate) {
            Log::info("🔄 Nouvelle version plus récente détectée: {$adminPrefix}");
            
            // Supprimer les anciens enregistrements
            $deleted = DockoResponse::where('rds', $rds)
                ->where('bca', $bca)
                ->delete();
            
            Log::info("🗑️ {$deleted} ancien(s) enregistrement(s) supprimé(s) pour {$rds} - {$bca}");
            
            return false; // On peut importer le nouveau
        }

        return false;
    }

    /**
     * Extrait la date du prefix
     */
    protected function extractDateFromPrefix($prefix)
    {
        // Nettoyer le prefix
        $prefix = trim($prefix);
        
        // Format: YYYYMMDD_HHMM (ex: 20260824_1220)
        if (preg_match('/(\d{8})[_\s-]?(\d{4})/', $prefix, $matches)) {
            try {
                $dateStr = $matches[1];
                $timeStr = $matches[2] ?? '0000';
                return Carbon::createFromFormat('Ymd_His', $dateStr . '_' . $timeStr . '00');
            } catch (\Exception $e) {
                // Ignorer
            }
        }
        
        // Format: YYYYMMDD (ex: 20260824)
        if (preg_match('/(\d{8})/', $prefix, $matches)) {
            try {
                return Carbon::createFromFormat('Ymd', $matches[1]);
            } catch (\Exception $e) {
                // Ignorer
            }
        }
        
        // Format: YYYY-MM-DD (ex: 2026-08-24)
        if (preg_match('/(\d{4})-(\d{2})-(\d{2})/', $prefix, $matches)) {
            try {
                return Carbon::createFromFormat('Y-m-d', $matches[0]);
            } catch (\Exception $e) {
                // Ignorer
            }
        }
        
        return null;
    }

    /**
     * Trouve ou crée une commande
     */
    protected function findOrCreateCommand($rds, $bca, $data)
    {
        // 1. Recherche dans VisiteTechnique
        $commande = VisiteTechnique::where('admin_rds', $rds)
            ->where('admin_bca', $bca)
            ->first();

        if ($commande) {
            Log::info("✅ Commande VT trouvée: id={$commande->id}");
            return (object) [
                'model' => $commande,
                'type' => 'vt',
                'is_new' => false
            ];
        }

        // 2. Recherche dans Raccordement
        $commande = Raccordement::where('admin_rds', $rds)
            ->where('admin_bca', $bca)
            ->first();

        if ($commande) {
            Log::info("✅ Commande Raccordement trouvée: id={$commande->id}");
            return (object) [
                'model' => $commande,
                'type' => 'raccordement',
                'is_new' => false
            ];
        }

        // 3. Création automatique (si activée)
        if ($this->autoCreateCommands) {
            Log::warning("⚠️ Commande non trouvée, création automatique", [
                'rds' => $rds,
                'bca' => $bca
            ]);

            try {
                $commande = $this->createCommand($rds, $bca, $data);
                
                if ($commande) {
                    $this->stats['created']++;
                    return (object) [
                        'model' => $commande,
                        'type' => 'vt',
                        'is_new' => true
                    ];
                }
            } catch (\Exception $e) {
                Log::error("❌ Erreur création commande", [
                    'error' => $e->getMessage(),
                    'rds' => $rds,
                    'bca' => $bca
                ]);
                return null;
            }
        }

        // 4. Si création non activée, on log et on skip
        Log::warning("❌ Commande non trouvée et création désactivée", [
            'rds' => $rds,
            'bca' => $bca
        ]);
        
        return null;
    }

    /**
     * Crée une nouvelle commande VisiteTechnique avec les données disponibles
     */
    protected function createCommand($rds, $bca, $data)
    {
        $createData = [
            'admin_rds' => $rds,
            'admin_bca' => $bca,
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ];

        // Ajouter les champs disponibles
        $fieldMapping = [
            'admin_contract' => 'admin_contract',
            'admin_prefix' => 'admin_prefix',
            'operator_name' => 'operator_name',
            'operator_client_ref' => 'operator_client_ref',
            'project_name' => 'project_name',
            'order_date' => 'order_date',
            'techno' => 'techno',
            'bandwith' => 'bandwith',
            'network' => 'network',
            'nro_name' => 'nro_name',
            'nro_port' => 'nro_port',
            'offer' => 'offer',
            'oi_reference' => 'oi_reference',
            'rop_ref' => 'rop_ref',
            'address_site_a_name' => 'address_site_a_name',
            'address_site_a_street' => 'address_site_a_street',
            'address_site_a_town' => 'address_site_a_town',
            'address_site_a_postal' => 'address_site_a_postal',
            'address_site_a_x' => 'address_site_a_x',
            'address_site_a_y' => 'address_site_a_y',
            'insee_code' => 'insee_code',
            'building_code' => 'building_code',
            'contact_on_site_firstname' => 'contact_on_site_firstname',
            'contact_on_site_lastname' => 'contact_on_site_lastname',
            'contact_on_site_phone' => 'contact_on_site_phone',
            'contact_on_site_mail' => 'contact_on_site_mail',
        ];

        foreach ($fieldMapping as $csvField => $dbField) {
            if (isset($data[$csvField]) && !empty($data[$csvField])) {
                // Gestion spéciale pour les dates
                if (in_array($dbField, ['order_date', 'begin_client_wait', 'client_wait_end', 'cancellation_date'])) {
                    try {
                        $createData[$dbField] = Carbon::parse($data[$csvField])->format('Y-m-d');
                    } catch (\Exception $e) {
                        Log::warning("Date invalide pour {$csvField}: {$data[$csvField]}");
                        $createData[$dbField] = null;
                    }
                } else {
                    $createData[$dbField] = $data[$csvField];
                }
            }
        }

        // Filtrer les champs qui existent dans la table
        try {
            $tableColumns = Schema::getColumnListing('visite_techniques');
            $createData = array_filter($createData, function($key) use ($tableColumns) {
                return in_array($key, $tableColumns);
            }, ARRAY_FILTER_USE_KEY);
        } catch (\Exception $e) {
            Log::warning("Impossible de récupérer les colonnes de la table");
        }

        Log::info("📝 Création commande avec les données:", $createData);

        return VisiteTechnique::create($createData);
    }

    /**
     * Récupère ou crée l'action associée
     */
    protected function getOrCreateAction($commande)
    {
        if ($commande->type === 'vt') {
            $action = VisiteTechniqueAction::where('visite_technique_id', $commande->model->id)
                ->where('action_type', VisiteTechniqueAction::ACTION_LIVRAISON_CRVT)
                ->first();

            if (!$action) {
                Log::info("📝 Création action VT pour commande {$commande->model->id}");
                
                $data = [
                    'visite_technique_id' => $commande->model->id,
                    'action_type' => VisiteTechniqueAction::ACTION_LIVRAISON_CRVT,
                    'status' => 'pending',
                    'created_by' => auth()->id() ?? 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                    'source_file' => $this->currentSourceFile ?? 'auto_import_' . date('Ymd_His'),
                ];
                
                // Ajouter les champs optionnels s'ils existent
                try {
                    $columns = Schema::getColumnListing('visite_technique_actions');
                    
                    if (in_array('prefix', $columns)) {
                        $data['prefix'] = 'VT-' . $commande->model->id . '-' . date('YmdHis');
                    }
                    if (in_array('code', $columns)) {
                        $data['code'] = 'VT-ACT-' . $commande->model->id . '-' . date('YmdHis');
                    }
                    if (in_array('docko_status', $columns)) {
                        $data['docko_status'] = null;
                    }
                    if (in_array('docko_fail_reason', $columns)) {
                        $data['docko_fail_reason'] = null;
                    }
                    if (in_array('docko_comment', $columns)) {
                        $data['docko_comment'] = null;
                    }
                    if (in_array('docko_effective_date', $columns)) {
                        $data['docko_effective_date'] = null;
                    }
                } catch (\Exception $e) {
                    Log::warning("Impossible de vérifier les colonnes de visite_technique_actions");
                }
                
                $action = VisiteTechniqueAction::create($data);
                Log::info("✅ Action VT créée: id={$action->id}");
            }
            return $action;
        } else {
            $action = RaccordementAction::where('raccordement_id', $commande->model->id)
                ->where('action_type', RaccordementAction::ACTION_LIVRAISON_CR)
                ->first();

            if (!$action) {
                Log::info("📝 Création action Raccordement pour commande {$commande->model->id}");
                
                $data = [
                    'raccordement_id' => $commande->model->id,
                    'action_type' => RaccordementAction::ACTION_LIVRAISON_CR,
                    'status' => 'pending',
                    'created_by' => auth()->id() ?? 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                    'source_file' => $this->currentSourceFile ?? 'auto_import_' . date('Ymd_His'),
                ];
                
                // Ajouter les champs optionnels s'ils existent
                try {
                    $columns = Schema::getColumnListing('raccordement_actions');
                    
                    if (in_array('prefix', $columns)) {
                        $data['prefix'] = 'RACC-' . $commande->model->id . '-' . date('YmdHis');
                    }
                    if (in_array('code', $columns)) {
                        $data['code'] = 'RACC-ACT-' . $commande->model->id . '-' . date('YmdHis');
                    }
                    if (in_array('docko_status', $columns)) {
                        $data['docko_status'] = null;
                    }
                    if (in_array('docko_fail_reason', $columns)) {
                        $data['docko_fail_reason'] = null;
                    }
                    if (in_array('docko_comment', $columns)) {
                        $data['docko_comment'] = null;
                    }
                    if (in_array('docko_effective_date', $columns)) {
                        $data['docko_effective_date'] = null;
                    }
                } catch (\Exception $e) {
                    Log::warning("Impossible de vérifier les colonnes de raccordement_actions");
                }
                
                $action = RaccordementAction::create($data);
                Log::info("✅ Action Raccordement créée: id={$action->id}");
            }
            return $action;
        }
    }

    /**
     * Traite la réponse DOCKO avec les nouveaux champs
     */
    protected function processDockoResponse($data, $commande, $action, $zipFilename)
    {
        $failReason = $data['fail_reason'] ?? null;
        $isAccepted = empty($failReason) || trim($failReason) === '';

        // Récupérer admin_contract et admin_prefix
        $adminContract = $data['admin_contract'] ?? null;
        $adminPrefix = $data['admin_prefix'] ?? null;

        Log::info("📝 Création DockoResponse avec:", [
            'rds' => $data['admin_rds'] ?? $data['rds'] ?? null,
            'bca' => $data['admin_bca'] ?? $data['bca'] ?? null,
            'admin_contract' => $adminContract,
            'admin_prefix' => $adminPrefix,
        ]);

        // Créer DockoResponse avec les nouveaux champs
        $dockoResponse = DockoResponse::create([
            'rds' => $data['admin_rds'] ?? $data['rds'] ?? null,
            'bca' => $data['admin_bca'] ?? $data['bca'] ?? null,
            'admin_contract' => $adminContract,
            'admin_prefix' => $adminPrefix,
            'commande_type' => $commande->type,
            'commande_id' => $commande->model->id,
            'action_id' => $action->id,
            'action_type' => $commande->type === 'vt' ? 'livraison_crvt' : 'livraison_cr',
            'status' => $isAccepted ? 'accepte' : 'refuse',
            'fail_reason' => $failReason,
            'comment' => $data['comment'] ?? null,
            'effective_date' => now(),
            'source_file' => $zipFilename,
            'imported_at' => now(),
            'is_read' => false,
        ]);

        Log::info("✅ DockoResponse créé: id={$dockoResponse->id}");

        // Mettre à jour l'action avec vérification des colonnes
        try {
            $table = $commande->type === 'vt' ? 'visite_technique_actions' : 'raccordement_actions';
            $tableColumns = Schema::getColumnListing($table);
            
            $updateData = [];
            if (in_array('docko_status', $tableColumns)) {
                $updateData['docko_status'] = $isAccepted ? 'accepte' : 'refuse';
            }
            if (in_array('docko_fail_reason', $tableColumns)) {
                $updateData['docko_fail_reason'] = $failReason;
            }
            if (in_array('docko_comment', $tableColumns)) {
                $updateData['docko_comment'] = $data['comment'] ?? null;
            }
            if (in_array('docko_effective_date', $tableColumns)) {
                $updateData['docko_effective_date'] = now();
            }
            
            if (!empty($updateData)) {
                $action->update($updateData);
                Log::info("✅ Action mise à jour avec les données DOCKO");
            }
        } catch (\Exception $e) {
            Log::warning("⚠️ Impossible de mettre à jour l'action: " . $e->getMessage());
        }

        // Mettre à jour la commande
        $commande->model->status = $isAccepted ? 'completed' : 'failed';
        $commande->model->save();

        // Créer une notification
        $title = $isAccepted ? '✅ CRVT accepté' : '❌ CRVT refusé';
        $message = "Le CRVT pour {$commande->model->admin_rds} - {$commande->model->admin_bca} a été " 
            . ($isAccepted ? 'accepté' : 'refusé')
            . ($failReason ? " : {$failReason}" : '')
            . ($commande->is_new ? " (⚠️ Commande créée automatiquement)" : '');

        Notification::create([
            'type' => 'docko',
            'title' => $title,
            'message' => $message,
            'link' => $commande->type === 'vt'
                ? route('visites-techniques.show', $commande->model->id)
                : route('raccordements.show', $commande->model->id),
            'is_read' => false,
            'created_at' => now(),
        ]);

        Log::info("✅ Notification créée");
    }

    /**
     * Retourne les statistiques
     */
    public function getStats()
    {
        return $this->stats;
    }

    /**
     * Retourne le résultat formaté
     */
    protected function getResult()
    {
        return [
            'success' => empty($this->stats['errors']),
            'stats' => $this->stats,
        ];
    }
}
