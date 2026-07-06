<?php
namespace App\Services;

use App\Models\AttenteClient;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use ZipArchive;
use Carbon\Carbon;

class ImportAttenteClientService
{
    protected $stats = [
        'processed' => 0,
        'imported' => 0,
        'skipped' => 0,
        'errors' => []
    ];

    protected $allowedPrefix = 'ATTENTECLIENT';

    public function importFromSftpOut()
    {
        DB::beginTransaction();
        try {
            $diskIn = Storage::disk('sftp_in');
            $files = $diskIn->files('/');
            $zipFiles = collect($files)
                ->filter(fn($f) => strtolower(pathinfo($f, PATHINFO_EXTENSION)) === 'zip')
                ->values();

            foreach ($zipFiles as $zipPath) {
                $filename = basename($zipPath);
                $prefix = explode('_', $filename)[0];
                if ($prefix !== $this->allowedPrefix) {
                    continue;
                }
                $this->stats['processed']++;
                $this->processZip($diskIn, $zipPath);
            }

            DB::commit();
            Log::info('Import ATTENTECLIENT terminé', $this->stats);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur import ATTENTECLIENT: ' . $e->getMessage());
        }
    }

    protected function processZip($disk, $zipPath)
    {
        $filename = basename($zipPath);
        try {
            $stream = $disk->readStream($zipPath);
            $zipContent = stream_get_contents($stream);
            fclose($stream);

            $tempDir = storage_path('app/temp/' . uniqid());
            if (!is_dir($tempDir)) mkdir($tempDir, 0755, true);
            $tempZip = $tempDir . '/' . $filename;
            file_put_contents($tempZip, $zipContent);

            $zip = new ZipArchive;
            if ($zip->open($tempZip) !== true) {
                throw new \Exception("Impossible d'ouvrir le ZIP");
            }
            $zip->extractTo($tempDir);
            $zip->close();

            $csvFiles = glob($tempDir . '/*.csv');
            foreach ($csvFiles as $csvPath) {
                $this->processCsv($csvPath, $filename);
            }

            // Nettoyage
            $this->deleteDirectory($tempDir);
        } catch (\Exception $e) {
            $this->stats['errors'][] = "Erreur $filename: " . $e->getMessage();
            Log::error($e->getMessage());
        }
    }

    protected function processCsv($csvPath, $zipFilename)
    {
        $handle = fopen($csvPath, 'r');
        $headers = fgetcsv($handle, 0, ',');
        if (!$headers) {
            fclose($handle);
            return;
        }

        $fileInfo = $this->parseFileInfo($zipFilename);
        while (($row = fgetcsv($handle, 0, ',')) !== false) {
            if (count($headers) !== count($row)) continue;
            $data = array_combine($headers, $row);
            $this->importRow($data, $zipFilename, $fileInfo);
        }
        fclose($handle);
    }

    protected function importRow($data, $sourceFile, $fileInfo)
    {
        $rds = $data['admin_rds'] ?? $data['rds'] ?? null;
        $bca = $data['admin_bca'] ?? $data['bca'] ?? null;
        if (!$rds || !$bca) {
            $this->stats['skipped']++;
            return;
        }

        // Vérifier si une entrée existe déjà
        $existing = AttenteClient::where('admin_rds', $rds)
            ->where('admin_bca', $bca)
            ->first();

        if ($existing) {
            // Mise à jour (optionnel selon votre besoin)
            $record = $existing;
            $this->stats['skipped']++; // ou updated
        } else {
            $record = new AttenteClient();
            $this->stats['imported']++;
        }

        $record->admin_rds = $rds;
        $record->admin_bca = $bca;
        $record->admin_contract = $data['admin_contract'] ?? null;
        $record->admin_prefix = $data['admin_prefix'] ?? $this->allowedPrefix;
        $record->project_name = $data['project_name'] ?? null;
        $record->operator_name = $data['operator_name'] ?? null;
        $record->begin_client_wait = $this->formatDate($data['begin_client_wait'] ?? null);
        $record->client_wait_end = $this->formatDate($data['client_wait_end'] ?? null);
        $record->comment = $data['comment'] ?? null;
        $record->source_file = $sourceFile;
        $record->source_prefix = $this->allowedPrefix;
        $record->file_date = $fileInfo['date'] ?? null;
        $record->file_time = $fileInfo['time'] ?? null;
        $record->file_timestamp = $fileInfo['timestamp'] ?? time();
        $record->imported_at = now();

        $record->save();
\Log::info('Ligne attente client', [
    'rds' => $rds,
    'bca' => $bca,
    'begin' => $data['begin_client_wait'] ?? null,
    'end' => $data['client_wait_end'] ?? null,
]);
    }

    protected function parseFileInfo($filename)
    {
        $name = str_replace('.zip', '', $filename);
        $parts = explode('_', $name);
        $date = $parts[3] ?? null;
        $time = $parts[4] ?? null;
        $timestamp = null;
        if ($date && strlen($date) == 8) {
            $year = substr($date, 0, 4);
            $month = substr($date, 4, 2);
            $day = substr($date, 6, 2);
            $timestamp = strtotime("$year-$month-$day");
            if ($time && strlen($time) == 4) {
                $hour = substr($time, 0, 2);
                $minute = substr($time, 2, 2);
                $timestamp = strtotime("$year-$month-$day $hour:$minute:00");
            }
        }
        return ['date' => $date, 'time' => $time, 'timestamp' => $timestamp];
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

    protected function deleteDirectory($dir)
    {
        if (!is_dir($dir)) return;
        $items = scandir($dir);
        foreach ($items as $item) {
            if ($item === '.' || $item === '..') continue;
            $path = $dir . '/' . $item;
            is_dir($path) ? $this->deleteDirectory($path) : unlink($path);
        }
        rmdir($dir);
    }
public function getStats()
{
    return $this->stats;
}
}
