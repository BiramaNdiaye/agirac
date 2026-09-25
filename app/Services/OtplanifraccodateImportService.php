<?php

namespace App\Services;

use App\Models\Raccordement;
use App\Traits\ImportNotifierTrait;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\File;
use Carbon\Carbon;
use App\Models\Notification;
use ZipArchive;

class OtplanifraccodateImportService
{
    use ImportNotifierTrait;

    protected $importedCount = 0;
    protected $updatedCount = 0;
    protected $skippedCount = 0;
    protected $errors = [];
    protected $tempDir;
    protected $archiveDir;
    protected $processedFiles = [];

    // Configuration SFTP
    protected $sftpHost;
    protected $sftpPort;
    protected $sftpUsername;
    protected $sftpPrivateKey;
    protected $sftpRemotePath = '/OUT';

    public function __construct()
    {
        $this->tempDir = storage_path('app/temp_otplanif/');
        $this->archiveDir = storage_path('app/archives/OTPLANIFRACCODATE/');

        $this->sftpHost = env('SFTP_HOST', 'ftp.docko.com');
        $this->sftpPort = (int) env('SFTP_PORT', 31451);
        $this->sftpUsername = env('SFTP_USERNAME', 'sftpuser');
        $this->sftpPrivateKey = storage_path('keys/id_ecdsa');

        // Créer UNIQUEMENT les dossiers nécessaires
        if (!is_dir($this->tempDir)) {
            mkdir($this->tempDir, 0755, true);
        }
        if (!is_dir($this->archiveDir)) {
            mkdir($this->archiveDir, 0755, true);
        }
    }

    /**
     * 🚀 POINT D'ENTRÉE PRINCIPAL
     * Importe depuis le SFTP ET depuis les archives locales
     * ⚠️ PAS de transaction globale - chaque fichier est indépendant
     */
    public function importFromAllSources()
    {
        Log::info('🚀 Début import OTPLANIFRACCODATE depuis toutes les sources');

        $this->resetCounters();
        $this->resetProcessedFiles();

        // 1. 📥 Importer depuis le SFTP
        $this->importFromSftp();

        // 2. 📂 Importer depuis les archives locales
        $this->importFromArchive();

        Log::info('✅ Import OTPLANIFRACCODATE terminé', [
            'imported' => $this->importedCount,
            'updated' => $this->updatedCount,
            'skipped' => $this->skippedCount,
            'files' => count($this->processedFiles),
            'errors' => count($this->errors)
        ]);

        return $this->getResult();
    }

    /**
     * 📥 Importe depuis le SFTP
     */
    protected function importFromSftp()
    {
        Log::info('📥 Recherche de fichiers OTPLANIFRACCODATE sur le SFTP');

        if (!File::exists($this->sftpPrivateKey)) {
            Log::error("❌ Clé privée introuvable: {$this->sftpPrivateKey}");
            return;
        }

        $remoteFiles = $this->listSftpFiles();

        if (empty($remoteFiles)) {
            Log::info('ℹ️ Aucun fichier OTPLANIFRACCODATE trouvé sur le SFTP');
            return;
        }

        foreach ($remoteFiles as $filename) {
            $remotePath = $this->sftpRemotePath . '/' . $filename;
            $localPath = $this->archiveDir . $filename;

            // Vérifier si déjà importé
            if (File::exists($localPath . '.imported')) {
                Log::info("⏭️ Fichier déjà importé: {$filename}");
                continue;
            }

            Log::info("📥 Téléchargement: {$filename}");

            if ($this->downloadSftpFile($remotePath, $localPath)) {
                Log::info("✅ Téléchargé: {$filename}");

                // Traiter le fichier ZIP
                $this->processZipFile($localPath, $filename);

                // Marquer comme importé (marqueur à côté du fichier)
                $this->markAsImported($localPath);
            } else {
                Log::error("❌ Échec téléchargement: {$filename}");
            }
        }
    }

    /**
     * 📂 Importe depuis les archives locales
     * ⚠️ Les fichiers restent dans le dossier principal
     */
    protected function importFromArchive()
    {
        Log::info('📂 Recherche de fichiers OTPLANIFRACCODATE dans les archives locales...');

        // Chercher UNIQUEMENT dans le dossier principal (pas de processed/)
        $zipFiles = File::glob($this->archiveDir . '*.zip');

        if (empty($zipFiles)) {
            Log::info('ℹ️ Aucun fichier OTPLANIFRACCODATE trouvé dans les archives');
            return;
        }

        Log::info('📦 Fichiers trouvés dans les archives: ' . count($zipFiles));

        foreach ($zipFiles as $localPath) {
            $filename = basename($localPath);

            // Vérifier que c'est bien un fichier OTPLANIFRACCODATE
            if (!str_starts_with($filename, 'OTPLANIFRACCODATE_')) {
                Log::info("⏭️ Fichier ignoré (préfixe incorrect): {$filename}");
                continue;
            }

            // Vérifier le marqueur À CÔTÉ du fichier (pas dans processed/)
            $markerFile = $localPath . '.imported';
            if (File::exists($markerFile)) {
                Log::info("⏭️ Fichier déjà importé: {$filename}");
                continue;
            }

            Log::info("📂 Traitement du fichier archive: {$filename}");

            // Traiter le fichier ZIP
            $this->processZipFile($localPath, $filename);

            // Marquer comme importé (marqueur à côté du fichier)
            $this->markAsImported($localPath);
        }
    }

    /**
     * Liste les fichiers OTPLANIFRACCODATE sur le SFTP
     */
    protected function listSftpFiles()
    {
        $command = sprintf(
            'sftp -i %s -P %d -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null %s@%s 2>&1 << "EOF"
ls -la %s/*.zip
exit
EOF',
            escapeshellarg($this->sftpPrivateKey),
            $this->sftpPort,
            escapeshellarg($this->sftpUsername),
            escapeshellarg($this->sftpHost),
            escapeshellarg($this->sftpRemotePath)
        );

        Log::info("📡 Liste des fichiers SFTP");
        $output = shell_exec($command);

        if (strpos($output, 'No such file') !== false || strpos($output, 'Could not') !== false) {
            Log::warning("⚠️ Aucun fichier trouvé ou erreur de connexion");
            return [];
        }

        $files = [];
        $lines = explode("\n", $output);
        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line) || str_starts_with($line, 'total') || str_starts_with($line, 'd')) {
                continue;
            }
            if (preg_match('/\.zip$/', $line)) {
                $parts = preg_split('/\s+/', $line);
                $filename = end($parts);
                if ($filename && str_starts_with($filename, 'OTPLANIFRACCODATE_')) {
                    $files[] = $filename;
                }
            }
        }

        Log::info("📦 Fichiers OTPLANIFRACCODATE trouvés: " . count($files));
        return $files;
    }

    /**
     * Télécharge un fichier depuis le SFTP
     */
    protected function downloadSftpFile($remotePath, $localPath)
    {
        $localDir = dirname($localPath);
        if (!is_dir($localDir)) {
            mkdir($localDir, 0755, true);
        }

        $command = sprintf(
            'sftp -i %s -P %d -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null %s@%s 2>&1 << "EOF"
get %s %s
exit
EOF',
            escapeshellarg($this->sftpPrivateKey),
            $this->sftpPort,
            escapeshellarg($this->sftpUsername),
            escapeshellarg($this->sftpHost),
            escapeshellarg($remotePath),
            escapeshellarg($localPath)
        );

        $output = shell_exec($command);

        if (strpos($output, 'Could not') !== false || strpos($output, 'error') !== false) {
            Log::error("❌ Erreur téléchargement: " . $output);
            return false;
        }

        if (!file_exists($localPath) || filesize($localPath) === 0) {
            Log::error("❌ Fichier téléchargé vide ou inexistant: {$localPath}");
            return false;
        }

        return true;
    }

    /**
     * Traite un fichier ZIP
     * ⚠️ Transaction locale par fichier pour ne pas tout perdre en cas d'erreur
     */
    protected function processZipFile($zipPath, $filename)
    {
        Log::info("📂 Traitement du ZIP: {$filename}");

        $extractDir = $this->tempDir . pathinfo($filename, PATHINFO_FILENAME);
        if (!is_dir($extractDir)) {
            mkdir($extractDir, 0755, true);
        }

        $zip = new ZipArchive();
        if ($zip->open($zipPath) !== true) {
            Log::error("❌ ZIP invalide: {$filename}");
            $this->errors[] = "ZIP invalide: {$filename}";
            return;
        }

        $zip->extractTo($extractDir);
        $zip->close();

        $csvFiles = File::glob($extractDir . '/*.csv');
        Log::info("📄 Fichiers CSV extraits: " . count($csvFiles));

        if (empty($csvFiles)) {
            Log::warning("⚠️ Aucun CSV trouvé dans le ZIP: {$filename}");
            File::deleteDirectory($extractDir);
            return;
        }

        foreach ($csvFiles as $csvPath) {
            $this->processCsvFileFromPath($csvPath, $filename);
        }

        File::deleteDirectory($extractDir);
        $this->addProcessedFile($filename);
    }

    /**
     * Traite un fichier CSV
     */
    protected function processCsvFileFromPath($csvPath, $zipFilename)
    {
        Log::info("📄 Traitement du CSV: " . basename($csvPath));

        $fileHandle = fopen($csvPath, 'r');
        if (!$fileHandle) {
            Log::error("❌ Impossible d'ouvrir le CSV: {$csvPath}");
            return;
        }

        $firstLine = fgets($fileHandle);
        rewind($fileHandle);

        $separator = ',';
        if (strpos($firstLine, ';') !== false) {
            $separator = ';';
        } elseif (strpos($firstLine, "\t") !== false) {
            $separator = "\t";
        }

        $headers = fgetcsv($fileHandle, 0, $separator);
        if (!$headers) {
            Log::warning("❌ En-têtes CSV vides");
            fclose($fileHandle);
            return;
        }

        $headers = array_map(function($header) {
            return trim(trim($header), "\xEF\xBB\xBF");
        }, $headers);

        Log::info("📋 En-têtes trouvés: " . count($headers));

        $requiredColumns = ['admin_rds', 'admin_bca'];
        $missingColumns = array_diff($requiredColumns, $headers);
        if (!empty($missingColumns)) {
            Log::error("❌ Colonnes manquantes: " . implode(', ', $missingColumns));
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

            if ($rowNumber === 1) {
                Log::info("📝 Première ligne:", [
                    'rds' => $data['admin_rds'] ?? 'NON TROUVÉ',
                    'bca' => $data['admin_bca'] ?? 'NON TROUVÉ',
                ]);
            }

            $this->importRow($data, $zipFilename, 'archive');
            $importedCount++;
        }

        fclose($fileHandle);

        Log::info("✅ CSV traité: {$rowNumber} lignes, {$importedCount} importées, {$skippedCount} ignorées");
    }

    /**
     * Importe une ligne du CSV
     * ⚠️ Chaque ligne est indépendante - commit après chaque sauvegarde
     */
    protected function importRow($rowData, $sourceFile, $source)
    {
        try {
            $rds = $rowData['admin_rds'] ?? $rowData['rds'] ?? null;
            $bca = $rowData['admin_bca'] ?? $rowData['bca'] ?? null;

            if (!$rds || !$bca) {
                $this->skippedCount++;
                Log::warning("Ligne ignorée - RDS ou BCA manquant");
                return;
            }

            $existingRecord = Raccordement::where('admin_rds', $rds)
                ->where('admin_bca', $bca)
                ->first();

            if ($existingRecord) {
                $raccordement = $existingRecord;
                $this->updatedCount++;
            } else {
                $raccordement = new Raccordement();
                $this->importedCount++;
            }

            // Remplir les données
            $raccordement->admin_rds = $rds;
            $raccordement->admin_bca = $bca;
            $raccordement->admin_contract = $rowData['admin_contract'] ?? null;
            $raccordement->admin_prefix = $rowData['admin_prefix'] ?? 'OTPLANIFRACCODATE';

            $raccordement->address_site_a_name = $rowData['address_site_a_name'] ?? null;
            $raccordement->address_site_a_street = $rowData['address_site_a_street'] ?? null;
            $raccordement->address_site_a_postal = $rowData['address_site_a_postal'] ?? null;
            $raccordement->address_site_a_town = $rowData['address_site_a_town'] ?? null;
            $raccordement->address_site_a_x = $this->formatCoordinate($rowData['address_site_a_x'] ?? null);
            $raccordement->address_site_a_y = $this->formatCoordinate($rowData['address_site_a_y'] ?? null);

            $raccordement->techno = $rowData['techno'] ?? null;
            $raccordement->bandwith = $rowData['bandwith'] ?? null;
            $raccordement->network = $rowData['network'] ?? null;
            $raccordement->offer = $rowData['offer'] ?? null;
            $raccordement->one_shot_info = isset($rowData['one_shot_info']) ? filter_var($rowData['one_shot_info'], FILTER_VALIDATE_BOOLEAN) : false;

            $raccordement->nro_name = $rowData['nro_name'] ?? null;
            $raccordement->nro_port = $rowData['nro_port'] ?? null;
            $raccordement->bpe_piquage = $rowData['bpe_piquage'] ?? null;
            $raccordement->building_code = $rowData['building_code'] ?? null;
            $raccordement->equipement_number = $rowData['equipement_number'] ?? null;
            $raccordement->mer_number = $rowData['mer_number'] ?? null;

            $raccordement->operator_name = $rowData['operator_name'] ?? null;
            $raccordement->operator_client_ref = $rowData['operator_client_ref'] ?? null;
            $raccordement->oi_reference = $rowData['oi_reference'] ?? null;
            $raccordement->rop_ref = $rowData['rop_ref'] ?? null;
            $raccordement->project_name = $rowData['project_name'] ?? null;

            $raccordement->order_date = $this->formatDate($rowData['order_date'] ?? null);
            $raccordement->begin_client_wait = $this->formatDate($rowData['begin_client_wait'] ?? null);
            $raccordement->client_wait_end = $this->formatDate($rowData['client_wait_end'] ?? null);

            $raccordement->contact_on_site_firstname = $rowData['contact_on_site_firstname'] ?? null;
            $raccordement->contact_on_site_lastname = $rowData['contact_on_site_lastname'] ?? null;
            $raccordement->contact_on_site_phone = $rowData['contact_on_site_phone'] ?? null;
            $raccordement->contact_on_site_mail = $rowData['contact_on_site_mail'] ?? null;
            $raccordement->covage_contact_name = $rowData['covage_contact_name'] ?? null;

            $raccordement->client_directive_access = $rowData['client_directive_access'] ?? null;
            $raccordement->client_directive_intervention = $rowData['client_directive_intervention'] ?? null;
            $raccordement->client_directive_planning = $rowData['client_directive_planning'] ?? null;

            $raccordement->insee_code = $rowData['insee_code'] ?? null;
            $raccordement->article_designation = $rowData['article_designation'] ?? null;

            $raccordement->comment = $rowData['comment'] ?? null;
            $raccordement->fail_reason = $rowData['fail_reason'] ?? null;

            $raccordement->status = $this->determineStatus($rowData);

            $raccordement->source_file = $sourceFile;
            $raccordement->source_prefix = 'OTPLANIFRACCODATE';
            $raccordement->imported_at = now();

            $raccordement->save();

            // Notification pour les nouveaux
            if (!$existingRecord) {
                Notification::create([
                    'type' => 'raccordement',
                    'title' => 'Nouvelle demande de raccordement',
                    'message' => "Nouveau raccordement : {$rds} - {$bca}",
                    'reference' => "{$rds}_{$bca}",
                    'link' => route('raccordements.show', $raccordement->id),
                ]);
            }

            Log::info('✅ Raccordement importé', [
                'rds' => $rds,
                'bca' => $bca,
                'action' => $existingRecord ? 'updated' : 'created',
            ]);

        } catch (\Exception $e) {
            $this->errors[] = "Erreur import ({$rds}-{$bca}): " . $e->getMessage();
            Log::error('❌ Erreur import ligne', [
                'error' => $e->getMessage(),
                'rds' => $rds ?? null,
                'bca' => $bca ?? null,
            ]);
            // Ne pas relancer l'exception pour continuer l'import
        }
    }

    /**
     * Détermine le statut
     */
    protected function determineStatus($rowData)
    {
        if (!empty($rowData['fail_reason']) && trim($rowData['fail_reason']) !== '') {
            return 'failed';
        }
        if (!empty($rowData['client_wait_end'])) {
            return 'completed';
        }
        if (!empty($rowData['begin_client_wait'])) {
            return 'waiting';
        }
        if (!empty($rowData['order_date'])) {
            return 'planned';
        }
        return 'pending';
    }

    /**
     * ✅ Marque un fichier comme importé (marqueur À CÔTÉ du fichier, pas dans processed/)
     */
    protected function markAsImported($zipPath)
    {
        $markerFile = $zipPath . '.imported';
        file_put_contents($markerFile, now()->toDateTimeString());
        Log::info("✅ Marqueur créé: " . basename($markerFile));
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

    protected function resetCounters()
    {
        $this->importedCount = 0;
        $this->updatedCount = 0;
        $this->skippedCount = 0;
        $this->errors = [];
    }

    protected function resetProcessedFiles()
    {
        $this->processedFiles = [];
    }

    protected function addProcessedFile($filename)
    {
        $this->processedFiles[] = $filename;
    }

    protected function getResult()
    {
        return [
            'success' => empty($this->errors),
            'imported' => $this->importedCount,
            'updated' => $this->updatedCount,
            'skipped' => $this->skippedCount,
            'processed_files' => $this->processedFiles,
            'errors' => $this->errors
        ];
    }
}
