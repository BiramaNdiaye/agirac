<?php

namespace App\Services;

use App\Models\Annulation;
use App\Models\Raccordement;
use App\Models\VisiteTechnique;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class AnnulationImportService
{
    protected $importedCount = 0;
    protected $updatedCount = 0;
    protected $skippedCount = 0;
    protected $errors = [];

    public function importFromCsvData()
    {
        DB::beginTransaction();

        try {
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

            Log::info('Import ANNULATION terminé', [
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
            Log::error('Erreur import ANNULATION', [
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

        if ($prefix !== 'ANNULATION') {
            return;
        }

        if (!isset($csvData['sample_rows']) || !is_array($csvData['sample_rows'])) {
            Log::warning('Aucune ligne dans le CSV ANNULATION', ['filename' => $filename]);
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
        $rds = $rowData['admin_rds'] ?? $rowData['rds'] ?? null;
        $bca = $rowData['admin_bca'] ?? $rowData['bca'] ?? null;

        if (!$rds || !$bca) {
            $this->skippedCount++;
            return;
        }

        // Versionnement
        $existingRecord = Annulation::where('admin_rds', $rds)
            ->where('admin_bca', $bca)
            ->orderBy('file_timestamp', 'desc')
            ->first();

        if ($existingRecord && $existingRecord->file_timestamp >= ($fileInfo['timestamp'] ?? 0)) {
            $this->skippedCount++;
            return;
        }

        if ($existingRecord) {
            $existingRecord->update(['is_current_version' => false]);
        }

        $annulation = new Annulation();
        $annulation->admin_rds = $rds;
        $annulation->admin_bca = $bca;
        $annulation->admin_contract = $rowData['admin_contract'] ?? null;
        $annulation->admin_prefix = $rowData['admin_prefix'] ?? 'ANNULATION';
        $annulation->cancellation_date = $this->formatDate($rowData['cancellation_date'] ?? $rowData['date_annulation'] ?? null);
        $annulation->source_file = $sourceFile;
        $annulation->source_prefix = 'ANNULATION';
        $annulation->imported_at = now();
        $annulation->file_date = $fileInfo['date'] ?? null;
        $annulation->file_time = $fileInfo['time'] ?? null;
        $annulation->file_timestamp = $fileInfo['timestamp'] ?? time();
        $annulation->is_current_version = true;

        // ====== LIAISON ======
        $raccordement = Raccordement::where('admin_rds', $rds)
            ->where('admin_bca', $bca)
            ->first();

        if ($raccordement) {
            $annulation->raccordement_id = $raccordement->id;
        } else {
            $visite = VisiteTechnique::where('admin_rds', $rds)
                ->where('admin_bca', $bca)
                ->first();
            if ($visite) {
                $annulation->visite_technique_id = $visite->id;
            }
        }

        $annulation->save();

        $this->importedCount++;

        Log::info('Annulation importée et liée', [
            'rds' => $rds,
            'bca' => $bca,
            'visite_technique_id' => $annulation->visite_technique_id,
            'raccordement_id' => $annulation->raccordement_id,
        ]);

    } catch (\Exception $e) {
        $this->errors[] = $e->getMessage();
        Log::error('Erreur import annulation', ['error' => $e->getMessage(), 'data' => $rowData]);
    }
}

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

    protected function formatDate($value)
    {
        if (empty($value)) return null;
        try {
            return Carbon::parse($value)->format('Y-m-d');
        } catch (\Exception $e) {
            return null;
        }
    }

    protected function resetCounters()
    {
        $this->importedCount = 0;
        $this->updatedCount = 0;
        $this->skippedCount = 0;
        $this->errors = [];
    }
}
