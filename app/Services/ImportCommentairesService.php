<?php

namespace App\Services;
use App\Models\Notification;

use App\Models\Commentaire;
use App\Models\VisiteTechnique;
use App\Models\Raccordement;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use ZipArchive;
use Carbon\Carbon;

class ImportCommentairesService
{
    protected $stats = [
        'processed' => 0,
        'imported' => 0,
        'skipped' => 0,
        'errors' => [],
        'details' => []
    ];
    
    protected $allowedPrefixes = ['COMMENT'];
    
    /**
     * Importe les fichiers COMMENT depuis les archives et SFTP
     */
    public function importFromAllSources()
    {
        DB::beginTransaction();
        
        try {
            $this->resetStats();
            
            // 1. Importer depuis les archives
            $this->importFromArchive();
            
            // 2. Importer depuis les fichiers SFTP via getCsvData
            $this->importFromSftp();
            
            DB::commit();
            
            Log::info('Import des commentaires terminé', $this->stats);
            
            return $this->getResult();
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur import commentaires', ['error' => $e->getMessage()]);
            $this->stats['errors'][] = $e->getMessage();
            
            return $this->getResult();
        }
    }
    
    /**
     * Importe une ligne du CSV (version corrigée)
     */
    protected function importRow($rowData, $sourceFile, $prefix, $source, $fileInfo = null)
    {
        try {
            // 1. Extraire RDS et BCA
            $rds = $rowData['admin_rds'] ?? $rowData['rds'] ?? null;
            $bca = $rowData['admin_bca'] ?? $rowData['bca'] ?? null;
            
            if (!$rds || !$bca) {
                $this->stats['skipped']++;
                $this->stats['details'][] = "Commentaire ignoré (RDS/BCA manquant) pour fichier: {$sourceFile}";
                return;
            }
            
            // 2. Extraire le contenu du commentaire (une seule fois)
            $commentContent = $rowData['comment'] ?? $rowData['content'] ?? null;
            
            if (!$commentContent) {
                $this->stats['skipped']++;
                $this->stats['details'][] = "Commentaire ignoré (contenu vide) pour {$rds} - {$bca}";
                return;
            }
            
            // 3. Déterminer le type de commande (VT ou Raccordement)
            $commandeType = $this->determineCommandeType($rds, $bca);
            $commandeId = null;
            
            if ($commandeType === Commentaire::COMMANDE_VT) {
                $commande = VisiteTechnique::where('admin_rds', $rds)
                    ->where('admin_bca', $bca)
                    ->first();
                if ($commande) {
                    $commandeId = $commande->id;
                } else {
                    $this->stats['details'][] = "VT non trouvée pour {$rds} - {$bca}, commentaire stocké sans lien";
                }
            } elseif ($commandeType === Commentaire::COMMANDE_RACCORDEMENT) {
                $commande = Raccordement::where('admin_rds', $rds)
                    ->where('admin_bca', $bca)
                    ->first();
                if ($commande) {
                    $commandeId = $commande->id;
                } else {
                    $this->stats['details'][] = "Raccordement non trouvé pour {$rds} - {$bca}, commentaire stocké sans lien";
                }
            }
            
            // 4. Vérifier si le commentaire existe déjà (basé sur le fichier source)
            $existing = Commentaire::where('source_file', $sourceFile)
                ->where('rds', $rds)
                ->where('bca', $bca)
                ->first();
            
            if ($existing) {
                $this->stats['skipped']++;
                $this->stats['details'][] = "Commentaire déjà existant pour {$rds} - {$bca} (fichier: {$sourceFile})";
                return;
            }
            
            // 5. Créer le commentaire
            $commentaire = new Commentaire();
            $commentaire->type_document = $prefix;
            $commentaire->prefix = $prefix;
            $commentaire->source_file = $sourceFile;
            $commentaire->source = $source;
            
            if ($fileInfo) {
                $commentaire->file_date = $fileInfo['date'] ?? null;
                $commentaire->file_time = $fileInfo['time'] ?? null;
                $commentaire->file_timestamp = $fileInfo['timestamp'] ?? time();
            }
            
            $commentaire->rds = $rds;
            $commentaire->bca = $bca;
            $commentaire->commande_type = $commandeType;
            $commentaire->commande_id = $commandeId;
            
            // 6. Auteur du commentaire
            $commentaire->auteur = $this->determineAuteur($rowData, $source);
            
            // 7. Contenu
            $commentaire->contenu = trim($commentContent);
            $commentaire->type_commentaire = $this->determineTypeCommentaire($commentContent);
            
            // 8. Vérifier si c'est une réponse
            $commentaire->est_reponse = $this->isReponse($sourceFile, $commentContent);
            
            // 9. Fichiers joints
            if (isset($rowData['fichiers']) || isset($rowData['attachments'])) {
                $files = $rowData['fichiers'] ?? $rowData['attachments'];
                if (is_string($files)) {
                    $commentaire->fichiers_joints = array_map('trim', explode(',', $files));
                } elseif (is_array($files)) {
                    $commentaire->fichiers_joints = $files;
                }
            }
            
            // 10. Données brutes
            $commentaire->raw_data = $rowData;
            $commentaire->imported_at = now();
            
            $commentaire->save();
            
            $this->stats['imported']++;
            $this->stats['details'][] = "✅ Commentaire importé pour {$rds} - {$bca} (type: {$commentaire->type_commentaire})";
            
            Log::info('Commentaire importé', [
                'id' => $commentaire->id,
                'rds' => $rds,
                'bca' => $bca,
                'source' => $source,
                'type' => $commentaire->type_commentaire,
                'file' => $sourceFile
            ]);
            
        } catch (\Exception $e) {
            $this->stats['errors'][] = "Erreur import: " . $e->getMessage();
            Log::error('Erreur import commentaire', [
                'error' => $e->getMessage(),
                'data' => $rowData,
                'file' => $sourceFile
            ]);
        }
    }
    
    /**
     * Détermine l'auteur du commentaire
     */
    protected function determineAuteur($rowData, $source)
    {
        // 1. Si le champ author est présent
        if (isset($rowData['author']) && !empty($rowData['author'])) {
            return trim($rowData['author']);
        }
        
        // 2. Si le champ auteur est présent
        if (isset($rowData['auteur']) && !empty($rowData['auteur'])) {
            return trim($rowData['auteur']);
        }
        
        // 3. Basé sur la source
        if ($source === 'OUT') {
            return 'Covage';
        }
        
        if ($source === 'IN') {
            return 'Application';
        }
        
        if ($source === 'ARCHIVE') {
            return 'Archivage';
        }
        
        // 4. Par défaut
        return 'Inconnu';
    }
    
    /**
     * Détermine le type de commentaire
     */
    protected function determineTypeCommentaire($content)
    {
        $contentLower = strtolower(trim($content));
        
        // Détection des questions (avec ?)
        if (str_contains($contentLower, '?')) {
            return Commentaire::TYPE_QUESTION;
        }
        
        // Détection des mots-clés de question
        $questionKeywords = ['question', 'confirmer', 'pouvez-vous', 'est-ce que', 'quel', 'quelle', 'quand', 'comment', 'pourquoi'];
        foreach ($questionKeywords as $keyword) {
            if (str_contains($contentLower, $keyword)) {
                return Commentaire::TYPE_QUESTION;
            }
        }
        
        // Détection des confirmations
        $confirmationKeywords = ['confirm', 'valide', 'accord', 'd\'accord', 'ok', 'oui', 'accepte', 'approuve'];
        foreach ($confirmationKeywords as $keyword) {
            if (str_contains($contentLower, $keyword)) {
                return Commentaire::TYPE_CONFIRMATION;
            }
        }
        
        // Détection des réponses
        $reponseKeywords = ['reponse', 'réponse', 'en retour', 'suite à', 'concernant', 'à propos de'];
        foreach ($reponseKeywords as $keyword) {
            if (str_contains($contentLower, $keyword)) {
                return Commentaire::TYPE_REPONSE_COMMENTAIRE;
            }
        }
        
        // Par défaut, information
        return Commentaire::TYPE_INFO;
    }
    
    /**
     * Vérifie si c'est une réponse
     */
    protected function isReponse($sourceFile, $content)
    {
        // Vérifier par le nom du fichier
        if (str_contains(strtoupper($sourceFile), 'REPONSE')) {
            return true;
        }
        
        // Vérifier par le contenu
        $contentLower = strtolower($content);
        $reponseIndicators = ['en réponse', 'réponse :', 'suite à', 'concernant votre', 'à propos de'];
        
        foreach ($reponseIndicators as $indicator) {
            if (str_contains($contentLower, $indicator)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Détermine le type de commande (VT ou Raccordement)
     */
    protected function determineCommandeType($rds, $bca)
    {
        // Chercher d'abord dans les visites techniques
        $vt = VisiteTechnique::where('admin_rds', $rds)
            ->where('admin_bca', $bca)
            ->first();
        
        if ($vt) {
            return Commentaire::COMMANDE_VT;
        }
        
        // Sinon dans les raccordements
        $racco = Raccordement::where('admin_rds', $rds)
            ->where('admin_bca', $bca)
            ->first();
        
        if ($racco) {
            return Commentaire::COMMANDE_RACCORDEMENT;
        }
        
        // Par défaut, considérer comme VT
        return Commentaire::COMMANDE_VT;
    }
    
    /**
     * Parse les informations du fichier
     */
    protected function parseFileInfo($filename)
    {
        $name = str_replace('.zip', '', $filename);
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
    
    /**
     * Importe depuis le dossier archives
     */
    protected function importFromArchive()
    {
        $archiveDirectory = storage_path('app/archives/');
        
        foreach ($this->allowedPrefixes as $prefix) {
            $dir = $archiveDirectory . $prefix;
            if (File::isDirectory($dir)) {
                $this->processDirectory($dir);
            } else {
                Log::warning("Dossier commentaires non trouvé: {$dir}");
            }
        }
    }
    
    /**
     * Importe depuis les données SFTP
     */
    protected function importFromSftp()
    {
        try {
            $controller = app(\App\Http\Controllers\SftpUploadController::class);
            $response = $controller->getCsvData()->getData(true);
            
            if (!isset($response['data']) || empty($response['data'])) {
                return;
            }
            
            foreach ($response['data'] as $zipData) {
                $this->processZipData($zipData);
            }
            
        } catch (\Exception $e) {
            Log::error('Erreur import commentaires SFTP', ['error' => $e->getMessage()]);
        }
    }
    
    protected function processDirectory($directory)
    {
        $dirName = basename($directory);
        Log::info("Traitement du dossier commentaires: {$dirName}");
        
        $zipFiles = File::glob($directory . '/*.zip');
        
        foreach ($zipFiles as $zipPath) {
            $this->processZipFile($zipPath, 'ARCHIVE');
        }
    }
    
    protected function processZipData($zipData)
    {
        if (!isset($zipData['csv_files'])) return;
        
        foreach ($zipData['csv_files'] as $csvData) {
            $filename = $csvData['file_name'];
            $prefix = $csvData['prefix'] ?? explode('_', $filename)[0];
            
            if (!in_array($prefix, $this->allowedPrefixes)) {
                continue;
            }
            
            $source = $csvData['source'] ?? $zipData['source'] ?? 'SFTP';
            
            foreach ($csvData['sample_rows'] as $rowData) {
                $this->importRow($rowData, $filename, $prefix, $source);
            }
        }
    }
    
    protected function processZipFile($zipPath, $source)
    {
        $filename = basename($zipPath);
        $prefix = explode('_', $filename)[0];
        
        if (!in_array($prefix, $this->allowedPrefixes)) {
            return;
        }
        
        $this->stats['processed']++;
        
        try {
            $zip = new ZipArchive();
            if ($zip->open($zipPath) !== TRUE) {
                throw new \Exception("Impossible d'ouvrir le fichier ZIP");
            }
            
            $tempDir = storage_path('app/temp/' . uniqid());
            File::makeDirectory($tempDir, 0755, true);
            
            $zip->extractTo($tempDir);
            $zip->close();
            
            $csvFiles = File::glob($tempDir . '/*.csv');
            
            foreach ($csvFiles as $csvPath) {
                $this->processCsvFile($csvPath, $filename, $prefix, $source);
            }
            
            File::deleteDirectory($tempDir);
            
        } catch (\Exception $e) {
            $this->stats['errors'][] = "Erreur traitement {$filename}: " . $e->getMessage();
            Log::error('Erreur traitement ZIP commentaire', [
                'file' => $filename,
                'error' => $e->getMessage()
            ]);
        }
    }
    
    protected function processCsvFile($csvPath, $zipFilename, $prefix, $source)
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
                    $this->importRow($rowData, $zipFilename, $prefix, $source, $fileInfo);
                }
            }
            
            fclose($fileHandle);
            
        } catch (\Exception $e) {
            Log::error('Erreur traitement CSV commentaire', [
                'file' => $csvPath,
                'error' => $e->getMessage()
            ]);
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
