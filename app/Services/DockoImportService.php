<?php

namespace App\Services;

use App\Models\Rejete;  // à créer
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class DockoImportService
{
    protected $importedCount = 0;
    protected $updatedCount = 0;
    protected $skippedCount = 0;
    protected $errors = [];

    /**
     * Importe toutes les données DOCKO depuis getCsvData()
     */
    public function importFromCsvData()
    {
        DB::beginTransaction();

        try {
            // Récupération des données via le contrôleur existant (à extraire plus tard)
            $controller = app(\App\Http\Controllers\SftpUploadController::class);
            $response = $controller->getCsvData()->getData(true);

            if (!isset($response['data']) || empty($response['data'])) {
                throw new \Exception('Aucune donnée CSV trouvée');
            }

            $this->resetCounters();

            foreach ($response['data'] as $zipData) {
                $this->processZipData($zipData);
            }

            DB::commit();

            Log::info('Import DOCKO terminé', [
                'imported' => $this->importedCount,
                'updated' => $this->updatedCount,
                'skipped' => $this->skippedCount,
                'errors' => count($this->errors)
            ]);

            return [
                'success' => true,
                'imported' => $this->importedCount,
                'updated' => $this->updatedCount,
                'skipped' => $this->skippedCount,
                'errors' => $this->errors
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur import DOCKO', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'imported' => $this->importedCount,
                'updated' => $this->updatedCount,
                'skipped' => $this->skippedCount,
                'errors' => $this->errors
            ];
        }
    }

    protected function processZipData($zipData)
    {
        if (!isset($zipData['csv_files']) || !is_array($zipData['csv_files'])) {
            return;
        }

        foreach ($zipData['csv_files'] as $csvData) {
            $this->processCsvFile($csvData, $zipData);
        }
    }

    protected function processCsvFile($csvData, $zipData)
    {
        $filename = $csvData['file_name'];
        $prefix = $csvData['prefix'] ?? explode('_', $filename)[0];

        // Ne traiter que les fichiers DOCKO
        if ($prefix !== 'DOCKO') {
            return;
        }

        if (!isset($csvData['sample_rows']) || !is_array($csvData['sample_rows'])) {
            Log::warning('Aucune ligne dans le CSV DOCKO', ['filename' => $filename]);
            return;
        }

        $fileInfo = $this->parseFileInfo($filename);

        foreach ($csvData['sample_rows'] as $rowData) {
            $this->importRow($rowData, $filename, $fileInfo, $csvData['source'] ?? $zipData['source'] ?? null);
        }
    }

    protected function importRow($rowData, $sourceFile, $fileInfo, $source)
    {
        try {
            // Extraire les champs obligatoires
            $rds = $rowData['admin_rds'] ?? $rowData['rds'] ?? null;
            $bca = $rowData['admin_bca'] ?? $rowData['bca'] ?? null;

            if (!$rds || !$bca) {
                $this->skippedCount++;
                $this->errors[] = "Ligne ignorée - RDS ou BCA manquant: " . json_encode($rowData);
                return;
            }

            // Optionnel : si on veut conserver le versionnement, on vérifie l'existant
            $currentTimestamp = $fileInfo['timestamp'] ?? 0;

            // --- Début du versionnement (identique au service original) ---
            $existingRecord = Rejete::where('admin_rds', $rds)
                ->where('admin_bca', $bca)
                ->where('source_prefix', 'DOCKO')
                ->orderBy('file_timestamp', 'desc')
                ->first();

            if ($existingRecord && $existingRecord->file_timestamp >= $currentTimestamp) {
                $this->skippedCount++;
                Log::info('Version plus récente existe déjà pour DOCKO', [
                    'rds' => $rds,
                    'bca' => $bca,
                    'existing_timestamp' => $existingRecord->file_timestamp,
                    'new_timestamp' => $currentTimestamp
                ]);
                return;
            }

            if ($existingRecord) {
                $existingRecord->update(['is_current_version' => false]);
                $this->updatedCount++;
            }
            // --- Fin versionnement ---

            // Création de l'enregistrement dans rejetes
            $rejete = new Rejete();

            // Champs demandés
            $rejete->admin_rds = $rds;
            $rejete->admin_bca = $bca;
            $rejete->admin_contract = $rowData['admin_contract'] ?? null;
            $rejete->admin_prefix = $rowData['admin_prefix'] ?? 'DOCKO';
            $rejete->fail_reason = $rowData['fail_reason'] ?? null;

            // Métadonnées d'import (optionnelles mais utiles)
            $rejete->source_file = $sourceFile;
            $rejete->source_prefix = 'DOCKO';
            $rejete->imported_at = now();
            $rejete->file_date = $fileInfo['date'] ?? null;
            $rejete->file_time = $fileInfo['time'] ?? null;
            $rejete->file_timestamp = $currentTimestamp;
            $rejete->is_current_version = true;  // si on utilise le versionnement

            // On peut aussi ajouter d'autres champs si la table le permet (ex: source)

            $rejete->save();

            $this->importedCount++;

            Log::info('Rejet DOCKO importé', [
                'rds' => $rds,
                'bca' => $bca,
                'fail_reason' => $rejete->fail_reason
            ]);

        } catch (\Exception $e) {
            $this->errors[] = "Erreur import ligne DOCKO: " . $e->getMessage();
            Log::error('Erreur import ligne DOCKO', [
                'error' => $e->getMessage(),
                'data' => $rowData
            ]);
            throw $e;
        }
    }

    /**
     * Parse les informations du fichier (identique)
     */
    protected function parseFileInfo($filename)
    {
        $name = str_replace(['.zip', '.csv'], '', $filename);
        $parts = explode('_', $name);

        $info = [
            'date' => $parts[3] ?? null,
            'time' => $parts[4] ?? null,
            'timestamp' => null,
            'datetime' => null
        ];

        if ($info['date'] && strlen($info['date']) == 8) {
            $year = substr($info['date'], 0, 4);
            $month = substr($info['date'], 4, 2);
            $day = substr($info['date'], 6, 2);
            $info['timestamp'] = strtotime("$year-$month-$day");
            $info['datetime'] = "$year-$month-$day";

            if ($info['time'] && strlen($info['time']) == 4) {
                $hour = substr($info['time'], 0, 2);
                $minute = substr($info['time'], 2, 2);
                $info['datetime'] = "$year-$month-$day $hour:$minute:00";
                $info['timestamp'] = strtotime("$year-$month-$day $hour:$minute:00");
            }
        }

        return $info;
    }

    protected function resetCounters()
    {
        $this->importedCount = 0;
        $this->updatedCount = 0;
        $this->skippedCount = 0;
        $this->errors = [];
    }
}
