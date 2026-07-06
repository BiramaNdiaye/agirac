<?php

namespace App\Services;

use App\Models\EditPlanifDate;
use App\Models\Raccordement;
use App\Models\VisiteTechnique;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\File;
use Carbon\Carbon;

class EditplanifdateImportService
{
    protected $stats = [
        'processed' => 0,
        'imported' => 0,
        'skipped' => 0,
        'errors' => []
    ];

    protected $currentZipPath = null;

    /**
     * Point d'entrée principal : déplace les fichiers depuis csv_files/ vers archives/
     * puis importe les données
     */
    public function importFromArchive()
    {
        DB::beginTransaction();

        try {
            $this->resetStats();

            // 1. Déplacer les fichiers depuis csv_files/
            $this->moveFilesFromCsvFolder();

            // 2. Traiter les fichiers dans le dossier d'archive
            $archiveDir = storage_path('app/archives/EDITPLANIFDATE/');
            if (!File::isDirectory($archiveDir)) {
                Log::warning('Dossier d\'archive EDITPLANIFDATE introuvable');
                return $this->getResult();
            }

            $zipFiles = File::glob($archiveDir . 'EDITPLANIFDATE_*.zip');
            Log::info('📦 Nombre de ZIP EDITPLANIFDATE trouvés : ' . count($zipFiles));

            foreach ($zipFiles as $zipPath) {
                $this->processZipFile($zipPath);
            }

            DB::commit();

            Log::info('✅ Import EDITPLANIFDATE terminé', $this->stats);
            return $this->getResult();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('❌ Erreur import EDITPLANIFDATE', ['error' => $e->getMessage()]);
            $this->stats['errors'][] = $e->getMessage();
            return $this->getResult();
        }
    }

    /**
     * Déplace les fichiers ZIP depuis csv_files/ vers archives/EDITPLANIFDATE/
     */
    protected function moveFilesFromCsvFolder()
    {
        $csvDir = storage_path('app/csv_files/');
        if (!File::isDirectory($csvDir)) {
            return;
        }

        $files = File::glob($csvDir . 'EDITPLANIFDATE_*.zip');
        if (empty($files)) {
            return;
        }

        $archiveDir = storage_path('app/archives/EDITPLANIFDATE/');
        if (!File::isDirectory($archiveDir)) {
            File::makeDirectory($archiveDir, 0755, true);
        }

        foreach ($files as $file) {
            $filename = basename($file);
            $destination = $archiveDir . $filename;

            if (file_exists($destination)) {
                File::delete($file);
                continue;
            }

            if (File::move($file, $destination)) {
                Log::info('📦 Fichier déplacé vers EDITPLANIFDATE : ' . $filename);
            } else {
                Log::error('❌ Échec du déplacement de ' . $filename);
            }
        }
    }

    /**
     * Traite un ZIP : extraction, lecture du CSV, import
     */
    protected function processZipFile($zipPath)
    {
        $zipName = basename($zipPath);
        Log::info('📂 Traitement du ZIP : ' . $zipName);

        $tempDir = storage_path('app/temp_editplanifdate/');
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

        // Sauvegarder le chemin du ZIP pour la base
        $this->currentZipPath = 'archives/EDITPLANIFDATE/' . $zipName;

        // Traiter les CSV
        $this->processCsvFiles($tempDir, $zipName);

        // Nettoyage
        File::cleanDirectory($tempDir);
        rmdir($tempDir);
    }

    /**
     * Importe les CSV trouvés (préfixe EDITPLANIFDATE)
     */
    protected function processCsvFiles($directory, $sourceLabel)
    {
        $csvFiles = File::glob($directory . '*.csv');
        Log::info('📄 CSV trouvés : ' . count($csvFiles));

        foreach ($csvFiles as $csvPath) {
            $filename = basename($csvPath);
            $prefix = explode('_', $filename)[0] ?? '';

            if (strtoupper($prefix) !== 'EDITPLANIFDATE') {
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

            $fileInfo = $this->parseFileInfo($filename);
            foreach ($rows as $rowData) {
                $this->importRow($rowData, $filename, $fileInfo, $sourceLabel);
            }

            File::delete($csvPath);
        }
    }

    /**
     * Importe une ligne : modifie la date de planification de la VT ou du Raccordement
     */
    protected function importRow($rowData, $sourceFile, $fileInfo, $source)
    {
        try {
            $rds = $rowData['rds'] ?? $rowData['admin_rds'] ?? $rowData['RDS'] ?? null;
            $bca = $rowData['refrop'] ?? $rowData['bca'] ?? $rowData['admin_bca'] ?? $rowData['BCA'] ?? null;

            if (!$rds || !$bca) {
                $this->stats['skipped']++;
                Log::warning('Ligne ignorée : RDS ou BCA manquant');
                return;
            }

            $planningDate = $this->formatDate($rowData['planning_date'] ?? $rowData['date_planification'] ?? null);

            $currentTimestamp = $fileInfo['timestamp'] ?? 0;

            // Versionnement : on garde la version la plus récente pour ce couple (rds, bca)
            $existing = EditPlanifDate::where('admin_rds', $rds)
                ->where('admin_bca', $bca)
                ->orderBy('file_timestamp', 'desc')
                ->first();

            if ($existing && $existing->file_timestamp >= $currentTimestamp) {
                $this->stats['skipped']++;
                Log::info('Version plus récente existe déjà', ['rds' => $rds, 'bca' => $bca]);
                return;
            }

            if ($existing) {
                $existing->update(['is_current_version' => false]);
            }

            // Créer l'enregistrement
            $edit = new EditPlanifDate();
            $edit->admin_rds = $rds;
            $edit->admin_bca = $bca;
            $edit->planning_date = $planningDate;
            $edit->admin_contract = $rowData['admin_contract'] ?? null;
            $edit->admin_prefix = 'EDITPLANIFDATE';
            $edit->source_file = $sourceFile;
            $edit->source_prefix = 'EDITPLANIFDATE';
            $edit->imported_at = now();
            $edit->file_date = $fileInfo['date'] ?? null;
            $edit->file_time = $fileInfo['time'] ?? null;
            $edit->file_timestamp = $currentTimestamp;
            $edit->is_current_version = true;
            $edit->edit_zip_path = $this->currentZipPath;

            // Lier à une VT ou un Raccordement
            $raccordement = Raccordement::where('admin_rds', $rds)
                ->where('admin_bca', $bca)
                ->first();

            if ($raccordement) {
                $edit->raccordement_id = $raccordement->id;
            } else {
                $visite = VisiteTechnique::where('admin_rds', $rds)
                    ->where('admin_bca', $bca)
                    ->first();
                if ($visite) {
                    $edit->visite_technique_id = $visite->id;
                }
            }

            $edit->save();

            $this->stats['imported']++;

            Log::info('✅ EDITPLANIFDATE importé', [
                'rds' => $rds,
                'bca' => $bca,
                'planning_date' => $planningDate,
                'visite_technique_id' => $edit->visite_technique_id,
                'raccordement_id' => $edit->raccordement_id,
            ]);

        } catch (\Exception $e) {
            $this->stats['errors'][] = $e->getMessage();
            Log::error('❌ Erreur import ligne EDITPLANIFDATE', [
                'error' => $e->getMessage(),
                'data' => $rowData
            ]);
        }
    }

    /**
     * Formate une date
     */
    protected function formatDate($value)
    {
        if (empty($value)) return null;
        try {
            return Carbon::parse($value)->format('Y-m-d');
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Extrait date/heure du nom de fichier (format EDITPLANIFDATE_..._YYYYMMDD_HHMM)
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
        $this->currentZipPath = null;
    }

    protected function getResult()
    {
        return [
            'success' => empty($this->stats['errors']),
            'stats' => $this->stats
        ];
    }
}
