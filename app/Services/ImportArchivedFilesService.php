<?php

namespace App\Services;

use App\Models\VisiteTechnique;
use App\Models\VisiteTechniqueAction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use ZipArchive;
use Carbon\Carbon;
use App\Models\Notification;
use App\Traits\ImportNotifierTrait;


class ImportArchivedFilesService
{
    use ImportNotifierTrait;
    protected $stats = [
        'processed' => 0,
        'imported' => 0,
        'skipped' => 0,
        'errors' => [],
        'details' => []
    ];
    
    // Types de fichiers autorisés pour les VT
    protected $allowedPrefixes = [
        'OTPLANIFVTDATE' => VisiteTechniqueAction::ACTION_DEMANDE,
        'PLANIFVTDATE' => VisiteTechniqueAction::ACTION_PLANIFICATION,
        'PLANIFDATEVTKO' => VisiteTechniqueAction::ACTION_IMPOSSIBILITE,
        'CRVTCLI' => VisiteTechniqueAction::ACTION_LIVRAISON_CRVT,
	    'DOCKO' => VisiteTechniqueAction::ACTION_CRVT_RECU,
        'EDITPLANIFDATE' => VisiteTechniqueAction::ACTION_MODIFICATION_DATE
    ];
    
    /**
     * Importe les fichiers depuis le SFTP /OUT (sftp_in) et les archives
     */
    public function importFromAllSources($prefix = null, $force = false)
    {
        DB::beginTransaction();

        try {
            $this->resetStats();
            $this->resetProcessedFiles();
            $this->newFilesCount = 0; // Réinitialiser le compteur

            // ✅ 1. Importer depuis le SFTP /OUT (sftp_in) - LECTURE SEULEMENT, PAS DE SUPPRESSION
            $this->importFromSftpOut($prefix, $force);

            // 2. Importer depuis les archives locales (fichiers déjà traités)
            $this->importFromArchive($prefix, $force);

            DB::commit();

            // 🔔 Envoyer la notification UNIQUEMENT si de nouveaux fichiers OTPLANIFVTDATE ont été importés
            if ($this->newFilesCount > 0) {
                // On reconstruit la liste des fichiers à partir de $this->processedFiles
              //  $this->sendNotificationIfNeeded('OTPLANIFVTDATE');
            } else {
                Log::info('Aucun nouveau fichier OTPLANIFVTDATE à notifier.');
            }

            Log::info('Import des VT terminé', $this->stats);

            return $this->getResult();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur import VT', ['error' => $e->getMessage()]);
            $this->stats['errors'][] = $e->getMessage();

            return $this->getResult();
        }
    }
    
    /**
     * ✅ Importe depuis le SFTP /OUT (disque sftp_in) - LECTURE SEULEMENT
     * Les fichiers sont lus, copiés localement, mais JAMAIS supprimés du serveur
     */
    protected function importFromSftpOut($prefix = null, $force = false)
    {
        try {
            $diskIn = Storage::disk('sftp_in');
            $files = $diskIn->files('/');

            if (empty($files)) {
                Log::info('📭 Aucun fichier trouvé sur le SFTP /OUT (sftp_in)');
                return;
            }

            Log::info("📁 Fichiers trouvés sur SFTP /OUT: " . count($files));

            $zipFiles = collect($files)
                ->filter(fn($f) => strtolower(pathinfo($f, PATHINFO_EXTENSION)) === 'zip')
                ->values();

            Log::info("📦 Fichiers ZIP trouvés sur SFTP /OUT: " . $zipFiles->count());

            foreach ($zipFiles as $zipFile) {
                $filename = basename($zipFile);
                $prefixFile = explode('_', $filename)[0];

                Log::info("📄 Traitement du fichier: {$filename} (préfixe: {$prefixFile})");

                if (!isset($this->allowedPrefixes[$prefixFile])) {
                    Log::info("⏭️ Fichier ignoré (préfixe non autorisé): {$filename}");
                    continue;
                }

                if ($prefix && $prefix !== 'all' && $prefixFile !== $prefix) {
                    Log::info("⏭️ Fichier ignoré (préfixe ne correspond pas à {$prefix})");
                    continue;
                }

                $this->processSftpFile($diskIn, $zipFile, $force, 'SFTP/OUT');
            }

        } catch (\Exception $e) {
            Log::error('❌ Erreur lors de la lecture SFTP /OUT', [
                'error' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * ✅ Traite un fichier ZIP depuis le SFTP - LECTURE SEULEMENT, PAS DE SUPPRESSION
     */
     protected function processSftpFile($disk, $zipPath, $force, $source)
    {
        $filename = basename($zipPath);
        $prefix = explode('_', $filename)[0];

        if (!isset($this->allowedPrefixes[$prefix])) {
            return;
        }

        // Vérifier si le fichier est nouveau (non encore archivé)
        $archiveDir = storage_path('app/archives/' . $prefix . '/');
        $archivePath = $archiveDir . $filename;
        $isNew = !file_exists($archivePath);

        // Si c'est un OTPLANIFVTDATE et qu'il est nouveau, on l'ajoute à la liste et on incrémente
        if ($prefix === 'OTPLANIFVTDATE' && $isNew) {
            $this->addProcessedFile($filename);
            $this->newFilesCount++;
            Log::info("📦 Nouveau fichier OTPLANIFVTDATE détecté (SFTP): {$filename}");
        }

        $actionType = $this->allowedPrefixes[$prefix];
        $this->stats['processed']++;

        try {
            Log::info("📂 Traitement du fichier: {$filename} (source: {$source})");

            $stream = $disk->readStream($zipPath);
            $zipContent = stream_get_contents($stream);
            fclose($stream);

            $tempDir = storage_path('app/temp/' . uniqid());
            File::makeDirectory($tempDir, 0755, true);

            $tempZipPath = $tempDir . '/' . $filename;
            file_put_contents($tempZipPath, $zipContent);

            $zip = new ZipArchive();
            if ($zip->open($tempZipPath) !== TRUE) {
                throw new \Exception("Impossible d'ouvrir le fichier ZIP");
            }

            $zip->extractTo($tempDir);
            $zip->close();

            $csvFiles = File::glob($tempDir . '/*.csv');
            Log::info("📄 Fichiers CSV extraits: " . count($csvFiles));

            foreach ($csvFiles as $csvPath) {
                $this->processCsvFile($csvPath, $filename, $prefix, $actionType, $force, $source);
            }

            // ✅ Archiver le fichier localement (copie)
            $this->archiveLocalFile($tempZipPath, $filename, $prefix);

            Log::info("✅ Fichier traité et archivé, CONSERVÉ sur SFTP: {$filename}");

            File::deleteDirectory($tempDir);

        } catch (\Exception $e) {
            $this->stats['errors'][] = "Erreur traitement {$filename}: " . $e->getMessage();
            Log::error('❌ Erreur traitement fichier SFTP', [
                'file' => $filename,
                'error' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * ✅ Archive le fichier localement (copie, pas de suppression)
     */
    protected function archiveLocalFile($tempZipPath, $filename, $prefix)
    {
        try {
            $archiveDirectory = storage_path('app/archives/');
            if (!File::isDirectory($archiveDirectory)) {
                File::makeDirectory($archiveDirectory, 0755, true);
            }

            $prefixArchiveDir = $archiveDirectory . $prefix . '/';
            if (!File::isDirectory($prefixArchiveDir)) {
                File::makeDirectory($prefixArchiveDir, 0755, true);
            }

            $archivePath = $prefixArchiveDir . $filename;

            if (!file_exists($archivePath)) {
                copy($tempZipPath, $archivePath);
                $this->stats['details'][] = "📦 Fichier archivé localement: {$prefix}/{$filename}";
                Log::info("📦 Fichier archivé localement: {$prefix}/{$filename}");
            } else {
                $this->stats['details'][] = "ℹ️ Fichier déjà archivé: {$prefix}/{$filename}";
                Log::info("ℹ️ Fichier déjà présent dans l'archive: {$prefix}/{$filename}");
            }

        } catch (\Exception $e) {
            Log::warning('⚠️ Erreur lors de l\'archivage', [
                'file' => $filename,
                'error' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Importe depuis le dossier d'archive local
     */
     public function importFromArchive($prefix = null, $force = false)
    {
        $archiveDirectory = storage_path('app/archives/');

        if (!File::isDirectory($archiveDirectory)) {
            return;
        }

        $directories = [];

        if ($prefix && $prefix !== 'all') {
            $specificDir = $archiveDirectory . $prefix;
            if (File::isDirectory($specificDir)) {
                $directories[] = $specificDir;
            }
        } else {
            foreach ($this->allowedPrefixes as $allowedPrefix => $actionType) {
                $dir = $archiveDirectory . $allowedPrefix;
                if (File::isDirectory($dir)) {
                    $directories[] = $dir;
                }
            }
        }

        foreach ($directories as $dir) {
            $this->processArchiveDirectory($dir, $force);
        }
    }
    
    /**
     * Traite un dossier d'archive
     */
   protected function processArchiveDirectory($directory, $force)
    {
        $dirName = basename($directory);

        if (!isset($this->allowedPrefixes[$dirName])) {
            return;
        }

        $actionType = $this->allowedPrefixes[$dirName];
        Log::info("📁 Traitement du dossier d'archive: {$dirName}");

        $zipFiles = File::glob($directory . '/*.zip');

        foreach ($zipFiles as $zipPath) {
            $this->processArchiveZipFile($zipPath, $force, $dirName, $actionType);
        }
    }
    
    /**
     * Traite un fichier ZIP d'archive
     */
    protected function processArchiveZipFile($zipPath, $force, $prefix, $actionType)
    {
        $filename = basename($zipPath);
        $this->stats['processed']++;

        try {
            $tempDir = storage_path('app/temp/' . uniqid());
            File::makeDirectory($tempDir, 0755, true);

            $zip = new ZipArchive();
            if ($zip->open($zipPath) !== TRUE) {
                throw new \Exception("Impossible d'ouvrir le fichier ZIP");
            }

            $zip->extractTo($tempDir);
            $zip->close();

            $csvFiles = File::glob($tempDir . '/*.csv');

            foreach ($csvFiles as $csvPath) {
                $this->processCsvFile($csvPath, $filename, $prefix, $actionType, $force, 'ARCHIVE');
            }

            File::deleteDirectory($tempDir);

        } catch (\Exception $e) {
            $this->stats['errors'][] = "Erreur traitement {$filename}: " . $e->getMessage();
        }
    }
    
    /**
     * Traite un fichier CSV
     */
    protected function processCsvFile($csvPath, $zipFilename, $prefix, $actionType, $force, $source)
    {
        try {
            $fileHandle = fopen($csvPath, 'r');
            $headers = fgetcsv($fileHandle, 0, ',');
            
            if (!$headers) {
                fclose($fileHandle);
                return;
            }
            
            $fileInfo = $this->parseFileInfo($zipFilename);
            
            while (($row = fgetcsv($fileHandle, 0, ',')) !== FALSE) {
                if (count($headers) === count($row)) {
                    $rowData = array_combine($headers, $row);
                    $this->importRow($rowData, $zipFilename, $prefix, $actionType, $fileInfo, $force, $source);
                }
            }
            
            fclose($fileHandle);
            
        } catch (\Exception $e) {
            Log::error('Erreur traitement CSV', [
                'file' => $csvPath,
                'error' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Importe une ligne du CSV
     */
    protected function importRow($rowData, $sourceFile, $prefix, $actionType, $fileInfo, $force, $source)
    {
        try {
            $rds = $rowData['admin_rds'] ?? $rowData['rds'] ?? null;
            $bca = $rowData['admin_bca'] ?? $rowData['bca'] ?? null;
            
            if (!$rds || !$bca) {
                $this->stats['skipped']++;
                return;
            }
            
            Log::info("📝 Import ligne: RDS={$rds}, BCA={$bca}, action={$actionType}, source={$source}");
            
            $visite = VisiteTechnique::where('admin_rds', $rds)
                ->where('admin_bca', $bca)
                ->first();
            
            if (!$visite) {
                $visite = $this->createVisiteTechnique($rowData);
                $this->stats['details'][] = "✨ Visite créée: {$rds} - {$bca}";
            }
            
            $existingAction = VisiteTechniqueAction::where('visite_technique_id', $visite->id)
                ->where('action_type', $actionType)
                ->where('source_file', $sourceFile)
                ->first();
            
            if ($existingAction && !$force) {
                $this->stats['skipped']++;
                return;
            }
            
            if ($existingAction && $force) {
                $existingAction->delete();
            }
            
            $action = $this->createAction($visite->id, $rowData, $sourceFile, $prefix, $actionType, $fileInfo, $source);
            $action->save();
            \Log::info('Création notification', ['rds' => $rds, 'bca' => $bca]);
		if (!$existingAction) {
    // Déterminer le type d’événement (titre, message)
    $title = 'Nouvelle demande de visite technique';
    $message = "Nouvelle VT : {$rds} - {$bca}";
    $link = route('visites-techniques.show', $visite->id);
    Notification::create([
        'type' => 'vt',
        'title' => $title,
        'message' => $message,
        'link' => $link,
    ]);
}

		if ($actionType === VisiteTechniqueAction::ACTION_CRVT_RECU) {
    $visite->status = ($action->crvt_recu_result_status === 'OK') ? 'completed' : 'failed';
    $visite->save();
}		            
            $this->stats['imported']++;
            
            Log::info('✅ Action VT importée', [
                'visite' => "{$rds} - {$bca}",
                'action' => $actionType,
                'file' => $sourceFile
            ]);
            
        } catch (\Exception $e) {
            $this->stats['errors'][] = "Erreur import ligne: " . $e->getMessage();
        }
    }
    
    protected function createVisiteTechnique($rowData)
    {
        $visite = new VisiteTechnique();
        $visite->admin_rds = $rowData['admin_rds'] ?? null;
        $visite->admin_bca = $rowData['admin_bca'] ?? null;
        $visite->admin_contract = $rowData['admin_contract'] ?? null;
        $visite->project_name = $rowData['project_name'] ?? null;
        $visite->operator_name = $rowData['operator_name'] ?? null;
        $visite->techno = $rowData['techno'] ?? null;
        $visite->address_site_a_name = $rowData['address_site_a_name'] ?? null;
        $visite->address_site_a_street = $rowData['address_site_a_street'] ?? null;
        $visite->address_site_a_postal = $rowData['address_site_a_postal'] ?? null;
        $visite->address_site_a_town = $rowData['address_site_a_town'] ?? null;
        $visite->address_site_a_x = $this->formatCoordinate($rowData['address_site_a_x'] ?? null);
        $visite->address_site_a_y = $this->formatCoordinate($rowData['address_site_a_y'] ?? null);
        $visite->contact_on_site_firstname = $rowData['contact_on_site_firstname'] ?? null;
        $visite->contact_on_site_lastname = $rowData['contact_on_site_lastname'] ?? null;
        $visite->contact_on_site_phone = $rowData['contact_on_site_phone'] ?? null;
        $visite->contact_on_site_mail = $rowData['contact_on_site_mail'] ?? null;
        $visite->covage_contact_name = $rowData['covage_contact_name'] ?? null;
        $visite->client_directive_access = $rowData['client_directive_access'] ?? null;
        $visite->client_directive_intervention = $rowData['client_directive_intervention'] ?? null;
        $visite->client_directive_planning = $rowData['client_directive_planning'] ?? null;
        $visite->order_date = $this->formatDate($rowData['order_date'] ?? null);
        $visite->one_shot_info=$rowData['one_shot_info']?? false;
         $visite->oi_reference = $rowData['oi_reference'] ?? null;
        $visite->rop_ref = $rowData['rop_ref'] ?? null;

        $visite->save();
        
        return $visite;
    }
    
   protected function createAction($visiteId, $rowData, $sourceFile, $prefix, $actionType, $fileInfo, $source)
{
    $action = new VisiteTechniqueAction();
    $action->visite_technique_id = $visiteId;
    $action->action_type = $actionType;
    $action->prefix = $prefix;
    $action->source_file = $sourceFile;
    $action->source = $source;
    $action->file_date = $fileInfo['date'] ?? null;
    $action->file_time = $fileInfo['time'] ?? null;
    $action->file_timestamp = $fileInfo['timestamp'] ?? time();

    switch ($actionType) {
        case VisiteTechniqueAction::ACTION_DEMANDE:
            $action->demande_comment = $rowData['comment'] ?? null;
            break;
        case VisiteTechniqueAction::ACTION_PLANIFICATION:
            $action->planning_date = $this->formatDate($rowData['planning_date'] ?? null);
            $action->planning_comment = $rowData['comment'] ?? null;
            break;
        case VisiteTechniqueAction::ACTION_IMPOSSIBILITE:
            $action->impossibility_fail_reason = $rowData['fail_reason'] ?? null;
            $action->impossibility_comment = $rowData['comment'] ?? null;
            break;
        case VisiteTechniqueAction::ACTION_LIVRAISON_CRVT:
            $action->crvt_effective_date = $this->formatDate($rowData['effective_date'] ?? null);
            $action->crvt_comment = $rowData['comment'] ?? null;
            $action->crvt_result_status = $rowData['result_status'] ?? null;
            break;
        case VisiteTechniqueAction::ACTION_CRVT_RECU:   // Ajout pour DOCKO
            $action->crvt_recu_effective_date = $this->formatDate($rowData['effective_date'] ?? $rowData['intervention_date'] ?? null);
            $action->crvt_recu_result_status = $rowData['result_status'] ?? $rowData['resultat'] ?? null;
            $action->crvt_recu_fail_reason = $rowData['fail_reason'] ?? $rowData['motif_echec'] ?? null;
            $action->crvt_recu_comment = $rowData['comment'] ?? null;
            break;
        
    }

    // Champs communs
    $action->bandwidth = $rowData['bandwith'] ?? null;
    $action->nro_name = $rowData['nro_name'] ?? null;
    $action->nro_port = $rowData['nro_port'] ?? null;
    $action->bpe_piquage = $rowData['bpe_piquage'] ?? null;
    $action->building_code = $rowData['building_code'] ?? null;
    $action->equipement_number = $rowData['equipement_number'] ?? null;
    $action->mer_number = $rowData['mer_number'] ?? null;
    $action->insee_code = $rowData['insee_code'] ?? null;
    $action->article_designation = $rowData['article_designation'] ?? null;
    $action->raw_data = $rowData;
    $action->imported_at = now();

    return $action;
}
    
    protected function parseFileInfo($filename)
    {
        $name = str_replace('.zip', '', $filename);
        $parts = explode('_', $name);
        
        $info = [
            'date' => null,
            'time' => null,
            'timestamp' => time(),
        ];
        
        if (isset($parts[3]) && strlen($parts[3]) == 8 && ctype_digit($parts[3])) {
            $info['date'] = $parts[3];
            $year = substr($info['date'], 0, 4);
            $month = substr($info['date'], 4, 2);
            $day = substr($info['date'], 6, 2);
            $info['timestamp'] = strtotime("$year-$month-$day");
            
            if (isset($parts[4]) && strlen($parts[4]) == 4 && ctype_digit($parts[4])) {
                $info['time'] = $parts[4];
                $hour = substr($info['time'], 0, 2);
                $minute = substr($info['time'], 2, 2);
                $info['timestamp'] = strtotime("$year-$month-$day $hour:$minute:00");
            }
        }
        
        return $info;
    }
    
    protected function formatCoordinate($value)
    {
        if (empty($value)) return null;
        return (float) str_replace(',', '.', $value);
    }
    
    protected function formatDate($value)
    {
        if (empty($value)) return null;
        try {
            return Carbon::parse($value)->format('Y-m-d');
        } catch (\Exception $e) {
            return null;
        }
    }
    
    protected function resetStats()
    {
        $this->stats = [
            'processed' => 0,
            'imported' => 0,
            'skipped' => 0,
            'errors' => [],
            'details' => []
        ];
    }
    
    protected function getResult()
    {
        return [
            'success' => empty($this->stats['errors']),
            'stats' => $this->stats
        ];
    }
}
