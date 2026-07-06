<?php

namespace App\Services;

use App\Models\RouteOptique;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\File;
use Carbon\Carbon;
use App\Models\Raccordement;
use App\Models\VisiteTechnique;
class RouteoptiqueImportService
{
    protected $stats = [
        'processed' => 0,
        'imported' => 0,
        'skipped' => 0,
        'errors' => []
    ];

    protected $currentRopZipPath = null;

    /**
     * Point d'entrée principal : importe tous les fichiers ROUTEOPTIQUE
     * - Déplace depuis csv_files/ vers archives/ROUTEOPTIQUE/
     * - Puis traite les archives
     */
    public function importFromArchive()
    {
        DB::beginTransaction();

        try {
            $this->resetStats();

            // 1. Déplacer les fichiers depuis csv_files/ vers archives/ROUTEOPTIQUE/
            $this->moveFilesFromCsvFolder();

            // 2. Traiter les fichiers présents dans le dossier d'archive
            $archiveDir = storage_path('app/archives/ROUTEOPTIQUE/');
            if (!File::isDirectory($archiveDir)) {
                Log::warning('Dossier d\'archive ROUTEOPTIQUE introuvable : ' . $archiveDir);
                return $this->getResult();
            }

            $zipFiles = File::glob($archiveDir . 'ROUTEOPTIQUE_*.zip');
            Log::info('📦 Nombre de ZIP ROUTEOPTIQUE trouvés dans archives : ' . count($zipFiles));

            foreach ($zipFiles as $zipPath) {
                $this->processZipFile($zipPath);
            }

            DB::commit();

            Log::info('✅ Import ROUTEOPTIQUE terminé', $this->stats);
            return $this->getResult();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('❌ Erreur import ROUTEOPTIQUE', ['error' => $e->getMessage()]);
            $this->stats['errors'][] = $e->getMessage();
            return $this->getResult();
        }
    }

    /**
     * Déplace les fichiers ZIP ROUTEOPTIQUE depuis csv_files/ vers archives/ROUTEOPTIQUE/
     */
    protected function moveFilesFromCsvFolder()
    {
        $csvDir = storage_path('app/csv_files/');
        if (!File::isDirectory($csvDir)) {
            Log::info('Dossier csv_files introuvable : ' . $csvDir);
            return;
        }

        $files = File::glob($csvDir . 'ROUTEOPTIQUE_*.zip');
        if (empty($files)) {
            Log::info('Aucun fichier ROUTEOPTIQUE trouvé dans csv_files');
            return;
        }

        $archiveDir = storage_path('app/archives/ROUTEOPTIQUE/');
        if (!File::isDirectory($archiveDir)) {
            File::makeDirectory($archiveDir, 0755, true);
        }

        foreach ($files as $file) {
            $filename = basename($file);
            $destination = $archiveDir . $filename;

            if (file_exists($destination)) {
                Log::info('ℹ️ Fichier déjà présent dans archives, suppression de : ' . $filename);
                File::delete($file);
                continue;
            }

            if (File::move($file, $destination)) {
                Log::info('📦 Fichier déplacé de csv_files vers archives/ROUTEOPTIQUE : ' . $filename);
            } else {
                Log::error('❌ Échec du déplacement de ' . $filename);
                $this->stats['errors'][] = "Impossible de déplacer $filename";
            }
        }
    }

    /**
     * Traite un ZIP principal : extrait, sauvegarde le ZIP ROP, puis importe les CSV
     */
    protected function processZipFile($zipPath)
    {
        $zipName = basename($zipPath);
        Log::info('📂 Traitement du ZIP principal : ' . $zipName);

        $tempDir = storage_path('app/temp_routeoptique/');
        if (!File::isDirectory($tempDir)) {
            File::makeDirectory($tempDir, 0755, true);
        }

        $zip = new \ZipArchive;
        if ($zip->open($zipPath) !== true) {
            Log::error('❌ Impossible d\'ouvrir le ZIP : ' . $zipPath);
            $this->stats['errors'][] = "Impossible d'ouvrir $zipName";
            return;
        }
        $zip->extractTo($tempDir);
        $zip->close();

        // 1. Sauvegarder le ZIP ROP_ imbriqué
        $nestedZips = File::glob($tempDir . 'ROP_*.zip');
        foreach ($nestedZips as $nestedZipPath) {
            $this->saveNestedZip($nestedZipPath);
        }

        // 2. Importer les CSV (préfixes ROUTEOPTIQUE ou ROP)
        $this->processCsvFiles($tempDir, $zipName);

        // Nettoyage
        File::cleanDirectory($tempDir);
        rmdir($tempDir);
    }

    /**
     * Sauvegarde le ZIP ROP dans storage/app/rop_files/
     */
    protected function saveNestedZip($nestedZipPath)
    {
        $nestedZipName = basename($nestedZipPath);
        $ropDir = storage_path('app/rop_files/');
        if (!File::isDirectory($ropDir)) {
            File::makeDirectory($ropDir, 0755, true);
        }

        $destination = $ropDir . $nestedZipName;
        if (!file_exists($destination)) {
            copy($nestedZipPath, $destination);
            Log::info('📦 ZIP ROP sauvegardé : ' . $destination);
        } else {
            Log::info('ℹ️ ZIP ROP déjà existant : ' . $destination);
        }

        // Stocker le chemin relatif pour la base
        $this->currentRopZipPath = 'rop_files/' . $nestedZipName;
    }

    /**
     * Importe tous les CSV présents dans un dossier (préfixe ROUTEOPTIQUE ou ROP)
     */
    protected function processCsvFiles($directory, $sourceLabel)
    {
        $csvFiles = File::glob($directory . '*.csv');
        Log::info('📄 CSV trouvés dans ' . $sourceLabel . ' : ' . count($csvFiles));

        foreach ($csvFiles as $csvPath) {
            $filename = basename($csvPath);
            $prefix = explode('_', $filename)[0] ?? '';

            if (!in_array(strtoupper($prefix), ['ROUTEOPTIQUE', 'ROP'])) {
                Log::info('⏩ CSV ignoré (préfixe ' . $prefix . ') : ' . $filename);
                File::delete($csvPath);
                continue;
            }

            $this->stats['processed']++;

            $rows = [];
            if (($handle = fopen($csvPath, 'r')) !== false) {
                $headers = fgetcsv($handle, 0, ',');
                while (($row = fgetcsv($handle, 0, ',')) !== false) {
                    if (count($headers) === count($row)) {
                        $rows[] = array_combine($headers, $row);
                    }
                }
                fclose($handle);
            }

            Log::info('📊 Lignes dans ' . $filename . ' : ' . count($rows));

            if (empty($rows)) {
                File::delete($csvPath);
                continue;
            }

            $fileInfo = $this->parseFileInfo($filename);
            foreach ($rows as $rowData) {
                $this->importRow($rowData, $filename, $fileInfo, $sourceLabel);
            }

            File::delete($csvPath);
        }
    }

    /**
     * Importe une ligne du CSV
     */
    protected function importRow($rowData, $sourceFile, $fileInfo, $source)
{
    try {
        $rds = $rowData['rds'] ?? $rowData['admin_rds'] ?? $rowData['RDS'] ?? null;
        $bca = $rowData['refrop'] ?? $rowData['bca'] ?? $rowData['admin_bca'] ?? $rowData['BCA'] ?? null;

        if (!$rds || !$bca) {
            $this->stats['skipped']++;
            Log::warning('Ligne ignorée : RDS ou BCA manquant', ['row' => $rowData]);
            return;
        }

        $currentTimestamp = $fileInfo['timestamp'] ?? 0;

        $existingRecord = RouteOptique::where('admin_rds', $rds)
            ->where('admin_bca', $bca)
            ->where('source_prefix', 'ROUTEOPTIQUE')
            ->orderBy('file_timestamp', 'desc')
            ->first();

        if ($existingRecord && $existingRecord->file_timestamp >= $currentTimestamp) {
            $this->stats['skipped']++;
            Log::info('Version plus récente existe déjà', ['rds' => $rds, 'bca' => $bca]);
            return;
        }

        if ($existingRecord) {
            $existingRecord->update(['is_current_version' => false]);
        }

        $routeOptique = new RouteOptique();
        $routeOptique->admin_rds = $rds;
        $routeOptique->admin_bca = $bca;
        $routeOptique->admin_contract = $rowData['admin_contract'] ?? null;
        $routeOptique->admin_prefix = $rowData['admin_prefix'] ?? 'ROUTEOPTIQUE';
        $routeOptique->source_file = $sourceFile;
        $routeOptique->source_prefix = 'ROUTEOPTIQUE';
        $routeOptique->imported_at = now();
        $routeOptique->file_date = $fileInfo['date'] ?? null;
        $routeOptique->file_time = $fileInfo['time'] ?? null;
        $routeOptique->file_timestamp = $currentTimestamp;
        $routeOptique->is_current_version = true;
        $routeOptique->rop_zip_path = $this->currentRopZipPath;

        // ====== LIAISON ======
        // 1. Chercher un raccordement correspondant
        $raccordement = Raccordement::where('admin_rds', $rds)
            ->where('admin_bca', $bca)
            ->first();

        if ($raccordement) {
            $routeOptique->raccordement_id = $raccordement->id;
        } else {
            // 2. Sinon, chercher une visite technique
            $visite = VisiteTechnique::where('admin_rds', $rds)
                ->where('admin_bca', $bca)
                ->first();
            if ($visite) {
                $routeOptique->visite_technique_id = $visite->id;
            }
        }

        $routeOptique->save();

        $this->stats['imported']++;

        Log::info('✅ Route optique importée', [
            'rds' => $rds,
            'bca' => $bca,
            'file' => $sourceFile,
            'raccordement_id' => $routeOptique->raccordement_id,
            'visite_technique_id' => $routeOptique->visite_technique_id,
        ]);

    } catch (\Exception $e) {
        $this->stats['errors'][] = $e->getMessage();
        Log::error('❌ Erreur import ligne ROUTEOPTIQUE', [
            'error' => $e->getMessage(),
            'data' => $rowData
        ]);
    }
}

    /**
     * Extrait date/heure du nom de fichier (format PREFIX_..._YYYYMMDD_HHMM)
     */
    protected function parseFileInfo($filename)
    {
        $name = str_replace(['.zip', '.csv'], '', $filename);
        $parts = explode('_', $name);

        $info = [
            'date' => $parts[3] ?? null,
            'time' => $parts[4] ?? null,
            'timestamp' => null,
        ];

        if ($info['date'] && strlen($info['date']) == 8) {
            $year = substr($info['date'], 0, 4);
            $month = substr($info['date'], 4, 2);
            $day = substr($info['date'], 6, 2);
            $info['timestamp'] = strtotime("$year-$month-$day");

            if ($info['time'] && strlen($info['time']) == 4) {
                $hour = substr($info['time'], 0, 2);
                $minute = substr($info['time'], 2, 2);
                $info['timestamp'] = strtotime("$year-$month-$day $hour:$minute:00");
            }
        }

        return $info;
    }

    protected function resetStats()
    {
        $this->stats = ['processed' => 0, 'imported' => 0, 'skipped' => 0, 'errors' => []];
        $this->currentRopZipPath = null;
    }

    protected function getResult()
    {
        return [
            'success' => empty($this->stats['errors']),
            'stats' => $this->stats
        ];
    }
}
