<?php

namespace App\Services;

use App\Models\Raccordement;
use App\Models\RaccordementAction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use ZipArchive;
use Carbon\Carbon;
use App\Models\AttenteClient;
use App\Mail\NewFileNotification;
use Illuminate\Support\Facades\Mail;
use App\Traits\ImportNotifierTrait; 


class ImportRaccordementArchivesService
{
    use ImportNotifierTrait;

    protected $stats = [
        'processed' => 0,
        'imported' => 0,
        'skipped' => 0,
        'errors' => [],
        'details' => []
    ];
    
    // Types de fichiers autorisés pour les raccordements
    protected $allowedPrefixes = [
        
        'PLANIFRACCODATE' => RaccordementAction::ACTION_PLANIFICATION,
        'PLANIFRACCODATEKO' => RaccordementAction::ACTION_IMPOSSIBILITE,
        'CRIDOCCLI' => RaccordementAction::ACTION_LIVRAISON_CR,
        'DOEDOC' => RaccordementAction::ACTION_LIVRAISON_DOE,
        'DFTDOC' => RaccordementAction::ACTION_LIVRAISON_DFT,
        
	
    ];
    
    public function importFromAllSources($prefix = null, $force = false)
    {
        DB::beginTransaction();

        try {
            $this->resetStats();
            $this->resetProcessedFiles();
            $this->newFilesCount = 0; // Réinitialiser le compteur

            // 1. Importer depuis le SFTP /OUT (sftp_out)
            $this->importFromSftpOut($prefix, $force);

            // 2. Importer depuis les archives locales
            $this->importFromArchive($prefix, $force);

            DB::commit();

            // 🔔 Envoyer la notification uniquement si de nouveaux fichiers OTPLANIFRACCODATE ont été traités
            if ($this->newFilesCount > 0) {
               // $this->sendNotificationIfNeeded('OTPLANIFRACCODATE');
            } else {
                Log::info('Aucun nouveau fichier OTPLANIFRACCODATE à notifier');
            }

            Log::info('Import des raccordements terminé', $this->stats);

            return $this->getResult();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur import raccordements', ['error' => $e->getMessage()]);
            $this->stats['errors'][] = $e->getMessage();

            return $this->getResult();
        }
    }

    protected function importFromSftpOut($prefix = null, $force = false)
    {
        try {
            $diskIn = Storage::disk('sftp_out');
            $files = $diskIn->files('/');

            if (empty($files)) {
                Log::info('📭 Aucun fichier trouvé sur le SFTP /OUT (sftp_out) pour les raccordements');
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
            Log::error('❌ Erreur lors de la lecture SFTP /OUT pour les raccordements', [
                'error' => $e->getMessage()
            ]);
        }
    }

    protected function processSftpFile($disk, $zipPath, $force, $source)
    {
        $filename = basename($zipPath);
        $prefix = explode('_', $filename)[0];

        if (!isset($this->allowedPrefixes[$prefix])) {
            return;
        }

        // Vérifier si le fichier est déjà archivé
        $archiveDir = storage_path('app/archives/' . $prefix . '/');
        $archivePath = $archiveDir . $filename;
        $isAlreadyArchived = file_exists($archivePath);

        // Si le fichier est déjà archivé, on ne le compte pas comme nouveau
        if ($prefix === 'OTPLANIFRACCODATE' && !$isAlreadyArchived) {
            // C'est un nouveau fichier
            $this->addProcessedFile($filename);
            $this->newFilesCount++;
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

            // Archiver le fichier localement
            $this->archiveLocalFile($tempZipPath, $filename, $prefix);

            // NE PAS SUPPRIMER le fichier du SFTP
            Log::info("✅ Fichier traité et archivé, conservé sur SFTP: {$filename}");

            File::deleteDirectory($tempDir);

        } catch (\Exception $e) {
            $this->stats['errors'][] = "Erreur traitement {$filename}: " . $e->getMessage();
            Log::error('❌ Erreur traitement fichier SFTP raccordement', [
                'file' => $filename,
                'error' => $e->getMessage()
            ]);
        }
    }

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
                $this->stats['details'][] = "📦 Fichier archivé: {$prefix}/{$filename}";
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

            $raccordement = Raccordement::where('admin_rds', $rds)
                ->where('admin_bca', $bca)
                ->first();

            if (!$raccordement) {
                $raccordement = $this->createRaccordement($rowData);
                $this->stats['details'][] = "✨ Raccordement créé: {$rds} - {$bca}";
            }

            $existingAction = RaccordementAction::where('raccordement_id', $raccordement->id)
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

            if ($prefix === 'PLANIFRACCODATE' && $actionType === 'planification') {
                AttenteClient::where('admin_rds', $rds)
                    ->where('admin_bca', $bca)
                    ->where('replanned', false)
                    ->update(['replanned' => true]);
            }

            $action = $this->createAction($raccordement->id, $rowData, $sourceFile, $prefix, $actionType, $fileInfo, $source);
            $action->save();

            $this->stats['imported']++;

            Log::info('✅ Action raccordement importée', [
                'raccordement' => "{$rds} - {$bca}",
                'action' => $actionType,
                'file' => $sourceFile
            ]);

        } catch (\Exception $e) {
            $this->stats['errors'][] = "Erreur import ligne: " . $e->getMessage();
        }
    }
    
    protected function createRaccordement($rowData)
    {
        $raccordement = new Raccordement();
        $raccordement->admin_rds = $rowData['admin_rds'] ?? null;
        $raccordement->admin_bca = $rowData['admin_bca'] ?? null;
        $raccordement->admin_contract = $rowData['admin_contract'] ?? null;
        $raccordement->admin_prefix = $rowData['admin_prefix'] ?? null;
        $raccordement->project_name = $rowData['project_name'] ?? null;
        $raccordement->operator_name = $rowData['operator_name'] ?? null;
        $raccordement->techno = $rowData['techno'] ?? null;
        $raccordement->bandwith = $rowData['bandwith'] ?? null;
        $raccordement->network = $rowData['network'] ?? null;
        $raccordement->offer = $rowData['offer'] ?? null;
        $raccordement->address_site_a_name = $rowData['address_site_a_name'] ?? null;
        $raccordement->address_site_a_street = $rowData['address_site_a_street'] ?? null;
        $raccordement->address_site_a_postal = $rowData['address_site_a_postal'] ?? null;
        $raccordement->address_site_a_town = $rowData['address_site_a_town'] ?? null;
        $raccordement->address_site_a_x = $this->formatCoordinate($rowData['address_site_a_x'] ?? null);
        $raccordement->address_site_a_y = $this->formatCoordinate($rowData['address_site_a_y'] ?? null);
        $raccordement->contact_on_site_firstname = $rowData['contact_on_site_firstname'] ?? null;
        $raccordement->contact_on_site_lastname = $rowData['contact_on_site_lastname'] ?? null;
        $raccordement->contact_on_site_phone = $rowData['contact_on_site_phone'] ?? null;
        $raccordement->contact_on_site_mail = $rowData['contact_on_site_mail'] ?? null;
        $raccordement->covage_contact_name = $rowData['covage_contact_name'] ?? null;
        $raccordement->order_date = $this->formatDate($rowData['order_date'] ?? null);
        $raccordement->begin_client_wait = $this->formatDate($rowData['begin_client_wait'] ?? null);
        $raccordement->client_wait_end = $this->formatDate($rowData['client_wait_end'] ?? null);
        $raccordement->nro_name = $rowData['nro_name'] ?? null;
        $raccordement->nro_port = $rowData['nro_port'] ?? null;
        $raccordement->bpe_piquage = $rowData['bpe_piquage'] ?? null;
        $raccordement->building_code = $rowData['building_code'] ?? null;
        $raccordement->equipement_number = $rowData['equipement_number'] ?? null;
        $raccordement->mer_number = $rowData['mer_number'] ?? null;
        $raccordement->insee_code = $rowData['insee_code'] ?? null;
        $raccordement->article_designation = $rowData['article_designation'] ?? null;
        $raccordement->comment = $rowData['comment'] ?? null;
        $raccordement->fail_reason = $rowData['fail_reason'] ?? null;
        $raccordement->save();
        
        return $raccordement;
    }
    
    protected function createAction($raccordementId, $rowData, $sourceFile, $prefix, $actionType, $fileInfo, $source)
    {
        $action = new RaccordementAction();
        $action->raccordement_id = $raccordementId;
        $action->action_type = $actionType;
        $action->prefix = $prefix;
        $action->source_file = $sourceFile;
        $action->source = $source;
        $action->file_date = $fileInfo['date'] ?? null;
        $action->file_time = $fileInfo['time'] ?? null;
        $action->file_timestamp = $fileInfo['timestamp'] ?? time();
        
        switch ($actionType) {
            case RaccordementAction::ACTION_PLANIFICATION:
                $action->planning_date = $this->formatDate($rowData['planning_date'] ?? null);
                $action->planning_comment = $rowData['comment'] ?? null;
                break;
                
            case RaccordementAction::ACTION_IMPOSSIBILITE:
                $action->impossibility_fail_reason = $rowData['fail_reason'] ?? null;
                $action->impossibility_comment = $rowData['comment'] ?? null;
                break;
                
            case RaccordementAction::ACTION_LIVRAISON_CR:
                $action->cr_effective_date = $this->formatDate($rowData['effective_date'] ?? $rowData['intervention_date'] ?? null);
                $action->cr_comment = $rowData['comment'] ?? null;
                $action->cr_result_status = $rowData['result_status'] ?? $rowData['resultat'] ?? null;
                $action->cr_infra_to_be_created = filter_var(
                    $rowData['infra_to_be_created'] ?? $rowData['infra_a_creer'] ?? false,
                    FILTER_VALIDATE_BOOLEAN
                );
                $action->cr_submission_date = $this->formatDate($rowData['submission_date'] ?? $rowData['date_soumission'] ?? null);
                $action->cr_doc_path = $rowData['doc_path'] ?? $rowData['doc'] ?? null;
                break;
                
            case RaccordementAction::ACTION_LIVRAISON_DOE:
                $action->doe_delivery_date = $this->formatDate($rowData['delivery_date'] ?? $rowData['doe_date'] ?? null);
                $action->doe_comment = $rowData['comment'] ?? null;
                $action->doe_gc_length = $this->formatDecimal($rowData['gc_length'] ?? null);
                $action->doe_ml_length_extension = $this->formatDecimal($rowData['ml_length_extension_cable'] ?? null);
                $action->doe_ml_length_private = $this->formatDecimal($rowData['ml_length_racco_cable_private_domain'] ?? null);
                $action->doe_ml_length_public = $this->formatDecimal($rowData['ml_length_racco_cable_public_domain'] ?? null);
                break;
                
            case RaccordementAction::ACTION_LIVRAISON_DFT:
                $action->dft_delivery_date = $this->formatDate($rowData['delivery_date'] ?? $rowData['dft_date'] ?? null);
                $action->dft_comment = $rowData['comment'] ?? null;
                break;

                
        }
        
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
        
        // Format: PREFIXE_RDS_BCA_AAAAMMJJ_HHMM
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
    
    protected function formatDecimal($value)
    {
        if (empty($value)) return null;
        return (float) str_replace(',', '.', $value);
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
