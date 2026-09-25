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
        'duplicates_skipped' => 0,
        'errors' => [],
    ];

    protected $tempDir;
    protected $archiveDir;
    protected $currentSourceFile;
    protected $currentZipFilename;

    // Configuration SFTP
    protected $sftpHost;
    protected $sftpPort;
    protected $sftpUsername;
    protected $sftpPrivateKey;
    protected $sftpRemotePath = '/OUT';

    public function __construct()
    {
        $this->tempDir = storage_path('app/temp_docko/');
        $this->archiveDir = storage_path('app/archives/DOCKO/');
        $this->currentSourceFile = null;
        $this->currentZipFilename = null;

        // Configuration SFTP
        $this->sftpHost = env('SFTP_HOST', 'ftp.docko.com');
        $this->sftpPort = (int) env('SFTP_PORT', 31451);
        $this->sftpUsername = env('SFTP_USERNAME', 'sftpuser');
        $this->sftpPrivateKey = storage_path('keys/id_ecdsa');

        // Créer UNIQUEMENT les dossiers locaux
        if (!is_dir($this->tempDir)) {
            mkdir($this->tempDir, 0755, true);
        }
        if (!is_dir($this->archiveDir)) {
            mkdir($this->archiveDir, 0755, true);
        }
    }

    /**
     * 🚀 POINT D'ENTRÉE PRINCIPAL
     */
    public function importFromAllSources()
    {
        Log::info('🚀 Début import DOCKO depuis toutes les sources');

        $this->resetStats();

        // 1. 📥 Importer depuis le SFTP
        $this->importFromSftp();

        // 2. 📂 Importer depuis les archives locales
        $this->importFromArchive();

        Log::info('📊 Statistiques finales:', $this->stats);

        return $this->getResult();
    }

    /**
     * 📥 Importe depuis le SFTP
     * ⚠️ NE CRÉE PAS de dossier sur le SFTP
     * ⚠️ NE DÉPLACE PAS les fichiers distants
     */
    protected function importFromSftp()
    {
        Log::info('📥 Recherche de fichiers DOCKO sur le SFTP');

        if (!File::exists($this->sftpPrivateKey)) {
            Log::error("❌ Clé privée introuvable: {$this->sftpPrivateKey}");
            return;
        }

        $remoteFiles = $this->listSftpFiles();

        if (empty($remoteFiles)) {
            Log::info('ℹ️ Aucun fichier DOCKO trouvé sur le SFTP');
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
                $this->processLocalZip($localPath, $filename);

                // Marquer comme importé
                $this->markAsImported($localPath);
            } else {
                Log::error("❌ Échec téléchargement: {$filename}");
            }
        }
    }

    /**
     * 📂 Importe depuis les archives locales
     * ⚠️ UNIQUEMENT dans le dossier principal (pas de processed/)
     */
    protected function importFromArchive()
    {
        Log::info('📁 Recherche de fichiers DOCKO dans les archives locales...');

        // Chercher UNIQUEMENT dans le dossier principal
        $zipFiles = File::glob($this->archiveDir . '*.zip');

        if (empty($zipFiles)) {
            Log::info('Aucun fichier DOCKO trouvé dans les archives');
            return;
        }

        Log::info('📦 Fichiers DOCKO trouvés dans les archives: ' . count($zipFiles));

        foreach ($zipFiles as $localPath) {
            $filename = basename($localPath);
            $prefix = explode('_', $filename)[0];

            if ($prefix !== 'DOCKO') {
                Log::info("⏭️ Fichier ignoré (préfixe incorrect): {$filename}");
                continue;
            }

            // Vérifier si déjà importé
            if (File::exists($localPath . '.imported')) {
                Log::info("⏭️ Fichier déjà importé: {$filename}");
                continue;
            }

            Log::info("📂 Traitement du fichier archive: {$filename}");
            $this->processLocalZip($localPath, $filename);

            // Marquer comme importé
            $this->markAsImported($localPath);
        }
    }

    /**
     * Liste les fichiers DOCKO sur le SFTP
     */
    protected function listSftpFiles()
    {
        $command = sprintf(
            'sftp -i %s -P %d -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null %s@%s 2>&1 << "EOF"
ls -la %s/DOCKO*.zip
exit
EOF',
            escapeshellarg($this->sftpPrivateKey),
            $this->sftpPort,
            escapeshellarg($this->sftpUsername),
            escapeshellarg($this->sftpHost),
            escapeshellarg($this->sftpRemotePath)
        );

        Log::info("📡 Liste des fichiers DOCKO sur le SFTP");
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
                if ($filename && str_starts_with($filename, 'DOCKO_')) {
                    $files[] = $filename;
                }
            }
        }

        Log::info("📦 Fichiers DOCKO trouvés: " . count($files));
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
     * ✅ Traite un fichier ZIP local
     * ⚠️ Le fichier RESTE dans le dossier DOCKO
     */
    protected function processLocalZip($localPath, $filename)
    {
        Log::info("📂 Traitement du fichier ZIP local: {$filename}");

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

        // ⚠️ Le fichier reste dans son dossier d'origine (pas de déplacement)

        $this->stats['processed']++;
        Log::info("✅ Fichier DOCKO traité: {$filename}");

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

        $headers = array_map(function($header) {
            return trim(trim($header), "\xEF\xBB\xBF");
        }, $headers);

        Log::info("📋 En-têtes trouvés: " . count($headers));

        $requiredColumns = ['admin_rds', 'admin_bca', 'admin_prefix'];
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
     * Importe une ligne du CSV
     */
    protected function importRow($data, $zipFilename)
    {
        try {
            $rds = $data['admin_rds'] ?? $data['rds'] ?? null;
            $bca = $data['admin_bca'] ?? $data['bca'] ?? null;
            $adminPrefix = $data['admin_prefix'] ?? null;
            $failReason = $data['fail_reason'] ?? null;

            Log::info("🔍 Import ligne: RDS={$rds}, BCA={$bca}, Prefix={$adminPrefix}");

            if (!$rds || !$bca || !$adminPrefix) {
                Log::warning("❌ Ligne ignorée: RDS, BCA ou admin_prefix manquant");
                $this->stats['skipped']++;
                return;
            }

            // 1. 📋 VÉRIFIER LES DOUBLONS
            $shouldSkip = $this->checkDuplicate($rds, $bca, $adminPrefix);

            if ($shouldSkip) {
                Log::info("⏭️ Doublon ignoré pour {$rds} - {$bca} (prefix: {$adminPrefix})");
                $this->stats['duplicates_skipped']++;
                return;
            }

            // 2. 🔍 RECHERCHER LA COMMANDE
            $commande = $this->findCommand($rds, $bca);
            $commandeId = null;
            $commandeType = null;
            $actionId = null;
            $commandeTrouvee = false;

            if ($commande) {
                $commandeTrouvee = true;
                $commandeId = $commande->model->id;
                $commandeType = $commande->type;

                $action = $this->getOrCreateAction($commande);
                if ($action) {
                    $actionId = $action->id;
                }
            }

            // 3. 💾 CRÉER LA RÉPONSE DOCKO
            $this->createDockoResponse($data, $zipFilename, $commandeId, $commandeType, $actionId, $commandeTrouvee);

            // 4. 📧 NOTIFICATION SI COMMANDE TROUVÉE
            if ($commandeTrouvee) {
                $this->createNotification($data, $commande, $failReason);
            }

            $this->stats['imported']++;
            Log::info("✅ DOCKO IMPORTÉ" . ($commandeTrouvee ? " (commande {$commandeId})" : " (sans commande)"));

        } catch (\Exception $e) {
            Log::error('❌ Erreur import ligne DOCKO', [
                'error' => $e->getMessage(),
                'data' => $data
            ]);
            $this->stats['errors'][] = "Erreur: " . $e->getMessage();
        }
    }

    /**
     * 🔍 Recherche une commande
     */
    protected function findCommand($rds, $bca)
    {
        $commande = VisiteTechnique::where('admin_rds', $rds)
            ->where('admin_bca', $bca)
            ->first();

        if ($commande) {
            return (object) ['model' => $commande, 'type' => 'vt', 'exists' => true];
        }

        $commande = Raccordement::where('admin_rds', $rds)
            ->where('admin_bca', $bca)
            ->first();

        if ($commande) {
            return (object) ['model' => $commande, 'type' => 'raccordement', 'exists' => true];
        }

        return null;
    }

    /**
     * Vérifie les doublons
     */
    protected function checkDuplicate($rds, $bca, $adminPrefix)
    {
        $existing = DockoResponse::where('rds', $rds)
            ->where('bca', $bca)
            ->where('admin_prefix', $adminPrefix)
            ->first();

        if ($existing) {
            return true;
        }

        $existingWithSameRdsBca = DockoResponse::where('rds', $rds)
            ->where('bca', $bca)
            ->orderBy('created_at', 'desc')
            ->get();

        if ($existingWithSameRdsBca->isNotEmpty()) {
            $newDate = $this->extractDateFromPrefix($adminPrefix);

            if ($newDate) {
                foreach ($existingWithSameRdsBca as $record) {
                    if (empty($record->admin_prefix)) continue;

                    $existingDate = $this->extractDateFromPrefix($record->admin_prefix);

                    if ($existingDate && $existingDate >= $newDate) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    /**
     * Extrait la date du prefix
     */
    protected function extractDateFromPrefix($prefix)
    {
        $prefix = trim($prefix);

        if (preg_match('/(\d{8})[_\s-]?(\d{4})/', $prefix, $matches)) {
            try {
                return Carbon::createFromFormat('Ymd_His', $matches[1] . '_' . ($matches[2] ?? '0000') . '00');
            } catch (\Exception $e) {}
        }

        if (preg_match('/(\d{8})/', $prefix, $matches)) {
            try {
                return Carbon::createFromFormat('Ymd', $matches[1]);
            } catch (\Exception $e) {}
        }

        if (preg_match('/(\d{4})-(\d{2})-(\d{2})/', $prefix, $matches)) {
            try {
                return Carbon::createFromFormat('Y-m-d', $matches[0]);
            } catch (\Exception $e) {}
        }

        return null;
    }

    /**
     * Récupère ou crée l'action
     */
    protected function getOrCreateAction($commande)
    {
        if ($commande->type === 'vt') {
            $action = VisiteTechniqueAction::where('visite_technique_id', $commande->model->id)
                ->where('action_type', VisiteTechniqueAction::ACTION_LIVRAISON_CRVT)
                ->first();

            if (!$action) {
                $data = [
                    'visite_technique_id' => $commande->model->id,
                    'action_type' => VisiteTechniqueAction::ACTION_LIVRAISON_CRVT,
                    'status' => 'pending',
                    'created_by' => auth()->id() ?? 1,
                    'source_file' => $this->currentSourceFile ?? 'auto_import_' . date('Ymd_His'),
                ];

                try {
                    $columns = Schema::getColumnListing('visite_technique_actions');
                    if (in_array('prefix', $columns)) $data['prefix'] = 'VT-' . $commande->model->id . '-' . date('YmdHis');
                    if (in_array('code', $columns)) $data['code'] = 'VT-ACT-' . $commande->model->id . '-' . date('YmdHis');
                    if (in_array('docko_status', $columns)) $data['docko_status'] = null;
                    if (in_array('docko_fail_reason', $columns)) $data['docko_fail_reason'] = null;
                    if (in_array('docko_comment', $columns)) $data['docko_comment'] = null;
                    if (in_array('docko_effective_date', $columns)) $data['docko_effective_date'] = null;
                } catch (\Exception $e) {}

                $action = VisiteTechniqueAction::create($data);
            }
            return $action;
        } else {
            $action = RaccordementAction::where('raccordement_id', $commande->model->id)
                ->where('action_type', RaccordementAction::ACTION_LIVRAISON_CR)
                ->first();

            if (!$action) {
                $data = [
                    'raccordement_id' => $commande->model->id,
                    'action_type' => RaccordementAction::ACTION_LIVRAISON_CR,
                    'status' => 'pending',
                    'created_by' => auth()->id() ?? 1,
                    'source_file' => $this->currentSourceFile ?? 'auto_import_' . date('Ymd_His'),
                ];

                try {
                    $columns = Schema::getColumnListing('raccordement_actions');
                    if (in_array('prefix', $columns)) $data['prefix'] = 'RACC-' . $commande->model->id . '-' . date('YmdHis');
                    if (in_array('code', $columns)) $data['code'] = 'RACC-ACT-' . $commande->model->id . '-' . date('YmdHis');
                    if (in_array('docko_status', $columns)) $data['docko_status'] = null;
                    if (in_array('docko_fail_reason', $columns)) $data['docko_fail_reason'] = null;
                    if (in_array('docko_comment', $columns)) $data['docko_comment'] = null;
                    if (in_array('docko_effective_date', $columns)) $data['docko_effective_date'] = null;
                } catch (\Exception $e) {}

                $action = RaccordementAction::create($data);
            }
            return $action;
        }
    }

    /**
     * Crée la réponse DOCKO
     */
    protected function createDockoResponse($data, $zipFilename, $commandeId, $commandeType, $actionId, $commandeTrouvee)
    {
        $failReason = $data['fail_reason'] ?? null;
        $isAccepted = empty($failReason) || trim($failReason) === '';
        $adminContract = $data['admin_contract'] ?? null;
        $adminPrefix = $data['admin_prefix'] ?? null;
        $rds = $data['admin_rds'] ?? $data['rds'] ?? null;
        $bca = $data['admin_bca'] ?? $data['bca'] ?? null;

        $dockoResponse = DockoResponse::create([
            'rds' => $rds,
            'bca' => $bca,
            'admin_contract' => $adminContract,
            'admin_prefix' => $adminPrefix,
            'commande_type' => $commandeTrouvee ? $commandeType : null,
            'commande_id' => $commandeTrouvee ? $commandeId : null,
            'action_id' => $commandeTrouvee ? $actionId : null,
            'action_type' => $commandeTrouvee ? ($commandeType === 'vt' ? 'livraison_crvt' : 'livraison_cr') : null,
            'status' => $isAccepted ? 'accepte' : 'refuse',
            'fail_reason' => $failReason,
            'comment' => $data['comment'] ?? null,
            'effective_date' => now(),
            'source_file' => $zipFilename,
            'imported_at' => now(),
            'is_read' => false,
        ]);

        if ($commandeTrouvee && $actionId) {
            $this->updateActionAndCommand($commandeType, $commandeId, $actionId, $isAccepted, $failReason, $data);
        }

        return $dockoResponse;
    }

    /**
     * Met à jour l'action et la commande
     */
    protected function updateActionAndCommand($commandeType, $commandeId, $actionId, $isAccepted, $failReason, $data)
    {
        try {
            if ($commandeType === 'vt') {
                $action = VisiteTechniqueAction::find($actionId);
                $commande = VisiteTechnique::find($commandeId);
            } else {
                $action = RaccordementAction::find($actionId);
                $commande = Raccordement::find($commandeId);
            }

            if ($action) {
                $table = $commandeType === 'vt' ? 'visite_technique_actions' : 'raccordement_actions';
                $tableColumns = Schema::getColumnListing($table);

                $updateData = [];
                if (in_array('docko_status', $tableColumns)) $updateData['docko_status'] = $isAccepted ? 'accepte' : 'refuse';
                if (in_array('docko_fail_reason', $tableColumns)) $updateData['docko_fail_reason'] = $failReason;
                if (in_array('docko_comment', $tableColumns)) $updateData['docko_comment'] = $data['comment'] ?? null;
                if (in_array('docko_effective_date', $tableColumns)) $updateData['docko_effective_date'] = now();

                if (!empty($updateData)) {
                    $action->update($updateData);
                }
            }

            if ($commande) {
                $commande->status = $isAccepted ? 'completed' : 'failed';
                $commande->save();
            }

        } catch (\Exception $e) {
            Log::warning("⚠️ Impossible de mettre à jour: " . $e->getMessage());
        }
    }

    /**
     * Crée une notification
     */
    protected function createNotification($data, $commande, $failReason)
    {
        try {
            $rds = $data['admin_rds'] ?? $data['rds'] ?? null;
            $bca = $data['admin_bca'] ?? $data['bca'] ?? null;
            $isAccepted = empty($failReason) || trim($failReason) === '';

            $title = $isAccepted ? '✅ CRVT accepté' : '❌ CRVT refusé';
            $message = "Le CRVT pour {$rds} - {$bca} a été "
                . ($isAccepted ? 'accepté' : 'refusé')
                . ($failReason ? " : {$failReason}" : '');

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
        } catch (\Exception $e) {
            Log::warning("⚠️ Impossible de créer la notification: " . $e->getMessage());
        }
    }

    /**
     * ✅ Marque un fichier comme importé (marqueur à côté du fichier)
     */
    protected function markAsImported($zipPath)
    {
        $markerFile = $zipPath . '.imported';
        file_put_contents($markerFile, now()->toDateTimeString());
        Log::info("✅ Marqueur créé: " . basename($markerFile));
    }

    /**
     * Réinitialise les statistiques
     */
    protected function resetStats()
    {
        $this->stats = [
            'processed' => 0,
            'imported' => 0,
            'skipped' => 0,
            'duplicates_skipped' => 0,
            'errors' => [],
        ];
    }

    public function getStats()
    {
        return $this->stats;
    }

    protected function getResult()
    {
        return [
            'success' => empty($this->stats['errors']),
            'stats' => $this->stats,
        ];
    }
}
