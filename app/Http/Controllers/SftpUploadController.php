<?php

namespace App\Http\Controllers;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use ZipArchive;
use Exception;
use Inertia\Inertia;
use Illuminate\Support\Facades\File;
use Carbon\Carbon;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use App\Services\OtplanifvtdateImportService;
use App\Models\VisiteTechnique;
use App\Models\VisiteTechniqueAction;
use App\Models\Commentaire;
use App\Models\AttenteClient;

use App\Services\VisiteTechniqueImportService;
class SftpUploadController extends Controller
{
protected $localDirectory;
    
    public function __construct()
    {
        $this->localDirectory = storage_path('app/csv_files/');
        
        if (!File::isDirectory($this->localDirectory)) {
            File::makeDirectory($this->localDirectory, 0755, true);
        }
    }

    /**
     * Parse le nom du fichier
     * Format: PREFIXE_RDS_REFBCA_AAAAMMJJ_HHMM
     */
    protected function parseFilename($filename)
    {
        $name = str_replace('.zip', '', $filename);
        $name = str_replace('.csv', '', $name);
        
        $parts = explode('_', $name);
        
        $info = [
            'original' => $filename,
            'prefix' => $parts[0] ?? null,
            'rds' => $parts[1] ?? null,
            'bca' => $parts[2] ?? null,
            'date' => $parts[3] ?? null,
            'time' => $parts[4] ?? null,
            'datetime' => null,
            'timestamp' => null,
            'formatted_date' => null,
            'formatted_time' => null
        ];
        
        if ($info['date']) {
            if (strlen($info['date']) == 8) {
                $year = substr($info['date'], 0, 4);
                $month = substr($info['date'], 4, 2);
                $day = substr($info['date'], 6, 2);
                $info['formatted_date'] = "$day/$month/$year";
                $info['datetime'] = "$year-$month-$day";
                $info['timestamp'] = strtotime("$year-$month-$day");
                
                if ($info['time'] && strlen($info['time']) == 4) {
                    $hour = substr($info['time'], 0, 2);
                    $minute = substr($info['time'], 2, 2);
                    $info['formatted_time'] = "$hour:$minute";
                    $info['datetime'] = "$year-$month-$day $hour:$minute:00";
                    $info['timestamp'] = strtotime("$year-$month-$day $hour:$minute:00");
                }
            }
        }
        
        return $info;
    }

    /**
     * Récupère l'historique des commentaires
     */
    protected function getCommentsForOrder($bca, $rds)
    {
        try {
            $commentPath = storage_path('app/comments/');
            $comments = [];
            
            if (!File::isDirectory($commentPath)) {
                return $comments;
            }
            
            $pattern = $commentPath . "{$bca}/{$rds}/*.json";
            $commentFiles = File::glob($pattern);
            
            foreach ($commentFiles as $file) {
                $content = json_decode(File::get($file), true);
                if ($content && $content['bca'] === $bca && $content['rds'] === $rds) {
                    $comments[] = $content;
                }
            }
            
            usort($comments, function($a, $b) {
                return strtotime($b['created_at']) - strtotime($a['created_at']);
            });
            
            return $comments;
            
        } catch (\Exception $e) {
            Log::error('Erreur récupération commentaires', [
                'error' => $e->getMessage(),
                'bca' => $bca,
                'rds' => $rds
            ]);
            return [];
        }
    }

    /**
     * Récupère les détails d'une commande par son couple (BCA, RDS)
     */
 


public function getOrderDetails($bca, $rds, $prefix = null, $selectedDate = null)
{
    try {
        Log::info('getOrderDetails appelé', [
            'bca' => $bca,
            'rds' => $rds,
            'prefix' => $prefix,
            'selectedDate' => $selectedDate
        ]);
        
        $response = $this->getCsvData()->getData(true);

        if (!is_array($response) || !isset($response['data'])) {
            throw new \Exception('Structure de données invalide');
        }

        $foundOrders = [];
        
        foreach ($response['data'] as $zip) {
            if (!isset($zip['csv_files']) || !is_array($zip['csv_files'])) {
                continue;
            }

            foreach ($zip['csv_files'] as $csvFile) {
                if (!isset($csvFile['sample_rows']) || !is_array($csvFile['sample_rows'])) {
                    continue;
                }

                foreach ($csvFile['sample_rows'] as $order) {
                    $orderBca = $order['admin_bca'] ?? null;
                    $orderRds = $order['admin_rds'] ?? null;
                    $orderPrefix = $order['admin_prefix'] ?? null;
                    
                    // Filtrer par BCA et RDS
                    if ((string)$orderBca !== (string)$bca || (string)$orderRds !== (string)$rds) {
                        continue;
                    }
                    
                    // Si un préfixe est spécifié, filtrer aussi par préfixe
                    if ($prefix && (string)$orderPrefix !== (string)$prefix) {
                        continue;
                    }

                    $fileInfo = $this->parseFilename($csvFile['file_name']);
                    
                    $foundOrders[] = [
                        'order' => $order,
                        'filename' => $csvFile['file_name'],
                        'prefix' => $fileInfo['prefix'] ?? $orderPrefix ?? Str::before($csvFile['file_name'], '_'),
                        'file_info' => $fileInfo,
                        'date' => $fileInfo['date'] ?? null,
                        'time' => $fileInfo['time'] ?? null,
                        'datetime' => $fileInfo['datetime'] ?? null,
                        'timestamp' => $fileInfo['timestamp'] ?? null,
                        'formatted_date' => $fileInfo['formatted_date'] ?? null,
                        'formatted_time' => $fileInfo['formatted_time'] ?? null
                    ];
                }
            }
        }

        // Trier par date (du plus récent au plus ancien)
        usort($foundOrders, function($a, $b) {
            return ($b['timestamp'] ?? 0) - ($a['timestamp'] ?? 0);
        });

        // Si une date spécifique est demandée, filtrer
        if ($selectedDate) {
            $foundOrders = array_filter($foundOrders, function($order) use ($selectedDate) {
                return $order['date'] === $selectedDate;
            });
            $foundOrders = array_values($foundOrders);
        }

        // Gestion des résultats trouvés
        if (count($foundOrders) === 1) {
            $order = $foundOrders[0];
            return $this->renderAppropriateView(
                $order['prefix'],
                $order['order'],
                $order['filename'],
                $order['file_info'],
                $foundOrders // Passer toutes les versions pour l'historique
            );
        } elseif (count($foundOrders) > 1) {
            // Pour les commentaires, on peut aussi aller directement dans DetailComment
            // avec toutes les versions disponibles pour l'historique
            $isComment = $prefix === 'COMMENT' || ($foundOrders[0]['prefix'] === 'COMMENT');
            
            if ($isComment && count($foundOrders) > 0) {
                // Pour les commentaires, prendre la version la plus récente mais passer toutes les versions
                $latestOrder = $foundOrders[0];
                return $this->renderAppropriateView(
                    $latestOrder['prefix'],
                    $latestOrder['order'],
                    $latestOrder['filename'],
                    $latestOrder['file_info'],
                    $foundOrders // Passer toutes les versions pour l'historique
                );
            }
            
            // Pour les autres types, afficher MultipleMatches
            $versionsByDate = [];
            foreach ($foundOrders as $order) {
                $date = $order['date'] ?? 'unknown';
                if (!isset($versionsByDate[$date])) {
                    $versionsByDate[$date] = [];
                }
                $versionsByDate[$date][] = $order;
            }
            
            return Inertia::render('Orders/MultipleMatches', [
                'orders' => $foundOrders,
                'versionsByDate' => $versionsByDate,
                'bca' => $bca,
                'rds' => $rds,
                'prefix' => $prefix,
                'totalVersions' => count($foundOrders)
            ]);
        }

        return $this->renderOrderNotFound('La commande est introuvable');

    } catch (\Exception $e) {
        Log::error('Erreur getOrderDetails', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
            'bca' => $bca,
            'rds' => $rds,
            'prefix' => $prefix
        ]);
        return $this->renderOrderNotFound('Erreur lors du traitement: '.$e->getMessage());
    }
}
    /**
     * Rend la vue appropriée selon le préfixe
     */
    protected function renderAppropriateView(string $prefix, array $order, string $filename, ?array $fileInfo = null, array $allVersions = [])
{
    $viewConfig = $this->getViewConfiguration($prefix);
    
    $bca = $order['admin_bca'] ?? null;
    $rds = $order['admin_rds'] ?? null;
    $commentHistory = [];
    
    if ($bca && $rds) {
        // Récupérer l'historique des commentaires depuis la base de données
        $commentHistory = $this->getCommentsForOrder($bca, $rds);
    }
    
    // Si c'est un commentaire et qu'on a plusieurs versions, les ajouter à l'historique
    if ($prefix === 'COMMENT' && !empty($allVersions)) {
        // Convertir les versions CSV en format commentaire
        foreach ($allVersions as $version) {
            $commentHistory[] = [
                'id' => $version['filename'],
                'bca' => $bca,
                'rds' => $rds,
                'content' => $version['order']['comment'] ?? $version['order']['user_comment'] ?? 'Aucun commentaire',
                'author' => $version['order']['author'] ?? 'Système',
                'created_at' => $version['datetime'] ?? $version['formatted_date'] . ' ' . ($version['formatted_time'] ?? ''),
                'formatted_date' => $version['formatted_date'],
                'formatted_time' => $version['formatted_time'],
                'filename' => $version['filename'],
                'is_from_csv' => true
            ];
        }
        
        // Trier par date
        usort($commentHistory, function($a, $b) {
            return strtotime($b['created_at']) - strtotime($a['created_at']);
        });
    }

    return Inertia::render($viewConfig['view'], [
        'order' => $order,
        'activeMainTab' => $viewConfig['mainTab'],
        'activeSubTab' => $viewConfig['subTab'],
        'filename' => $filename,
        'prefixType' => $prefix,
        'fileInfo' => $fileInfo,
        'fileDate' => $fileInfo['formatted_date'] ?? $fileInfo['date'] ?? null,
        'fileTime' => $fileInfo['formatted_time'] ?? $fileInfo['time'] ?? null,
        'fileDatetime' => $fileInfo['datetime'] ?? null,
        'fileTimestamp' => $fileInfo['timestamp'] ?? null,
        'bca' => $bca,
        'rds' => $rds,
        'commentHistory' => $commentHistory,
        'allVersions' => $allVersions // Passer toutes les versions pour l'affichage
    ]);
}

    /**
     * Configuration des vues par préfixe
     */
    protected function getViewConfiguration(string $prefix): array
    {
        $configurations = [
            // Raccordement
            'OTPLANIFRACCODATE' => ['view' => 'DetailRacco', 'mainTab' => 'Raccordement', 'subTab' => 'DetailCRVT'],
            'PLANIFRACCODATE' => ['view' => 'DetailRacco', 'mainTab' => 'Raccordement', 'subTab' => 'DetailCRVT'],
            'CRIDOCCLI' => ['view' => 'DetailRacco', 'mainTab' => 'Raccordement', 'subTab' => 'DetailCRVT'],
            'DOEDOC' => ['view' => 'DetailRacco', 'mainTab' => 'Raccordement', 'subTab' => 'DetailCRVT'],
            'DFTDOC' => ['view' => 'DetailRacco', 'mainTab' => 'Raccordement', 'subTab' => 'DetailCRVT'],
            
            // Visite Technique
            'OTPLANIFVTDATE' => ['view' => 'DetailCommande', 'mainTab' => 'Visite Technique', 'subTab' => 'DetailCommande'], // CHANGÉ: maintenant vers DetailCommande
            'PLANIFVTDATE' => ['view' => 'DetailCRVT', 'mainTab' => 'Visite Technique', 'subTab' => 'DetailCRVT'],
            'EDITPLANIFDATE' => ['view' => 'DetailCRVT', 'mainTab' => 'Visite Technique', 'subTab' => 'DetailCRVT'],
            'PLANIFDATEVTKO' => ['view' => 'DetailCRVT', 'mainTab' => 'Visite Technique', 'subTab' => 'DetailCRVT'],
            'CRVTCLI' => ['view' => 'DetailCRVT', 'mainTab' => 'Visite Technique', 'subTab' => 'DetailCRVT'],
            'DOCKO' => ['view' => 'DetailCRVT', 'mainTab' => 'Visite Technique', 'subTab' => 'DetailCRVT'],
            
            // Commentaires
            'COMMENT' => ['view' => 'DetailComment', 'mainTab' => 'Comment', 'subTab' => 'DetailComment'],
            
            // Attente Client
            'ATTENTECLIENT' => ['view' => 'DetailAttenteClient', 'mainTab' => 'Attente Client', 'subTab' => 'Attente Client'],

             // Commentaires
            'PLANIFRACCODATE' => ['view' => 'DetailRaccoPlanifie', 'mainTab' => 'Racco Planifié', 'subTab' => 'DetailRaccoPlanifie'],

            'PLANIFVTDATE' => [
            'view' => 'DetailPlanifie',
            'mainTab' => 'VT Planifiée',
            'subTab' => 'DetailPlanifie'
        ],
        ];

        return $configurations[$prefix] ?? $configurations['default'] ?? [
            'view' => 'DetailCommande',
            'mainTab' => 'Visite Technique',
            'subTab' => 'DetailCRVT'
        ];
    }

    protected function renderOrderNotFound(string $message)
    {
        return Inertia::render('CommandeIntrouvable', [
            'message' => $message,
            'retryUrl' => url()->previous()
        ]);
    }


public function getCsvData()
{
   
    $localDirectory = storage_path('app/csv_files/');
    $archiveDirectory = storage_path('app/archives/');

    if (!File::isDirectory($localDirectory)) {
        File::makeDirectory($localDirectory, 0755, true);
    }
    if (!File::isDirectory($archiveDirectory)) {
        File::makeDirectory($archiveDirectory, 0755, true);
    }

    $allZipFiles = collect();
    $result = [];

    // ==================== 1. LECTURE DU DOSSIER /OUT ====================
    try {
        $diskIn = Storage::disk('sftp_in');
        $filesOut = $diskIn->files('/');
        $zipFilesOut = collect($filesOut)
            ->filter(fn($f) => strtolower(pathinfo($f, PATHINFO_EXTENSION)) === 'zip')
            ->values();
        $allZipFiles = $allZipFiles->merge($zipFilesOut);
        Log::info('📦 Fichiers ZIP OUT: ' . $zipFilesOut->count());
    } catch (\Exception $e) {
        Log::error('❌ Erreur OUT: ' . $e->getMessage());
    }

    // ==================== 2. LECTURE DU DOSSIER /IN ====================
    try {
        $diskOut = Storage::disk('sftp_out');
        $filesIn = $diskOut->files('/');
        $zipFilesIn = collect($filesIn)
            ->filter(fn($f) => strtolower(pathinfo($f, PATHINFO_EXTENSION)) === 'zip')
            ->values();
        $allZipFiles = $allZipFiles->merge($zipFilesIn);
        Log::info('📦 Fichiers ZIP IN: ' . $zipFilesIn->count());
    } catch (\Exception $e) {
        Log::error('❌ Erreur IN: ' . $e->getMessage());
    }

    // ==================== 3. RÉCUPÉRER LES FICHIERS ARCHIVÉS ====================
    $archivedFiles = File::glob($archiveDirectory . '*.zip');
    $archivedZipNames = collect($archivedFiles)
        ->map(fn($f) => basename($f))
        ->values();

    // Récupérer aussi les fichiers dans les sous-dossiers
    $subDirs = File::directories($archiveDirectory);
    foreach ($subDirs as $subDir) {
        $subFiles = File::glob($subDir . '/*.zip');
        foreach ($subFiles as $file) {
            $archivedZipNames->push(basename($file));
        }
    }
    $archivedZipNames = $archivedZipNames->unique();

    Log::info('📦 Fichiers archivés: ' . $archivedZipNames->count());

    // ==================== 4. TRAITEMENT ====================
    $allZipNames = $allZipFiles->map(fn($f) => basename($f))->merge($archivedZipNames)->unique();

    if ($allZipNames->isEmpty()) {
        return response()->json(['message' => 'Aucun fichier ZIP trouvé'], 404);
    }

    foreach ($allZipNames as $zipFilename) {
        $localZipPath = $localDirectory . $zipFilename;
        $prefix = explode('_', $zipFilename)[0];
        
        $zipInfo = [
            'zip_name' => $zipFilename,
            'downloaded' => false,
            'csv_files' => [],
            'source' => null,
            'is_out_file' => false,
            'prefix' => $prefix,
            'archived' => false
        ];

        $zipContent = null;

        // ==================== RÉCUPÉRATION ====================
        
        // 1. Vérifier si le fichier est déjà dans l'archive
        $archivePath = $archiveDirectory . $prefix . '/' . $zipFilename;
        if (file_exists($archivePath)) {
            $zipContent = file_get_contents($archivePath);
            $zipInfo['source'] = 'ARCHIVE';
            $zipInfo['archived'] = true;
            Log::info('📂 Fichier trouvé dans archive: ' . $zipFilename);
        } else {
            // Vérifier dans la racine de l'archive
            $rootArchivePath = $archiveDirectory . $zipFilename;
            if (file_exists($rootArchivePath)) {
                $zipContent = file_get_contents($rootArchivePath);
                $zipInfo['source'] = 'ARCHIVE (racine)';
                $zipInfo['archived'] = true;
                Log::info('📂 Fichier trouvé dans archive racine: ' . $zipFilename);
            }
        }
        
        // 2. Si pas dans l'archive, essayer de récupérer depuis IN (fichiers sortants)
        if (!$zipContent) {
            try {
                $diskOut = Storage::disk('sftp_out');
                if ($diskOut->exists($zipFilename)) {
                    $stream = $diskOut->readStream($zipFilename);
                    $zipContent = stream_get_contents($stream);
                    fclose($stream);
                    $zipInfo['source'] = 'IN (distant)';
                    $zipInfo['is_out_file'] = false;
                    Log::info('📂 Fichier IN trouvé sur SFTP: ' . $zipFilename);
                }
            } catch (\Exception $e) {
                // Ignorer
            }
        }
        
        // 3. Si pas trouvé, essayer depuis OUT
        if (!$zipContent) {
            try {
                $diskIn = Storage::disk('sftp_in');
                if ($diskIn->exists($zipFilename)) {
                    $stream = $diskIn->readStream($zipFilename);
                    $zipContent = stream_get_contents($stream);
                    fclose($stream);
                    $zipInfo['source'] = 'OUT (distant)';
                    $zipInfo['is_out_file'] = true;
                    Log::info('📂 Fichier OUT trouvé sur SFTP: ' . $zipFilename);
                }
            } catch (\Exception $e) {
                // Ignorer
            }
        }
        
        if (!$zipContent) {
            Log::error('❌ Fichier introuvable: ' . $zipFilename);
            continue;
        }

        // Sauvegarder localement
        file_put_contents($localZipPath, $zipContent);
        $zipInfo['downloaded'] = true;

        // Extraction du ZIP
        try {
            $zip = new \ZipArchive;
            if ($zip->open($localZipPath) !== TRUE) {
                throw new \Exception("Impossible d'ouvrir le ZIP");
            }

            $extracted = $zip->extractTo($localDirectory);
            $zip->close();

            if (!$extracted) {
                throw new \Exception("Échec de l'extraction");
            }

            Log::info('📂 ZIP extrait: ' . $zipFilename);

        } catch (\Exception $e) {
            Log::error("❌ Erreur extraction: " . $e->getMessage());
            File::delete($localZipPath);
            $result[] = $zipInfo;
            continue;
        }

        // Traitement des fichiers CSV
        $csvFiles = File::glob($localDirectory . '*.csv');
        
        foreach ($csvFiles as $csvPath) {
            $filename = basename($csvPath);
            $csvPrefix = explode('_', $filename)[0];

            $shouldKeep = false;
            
            if ($zipInfo['is_out_file']) {
                // Fichiers OUT
                if (preg_match('/^(OTPLANIFVTDATE|OTPLANIFRACCODATE|DOCKO|COMMENT|ATTENTECLIENT|ANNULATION).*\.csv$/i', $filename)) {
                    $shouldKeep = true;
                }
            } else {
                // Fichiers IN (PLANIFVTDATE, EDITPLANIFDATE, CRVTCLI, etc.)
                if (preg_match('/^(PLANIFVTDATE|PLANIFDATEVTKO|PLANIFRACCODATE|PLANIFRACCODATEKO|EDITPLANIFDATE|CRVTCLI|CRIDOCCLI|DOEDOC|DFTDOC |ROUTEOPTIQUE).*\.csv$/i', $filename)) {
                    $shouldKeep = true;
                }
            }
            
            if (!$shouldKeep) {
                File::delete($csvPath);
                continue;
            }

            try {
                $fileHandle = fopen($csvPath, 'r');
                $headers = fgetcsv($fileHandle, 0, ',');
                
                $rows = [];
                while (($row = fgetcsv($fileHandle, 0, ',')) !== FALSE) {
                    if (count($headers) === count($row)) {
                        $rows[] = array_combine($headers, $row);
                    }
                }
                fclose($fileHandle);

                $zipInfo['csv_files'][] = [
                    'file_name' => $filename,
                    'columns' => $headers,
                    'row_count' => count($rows),
                    'sample_rows' => array_slice($rows, 0, 5),
                    'source' => $zipInfo['source'],
                    'prefix' => $csvPrefix
                ];

                Log::info('✅ CSV traité: ' . $filename, ['rows' => count($rows)]);

            } catch (\Exception $e) {
                Log::error("❌ Erreur lecture CSV: " . $e->getMessage());
            }

            File::delete($csvPath);
        }

        // ==================== ARCHIVAGE AUTOMATIQUE ====================
        // Archiver TOUS les fichiers PLANIFVTDATE (même ceux qui viennent d'être créés)
        $shouldArchive = in_array($prefix, ['PLANIFVTDATE', 'EDITPLANIFDATE', 'CRVTCLI', 'CRIDOCCLI', 'DOEDOC', 'DFTDOC','OTPLANIFRACCODATE']);
        
        if ($shouldArchive) {
            // Créer le dossier d'archive par préfixe
            $prefixArchiveDir = $archiveDirectory . $prefix . '/';
            if (!File::isDirectory($prefixArchiveDir)) {
                File::makeDirectory($prefixArchiveDir, 0755, true);
            }
            
            $archivePath = $prefixArchiveDir . $zipFilename;
            
            // Archiver si le fichier n'existe pas déjà dans l'archive
            if (!file_exists($archivePath)) {
                copy($localZipPath, $archivePath);
                $zipInfo['archived'] = true;
                Log::info('📦 Fichier archivé automatiquement: ' . $prefix . '/' . $zipFilename);
            } else {
                Log::info('ℹ️ Fichier déjà archivé: ' . $prefix . '/' . $zipFilename);
            }
        }

        // Supprimer le ZIP local
       // File::delete($localZipPath);

        $result[] = $zipInfo;
    }

    // ==================== 5. STATISTIQUES ====================
    $planifVtCount = collect($result)
        ->filter(fn($zip) => str_starts_with($zip['zip_name'], 'PLANIFVTDATE'))
        ->count();

    $archivedCount = collect($result)
        ->filter(fn($zip) => $zip['archived'] === true)
        ->count();

    Log::info('📊 RÉSULTAT FINAL', [
        'total_fichiers' => count($result),
        'planif_vt' => $planifVtCount,
        'archives_crees' => $archivedCount,
        'autres_fichiers' => count($result) - $planifVtCount
    ]);

    return response()->json([
        'success' => true,
        'data' => $result,
        'count' => count($result),
        'stats' => [
            'total_zips' => $allZipNames->count(),
            'processed_zips' => count($result),
            'planif_vt' => $planifVtCount,
            'archives_crees' => $archivedCount
        ]
    ]);
}

/**
 * Méthode de test de connexion SFTP
 */
public function testSftpConnection()
{
    try {
        $disk = Storage::disk('sftp_in');
        $remotePath = env('COVAGE_SFTP_ROOT', '/');
        
        $test = [
            'config' => [
                'disk' => 'sftp_in',
                'host' => env('SFTP_OUT_HOST'),
                'port' => env('SFTP_OUT_PORT'),
                'username' => env('SFTP_OUT_USERNAME'),
                'root_config' => env('COVAGE_SFTP_ROOT'),
                'password_configured' => !empty(env('SFTP_OUT_PASSWORD'))
            ],
            'tests' => []
        ];

        // Test 1: Lister la racine
        $test['tests']['root_files'] = $disk->files('/');
        $test['tests']['root_dirs'] = $disk->directories('/');

        // Test 2: Vérifier le chemin spécifique
        $test['tests']['path_exists'] = $disk->exists($remotePath);
        
        if ($test['tests']['path_exists']) {
            $test['tests']['path_files'] = $disk->files($remotePath);
            $test['tests']['all_files'] = $disk->allFiles($remotePath);
        }

        // Test 3: Chercher les ZIP
        $allFiles = $disk->allFiles('/');
        $test['tests']['all_zip_files'] = collect($allFiles)
            ->filter(fn($f) => str_ends_with(strtolower($f), '.zip'))
            ->values()
            ->toArray();

        return response()->json([
            'success' => true,
            'connection' => 'OK',
            'data' => $test
        ]);

    } catch (\Exception $e) {
         \Log::error('Erreur SFTP détaillée : ' . $e->getMessage(), [
        'code' => $e->getCode(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
        return response()->json([
            'success' => false,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
}

public function uploadCsvData(Request $request)
{
    if (!$request->hasFile('zipFile')) {
        return response()->json(['error' => 'Fichier ZIP manquant.'], 400);
    }

    $zipFile = $request->file('zipFile');
    $localDirectory = storage_path('app/csv_files/');

    if (!file_exists($localDirectory)) {
        mkdir($localDirectory, 0755, true);
    }

    // Génération du nom du fichier ZIP
    $originalZipName = $zipFile->getClientOriginalName();
    preg_match('/^([A-Z0-9]+)/', $originalZipName, $matches);
    $prefix = $matches[1] ?? 'UNKNOWN';

    $base = str_replace([$prefix, '.zip'], '', $originalZipName);
    $base = ltrim($base, '_'); 
    $zipName = $prefix . '_' . $base . '.zip';


    $zipPath = $localDirectory . $zipName;
    $zipFile->move($localDirectory, $zipName);

    // Vérifier que le ZIP est valide
    $zip = new ZipArchive();
    if ($zip->open($zipPath) !== TRUE) {
        unlink($zipPath);
        return response()->json(['error' => 'Le fichier ZIP est invalide.'], 400);
    }
    $zip->close();

    // Transfert vers SFTP
    $disk = Storage::disk('sftp_out');
    $stream = fopen($zipPath, 'r+');

    if (!$stream) {
        unlink($zipPath);
        return response()->json(['error' => 'Erreur lors de l\'ouverture du fichier pour le transfert.'], 500);
    }

    $disk->put($zipName, $stream);
    fclose($stream);

    // Nettoyage du fichier local après transfert
    if (file_exists($zipPath)) {
        unlink($zipPath);
    }

    return response()->json([
        'success' => true,
        'message' => 'ZIP transféré avec succès vers le SFTP.',
        'remote_path' => '/IN/' . $zipName,
    ]);
}


public function uploadCsvDataRacco(Request $request)
{
    if (!auth()->user() || !auth()->user()->can('create raccord action')) {
        return response()->json(['error' => 'Accès refusé : vous n’êtes pas autorisé à effectuer cette action.'], 403);
    }
    $activeTab = $request->input('activeTab');

    $rules = [
        'filename' => 'required|string',
        'content' => 'required|string',
        'activeTab' => 'required|string',
    ];

    if ($activeTab === 'Route Optique') {
        $rules['rop_travaux'] = 'nullable|file|mimes:zip,pdf,xls,xlsx';
        
    } elseif ($activeTab === 'Edit Planif date') {
        $rules['planning_date'] = 'required|date';
        $rules['comment'] = 'nullable|string|max:250';
        
    } elseif ($activeTab === 'Livraison DOE') {
        $rules['cable_shape_bpe'] = [
            'required',
            'file',
            function ($attribute, $value, $fail) {
                $ext = strtolower($value->getClientOriginalExtension());
                if (!in_array($ext, ['dbf', 'shx', 'shp', 'dwg'])) {
                    $fail("Le fichier doit être de type : dbf, shx, shp ou dwg.");
                }
            }
        ];
        $rules['pmv_closure'] = 'nullable|file|mimes:doc,pdf,docx';
        
        // Format: un ou plusieurs chiffres, point, exactement 3 décimales (ex: 2.345, 10.500, 0.001)
        $decimalPattern = '/^\d+\.\d{1,2}$/';
        
        $rules['gc_length'] = ['nullable', 'regex:' . $decimalPattern];
        $rules['ml_length_extension_cable'] = ['nullable', 'regex:' . $decimalPattern];
        $rules['ml_length_racco_cable_private_domain'] = ['nullable', 'regex:' . $decimalPattern];
        $rules['ml_length_racco_cable_public_domain'] = ['nullable', 'regex:' . $decimalPattern];

    } elseif ($activeTab === 'Livraison DFT') {
        $rules['supply_dft'] = 'nullable|file|mimes:zip';
        $rules['supply'] = 'nullable|file|mimes:zip';
    }

    $messages = [
        // Messages pour Livraison DOE
        'cable_shape_bpe.required' => 'Le fichier Cable Shape BPE est obligatoire.',
        'cable_shape_bpe.file' => 'Le fichier doit être un fichier valide.',
        'pmv_closure.file' => 'Le fichier doit être un fichier valide.',
        'pmv_closure.mimes' => 'Le fichier doit être de type : doc, pdf, docx.',
        
        'gc_length.regex' => 'La longueur GC doit être au format 1 chiffre et 2 décimales (ex: 2.45)',
        'ml_length_extension_cable.regex' => "La longueur du câble d'extension doit être au format 1 chiffre et 2 décimales (ex: 2.45)",
        'ml_length_racco_cable_private_domain.regex' => 'La longueur en domaine privé doit être au format 1 chiffre et 2 décimales (ex: 2.45)',
        'ml_length_racco_cable_public_domain.regex' => 'La longueur en domaine public doit être au format 1 chiffre et 2 décimales (ex: 2.45)',
        
        // Messages pour Route Optique
        'rop_travaux.file' => 'Le fichier doit être un fichier valide.',
        'rop_travaux.mimes' => 'Le fichier doit être de type : zip, pdf, xls, xlsx.',
        
        // Messages pour Edit Planif date
        'planning_date.required' => 'La date de planification est obligatoire.',
        'planning_date.date' => 'La date de planification doit être une date valide.',
        'comment.max' => 'Le commentaire ne doit pas dépasser 250 caractères.',
        
        // Messages pour Livraison DFT
        'supply_dft.file' => 'Le fichier doit être un fichier valide.',
        'supply_dft.mimes' => 'Le fichier doit être de type zip.',
        'supply.file' => 'Le fichier doit être un fichier valide.',
        'supply.mimes' => 'Le fichier doit être de type zip.',
    ];

    try {
        $validated = $request->validate($rules, $messages);
    } catch (\Illuminate\Validation\ValidationException $e) {
        Log::error('Erreur de validation uploadRacco', [
            'errors' => $e->errors(),
            'activeTab' => $activeTab,
            'data' => $request->all()
        ]);
        throw $e;
    }

    $disk = Storage::disk('sftp_out');
    $localDirectory = storage_path('app/csv_files/');
    if (!file_exists($localDirectory)) {
        mkdir($localDirectory, 0755, true);
    }

    $filesToAdd = [];

    // Enregistrement du fichier CSV
    $csvFilename = $validated['filename'];
    $csvPath = $localDirectory . $csvFilename;
    file_put_contents($csvPath, $validated['content']);
    $filesToAdd[] = ['path' => $csvPath, 'name' => $csvFilename];

    // Ajout des fichiers supplémentaires selon l'onglet
   if ($activeTab === 'Route Optique') {
    $ropFile = $request->file('rop_travaux');
    if ($ropFile) {
        // Récupérer les informations
        $rds = $request->input('admin_rds', 'HPO-455-CWS');
        $refRop = $request->input('admin_contract', 'REF');
        $datePart = date('Ymd');
        // Récupérer la version depuis la requête
        $version = $request->input('version', 'V1');
        // Si l'utilisateur a saisi un nombre, on le préfixe par V
        if (is_numeric($version)) {
            $version = 'V' . $version;
        }
        // S'assurer que la version commence par V
        if (!str_starts_with($version, 'V')) {
            $version = 'V' . $version;
        }

        $extension = $ropFile->getClientOriginalExtension();
        $newName = "ROP_{$rds}_{$refRop}_{$datePart}_{$version}.{$extension}";

        // Stocker avec Storage
        $path = Storage::disk('local')->putFileAs('csv_files', $ropFile, $newName);
        $fullPath = Storage::disk('local')->path($path);

        $filesToAdd[] = ['path' => $fullPath, 'name' => $newName];
        Log::info('Fichier ROP ajouté via Storage', ['path' => $fullPath, 'version' => $version]);
    }
}

    if ($activeTab === 'Livraison DOE') {
        $cable = $request->file('cable_shape_bpe');
        $pmv = $request->file('pmv_closure');

        if ($cable) {
            $cablePath = $localDirectory . $cable->getClientOriginalName();
            $cable->move($localDirectory, $cable->getClientOriginalName());
            $filesToAdd[] = ['path' => $cablePath, 'name' => basename($cablePath)];
            Log::info('Fichier Cable Shape BPE ajouté', ['file' => $cablePath]);
        }

        if ($pmv) {
            $pmvPath = $localDirectory . $pmv->getClientOriginalName();
            $pmv->move($localDirectory, $pmv->getClientOriginalName());
            $filesToAdd[] = ['path' => $pmvPath, 'name' => basename($pmvPath)];
            Log::info('Fichier PMV Closure ajouté', ['file' => $pmvPath]);
        }

        // Formater les valeurs décimales si elles sont présentes
        $decimalFields = [
            'gc_length',
            'ml_length_extension_cable',
            'ml_length_racco_cable_private_domain',
            'ml_length_racco_cable_public_domain'
        ];
        
        foreach ($decimalFields as $field) {
            if (isset($validated[$field]) && $validated[$field] !== null && $validated[$field] !== '') {
                // S'assurer que le format est correct (1 chiffre et 2 décimales)
                $value = (float)$validated[$field];
                $formatted = number_format($value, 2, '.', '');
                // Mettre à jour les données si nécessaire
                if ($formatted != $validated[$field]) {
                    Log::info('Formatage du champ', [
                        'field' => $field,
                        'original' => $validated[$field],
                        'formatted' => $formatted
                    ]);
                }
            }
        }
    }

    if ($activeTab === 'Livraison DFT') {
        $supp = $request->file('supply_dft');
        $supply = $request->file('supply');

        if ($supp) {
            $suppPath = $localDirectory . $supp->getClientOriginalName();
            $supp->move($localDirectory, $supp->getClientOriginalName());
            $filesToAdd[] = ['path' => $suppPath, 'name' => basename($suppPath)];
            Log::info('Fichier DFT GCB1 ajouté', ['file' => $suppPath]);
        }

        if ($supply) {
            $supplyPath = $localDirectory . $supply->getClientOriginalName();
            $supply->move($localDirectory, $supply->getClientOriginalName());
            $filesToAdd[] = ['path' => $supplyPath, 'name' => basename($supplyPath)];
            Log::info('Fichier DFT GCB2 ajouté', ['file' => $supplyPath]);
        }

        if (!$supp && !$supply) {
            return back()->withErrors(['msg' => 'Au moins un fichier DFT doit être fourni.']);
        }
    }

    // Construction du nom du ZIP identique au CSV mais avec extension zip
    $zipName = preg_replace('/\.csv$/', '.zip', $csvFilename);
    $zipPath = $localDirectory . $zipName;

    try {
        $zip = new ZipArchive();
        if ($zip->open($zipPath, ZipArchive::CREATE) !== TRUE) {
            throw new Exception("Impossible de créer le fichier ZIP.");
        }

        foreach ($filesToAdd as $file) {
            if (file_exists($file['path'])) {
                $zip->addFile($file['path'], $file['name']);
                Log::debug('Fichier ajouté au ZIP', ['file' => $file['name']]);
            } else {
                Log::warning('Fichier introuvable', ['path' => $file['path']]);
            }
        }
        $zip->close();

        // Vérifier que le ZIP a bien été créé
        if (!file_exists($zipPath)) {
            throw new Exception('Le fichier ZIP n\'a pas été créé correctement.');
        }

        $stream = fopen($zipPath, 'r+');
        if (!$stream) {
            throw new Exception('Impossible d\'ouvrir le ZIP pour le transfert.');
        }

        // Transférer sur le SFTP
        $disk->put($zipName, $stream);
        fclose($stream);

        Log::info('Fichier ZIP transféré avec succès', [
            'zip_name' => $zipName,
            'size' => filesize($zipPath),
            'activeTab' => $activeTab,
            'files_count' => count($filesToAdd)
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Fichier ZIP transféré sur le SFTP avec succès.',
            'remote_path' => '/IN/' . $zipName,
            'zip_name' => $zipName,
            'files_count' => count($filesToAdd)
        ]);

    } catch (Exception $e) {
        Log::error('Erreur lors du transfert ZIP', [
            'error' => $e->getMessage(),
            'zip_name' => $zipName,
            'activeTab' => $activeTab,
            'trace' => $e->getTraceAsString()
        ]);
        
        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);

    } finally {
        // Nettoyage des fichiers locaux
        foreach ($filesToAdd as $file) {
            if (file_exists($file['path'])) {
                unlink($file['path']);
                Log::debug('Fichier local supprimé', ['path' => $file['path']]);
            }
        }

        if (file_exists($zipPath)) {
            unlink($zipPath);
            Log::debug('ZIP local supprimé', ['path' => $zipPath]);
        }
    }
}


public function filterVT(Request $request)
{
            $filters = $request->only([
            'address_site_a_name',
            'techno',
            'operator_name',
            'contact_on_site_firstname',
            'order_date',
            'project_name'
        ]);
        
        $query = ZipFile::with(['csv_files' => function($query) {
            $query->orderBy('file_name');
        }]);
        
        // Appliquez les filtres
        foreach ($filters as $field => $value) {
            if (!empty($value)) {
                if ($field === 'order_date') {
                    $query->whereDate($field, $value);
                } else {
                    $query->where($field, 'like', "%{$value}%");
                }
            }
        }
        
        $data = $query->get();
        
        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }




    public function uploadComment(Request $request)
    {
        if (!$request->hasFile('zipFile')) {
            return response()->json(['error' => 'Fichier ZIP manquant.'], 400);
        }

        $zipFile = $request->file('zipFile');
        $localDirectory = storage_path('app/csv_files/');

        if (!file_exists($localDirectory)) {
            mkdir($localDirectory, 0755, true);
        }

        // Génération du nom du fichier ZIP
        $originalZipName = $zipFile->getClientOriginalName();
        preg_match('/^([A-Z0-9]+)/', $originalZipName, $matches);
        $prefix = $matches[1] ?? 'UNKNOWN';

        $base = str_replace([$prefix, '.zip'], '', $originalZipName);
        $base = ltrim($base, '_'); 
        $zipName = $prefix . '_' . $base . '.zip';


        $zipPath = $localDirectory . $zipName;
        $zipFile->move($localDirectory, $zipName);

        // Vérifier que le ZIP est valide
        $zip = new ZipArchive();
        if ($zip->open($zipPath) !== TRUE) {
            unlink($zipPath);
            return response()->json(['error' => 'Le fichier ZIP est invalide.'], 400);
        }
        $zip->close();

        // Transfert vers SFTP
        $disk = Storage::disk('sftp_in_test');
        $stream = fopen($zipPath, 'r+');

        if (!$stream) {
            unlink($zipPath);
            return response()->json(['error' => 'Erreur lors de l\'ouverture du fichier pour le transfert.'], 500);
        }

        $disk->put($zipName, $stream);
        fclose($stream);

        // Nettoyage du fichier local après transfert
        if (file_exists($zipPath)) {
            unlink($zipPath);
        }

        return response()->json([
            'success' => true,
            'message' => 'ZIP transféré avec succès vers le SFTP.',
            'remote_path' => '/' . $zipName,
        ]);
    }


   
    /**
     * Affiche les VT à planifier (OTPLANIFVTDATE sans planning_date)
     */
   public function backlogVT()
{
    // Récupérer les données comme dans ZipViewer
    $response = $this->getCsvData()->getData(true);
    
    if (!is_array($response) || !isset($response['data'])) {
        return Inertia::render('Backlog/BacklogVT', [
            'data' => [],
            'title' => 'Backlog Visite Technique',
            'description' => 'Toutes les demandes de visite technique reçues de Covage',
            'totalRows' => 0,
            'totalFiles' => 0
        ]);
    }
    
    $backlogData = [];
    
    foreach ($response['data'] as $zip) {
        if (!isset($zip['csv_files']) || !is_array($zip['csv_files'])) {
            continue;
        }
        
        foreach ($zip['csv_files'] as $csvFile) {
            $prefix = $csvFile['prefix'] ?? explode('_', $csvFile['file_name'])[0];
            
            // Ne garder que les fichiers OTPLANIFVTDATE
            if ($prefix !== 'OTPLANIFVTDATE') {
                continue;
            }
            
            $backlogData[] = [
                'file_name' => $csvFile['file_name'],
                'columns' => $csvFile['columns'],
                'row_count' => $csvFile['row_count'],
                'sample_rows' => $csvFile['sample_rows'],
                'file_info' => $csvFile['file_info'] ?? null,
                'source' => $csvFile['source'] ?? 'OUT'
            ];
        }
    }
    
    $totalRows = collect($backlogData)->sum('row_count');
    
    return Inertia::render('Backlog/BacklogVT', [
        'data' => $backlogData,
        'title' => 'Backlog Visite Technique',
        'description' => 'Toutes les demandes de visite technique reçues de Covage',
        'totalRows' => $totalRows,
        'totalFiles' => count($backlogData)
    ]);
}

/**
 * Affiche les VT à planifier (OTPLANIFVTDATE sans planning_date)
 */
public function vtAPlanifier()
{
    $response = $this->getCsvData()->getData(true);
    
    if (!is_array($response) || !isset($response['data'])) {
        return Inertia::render('Backlog/VTAPlanifier', [
            'data' => [],
            'title' => 'VT à planifier',
            'description' => 'Visites techniques nécessitant une planification',
            'totalRows' => 0,
            'totalFiles' => 0
        ]);
    }
    
    $backlogData = [];
    
    foreach ($response['data'] as $zip) {
        if (!isset($zip['csv_files']) || !is_array($zip['csv_files'])) {
            continue;
        }
        
        foreach ($zip['csv_files'] as $csvFile) {
            $prefix = $csvFile['prefix'] ?? explode('_', $csvFile['file_name'])[0];
            
            // Ne garder que les fichiers OTPLANIFVTDATE
            if ($prefix !== 'OTPLANIFVTDATE') {
                continue;
            }
            
            // Filtrer les lignes sans planning_date
            $filteredRows = array_filter($csvFile['sample_rows'], function($row) {
                return empty($row['planning_date']);
            });
            
            if (empty($filteredRows)) {
                continue;
            }
            
            $backlogData[] = [
                'file_name' => $csvFile['file_name'],
                'columns' => $csvFile['columns'],
                'row_count' => count($filteredRows),
                'sample_rows' => array_values($filteredRows),
                'file_info' => $csvFile['file_info'] ?? null,
                'source' => $csvFile['source'] ?? 'OUT'
            ];
        }
    }
    
    $totalRows = collect($backlogData)->sum('row_count');
    
    return Inertia::render('Backlog/VTAPlanifier', [
        'data' => $backlogData,
        'title' => 'VT à planifier',
        'description' => 'Visites techniques nécessitant une planification',
        'totalRows' => $totalRows,
        'totalFiles' => count($backlogData)
    ]);
}

/**
 * Affiche les VT planifiées (PLANIFVTDATE)
 */
public function vtPlanifiees()
{
    $response = $this->getCsvData()->getData(true);
    
    if (!is_array($response) || !isset($response['data'])) {
        return Inertia::render('Backlog/VTPlanifiees', [
            'data' => [],
            'title' => 'VT planifiées',
            'description' => 'Visites techniques confirmées (planifiées)',
            'totalRows' => 0,
            'totalFiles' => 0
        ]);
    }
    
    $backlogData = [];
    
    foreach ($response['data'] as $zip) {
        if (!isset($zip['csv_files']) || !is_array($zip['csv_files'])) {
            continue;
        }
        
        foreach ($zip['csv_files'] as $csvFile) {
            $prefix = $csvFile['prefix'] ?? explode('_', $csvFile['file_name'])[0];
            
            // Ne garder que les fichiers PLANIFVTDATE
            if ($prefix !== 'PLANIFVTDATE') {
                continue;
            }
            
            $backlogData[] = [
                'file_name' => $csvFile['file_name'],
                'columns' => $csvFile['columns'],
                'row_count' => $csvFile['row_count'],
                'sample_rows' => $csvFile['sample_rows'],
                'file_info' => $csvFile['file_info'] ?? null,
                'source' => $csvFile['source'] ?? 'IN'
            ];
        }
    }
    
    $totalRows = collect($backlogData)->sum('row_count');
    
    return Inertia::render('Backlog/VTPlanifiees', [
        'data' => $backlogData,
        'title' => 'VT planifiées',
        'description' => 'Visites techniques confirmées (planifiées)',
        'totalRows' => $totalRows,
        'totalFiles' => count($backlogData)
    ]);
}

/**
 * Affiche les CRVT reçus (DOCKO)
 */
public function crvtRecus()
{
    $response = $this->getCsvData()->getData(true);
    
    if (!is_array($response) || !isset($response['data'])) {
        return Inertia::render('Backlog/CRVTRecus', [
            'data' => [],
            'title' => 'CRVT reçus',
            'description' => 'Comptes-rendus de visite technique reçus de Covage',
            'totalRows' => 0,
            'totalFiles' => 0
        ]);
    }
    
    $backlogData = [];
    
    foreach ($response['data'] as $zip) {
        if (!isset($zip['csv_files']) || !is_array($zip['csv_files'])) {
            continue;
        }
        
        foreach ($zip['csv_files'] as $csvFile) {
            $prefix = $csvFile['prefix'] ?? explode('_', $csvFile['file_name'])[0];
            
            // Ne garder que les fichiers DOCKO
            if ($prefix !== 'DOCKO') {
                continue;
            }
            
            $backlogData[] = [
                'file_name' => $csvFile['file_name'],
                'columns' => $csvFile['columns'],
                'row_count' => $csvFile['row_count'],
                'sample_rows' => $csvFile['sample_rows'],
                'file_info' => $csvFile['file_info'] ?? null,
                'source' => $csvFile['source'] ?? 'OUT'
            ];
        }
    }
    
    $totalRows = collect($backlogData)->sum('row_count');
    
    return Inertia::render('Backlog/CRVTRecus', [
        'data' => $backlogData,
        'title' => 'CRVT reçus',
        'description' => 'Comptes-rendus de visite technique reçus de Covage',
        'totalRows' => $totalRows,
        'totalFiles' => count($backlogData)
    ]);
}

    
    protected function getFilteredCsvData($prefix, $source = null, $filterCallback = null)
{
    try {
        $response = $this->getCsvData()->getData(true);
        
        if (!is_array($response) || !isset($response['data'])) {
            return [];
        }
        
        $filteredData = [];
        
        foreach ($response['data'] as $zip) {
            if (!isset($zip['csv_files']) || !is_array($zip['csv_files'])) {
                continue;
            }
            
            foreach ($zip['csv_files'] as $csvFile) {
                if (!isset($csvFile['sample_rows']) || !is_array($csvFile['sample_rows'])) {
                    continue;
                }
                
                $filePrefix = $csvFile['prefix'] ?? explode('_', $csvFile['file_name'])[0];
                
                // Déterminer la source du fichier
                $fileSource = $csvFile['source'] ?? null;
                
                // Si la source n'est pas définie, la déduire du préfixe
                if (!$fileSource) {
                    if (in_array($filePrefix, ['OTPLANIFVTDATE', 'OTPLANIFRACCODATE', 'DOCKO', 'COMMENT', 'ATTENTECLIENT','ANNULATION'])) {
                        $fileSource = 'OUT (entrant)';
                    } elseif (in_array($filePrefix, ['PLANIFVTDATE', 'EDITPLANIFDATE', 'PLANIFDATEVTKO','PLANIFRACCODATEKO', 'CRVTCLI', 'CRIDOCCLI', 'DOEDOC', 'DFTDOC', 'PLANIFRACCODATE', 'ROUTEOPTIQUE'])) {
                        $fileSource = 'IN (sortant)';
                    } else {
                        $fileSource = 'UNKNOWN';
                    }
                }
                
                // Filtrer par préfixe
                if ($filePrefix !== $prefix) {
                    continue;
                }
                
                // Filtrer par source si spécifié
                if ($source !== null) {
                    if ($source === 'IN' && strpos($fileSource, 'IN') === false) {
                        continue;
                    }
                    if ($source === 'OUT' && strpos($fileSource, 'OUT') === false) {
                        continue;
                    }
                }
                
                $rows = $csvFile['sample_rows'];
                
                // Appliquer le filtre personnalisé si fourni
                if ($filterCallback) {
                    $rows = $filterCallback($rows);
                    $rows = array_values($rows);
                }
                
                if (!empty($rows)) {
                    $filteredData[] = [
                        'file_name' => $csvFile['file_name'],
                        'file_info' => $csvFile['file_info'] ?? null,
                        'rows' => $rows,
                        'row_count' => count($rows),
                        'source' => $fileSource,
                        'prefix' => $filePrefix,
                        'received_at' => $csvFile['file_info']['formatted_date'] ?? null,
                        'received_time' => $csvFile['file_info']['formatted_time'] ?? null
                    ];
                }
            }
        }
        
        // Trier par date décroissante (les plus récents d'abord)
        usort($filteredData, function($a, $b) {
            return ($b['received_at'] ?? '') <=> ($a['received_at'] ?? '');
        });
        
        return $filteredData;
        
    } catch (\Exception $e) {
        Log::error('Erreur getFilteredCsvData', [
            'prefix' => $prefix,
            'source' => $source,
            'error' => $e->getMessage()
        ]);
        return [];
    }
}
    /**
     * Méthode pour obtenir les statistiques pour le tableau de bord
     * Les statistiques sont basées sur la source (IN/OUT)
     */
    public function getDashboardStats()
    {
        try {
            $response = $this->getCsvData()->getData(true);
            
            if (!is_array($response) || !isset($response['data'])) {
                return response()->json([
                    'stats' => [
                        // Fichiers entrants (de Covage)
                        'vt_a_planifier' => 0,
                        'crvt_recus' => 0,
                        'racco_a_planifier' => 0,
                        'commentaires' => 0,
                        'attente_client' => 0,
                        // Fichiers sortants (vos réponses)
                        'vt_planifiees' => 0,
                        'racco_planifies' => 0,
                        'cr_interventions' => 0
                    ]
                ]);
            }
            
            $stats = [
                // Fichiers entrants (source OUT)
                'vt_a_planifier' => 0,
                'crvt_recus' => 0,
                'racco_a_planifier' => 0,
                'commentaires' => 0,
                'attente_client' => 0,
                // Fichiers sortants (source IN)
                'vt_planifiees' => 0,
                'racco_planifies' => 0,
                'cr_interventions' => 0
            ];
            
            foreach ($response['data'] as $zip) {
                if (!isset($zip['csv_files']) || !is_array($zip['csv_files'])) {
                    continue;
                }
                
                foreach ($zip['csv_files'] as $csvFile) {
                    if (!isset($csvFile['sample_rows']) || !is_array($csvFile['sample_rows'])) {
                        continue;
                    }
                    
                    $prefix = $csvFile['file_info']['prefix'] ?? explode('_', $csvFile['file_name'])[0];
                    $source = $csvFile['source'] ?? ($prefix === 'PLANIFVTDATE' || $prefix === 'PLANIFRACCODATE' ? 'IN' : 'OUT');
                    $rows = $csvFile['sample_rows'];
                    $count = count($rows);
                    
                    // Fichiers entrants (de Covage - source OUT)
                    if ($source === 'OUT') {
                        switch ($prefix) {
                            case 'OTPLANIFVTDATE':
                                $sansDate = count(array_filter($rows, fn($r) => empty($r['planning_date'])));
                                $stats['vt_a_planifier'] += $sansDate;
                                break;
                            case 'DOCKO':
                                $stats['crvt_recus'] += $count;
                                break;
                            case 'OTPLANIFRACCODATE':
                                $sansDate = count(array_filter($rows, fn($r) => empty($r['planning_date'])));
                                $stats['racco_a_planifier'] += $sansDate;
                                break;
                            case 'COMMENT':
                                $stats['commentaires'] += $count;
                                break;
                            case 'ATTENTECLIENT':
                                $stats['attente_client'] += $count;
                                break;
                        }
                    }
                    // Fichiers sortants (vos réponses - source IN)
                    else {
                        switch ($prefix) {
                            case 'PLANIFVTDATE':
                                $stats['vt_planifiees'] += $count;
                                break;
                            case 'PLANIFRACCODATE':
                                $stats['racco_planifies'] += $count;
                                break;
                            case 'CRIDOCCLI':
                                $stats['cr_interventions'] += $count;
                                break;
                        }
                    }
                }
            }
            
            return response()->json([
                'success' => true,
                'stats' => $stats
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur getDashboardStats', [
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Affiche le dashboard avec les statistiques
     */
    public function dashboard()
    {
        return Inertia::render('Dashboard', [
            'stats' => $this->getDashboardStats()->getData(true)['stats'] ?? []
        ]);
    }

/**
     * Importe les données OTPLANIFVTDATE dans la table visite_techniques
     */
    public function importOtplanifvtdate()
    {
        $importService = new OtplanifvtdateImportService();
        $result = $importService->importFromCsvData();
        
        if ($result['success']) {
            return response()->json([
                'success' => true,
                'message' => "Import réussi !",
                'stats' => [
                    'imported' => $result['imported'],
                    'updated' => $result['updated'],
                    'skipped' => $result['skipped'],
                    'errors' => $result['errors']
                ]
            ]);
        }
        
        return response()->json([
            'success' => false,
            'error' => $result['error'],
            'stats' => [
                'imported' => $result['imported'],
                'updated' => $result['updated'],
                'skipped' => $result['skipped'],
                'errors' => $result['errors']
            ]
        ], 500);
    }
    
    /**
     * Affiche la liste des visites techniques importées
     */
    public function listeVisitesTechniques(Request $request)
    {
        $query = VisiteTechnique::query()
            ->currentVersion()
             ->with('annulation')
            ->orderBy('order_date', 'desc');
        
        // Filtres
        if ($request->has('operator') && $request->operator) {
            $query->byOperator($request->operator);
        }
        
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }
        
        if ($request->has('project') && $request->project) {
            $query->byProject($request->project);
        }
        
        if ($request->has('date_from') && $request->date_from) {
            $query->whereDate('order_date', '>=', $request->date_from);
        }
        
        if ($request->has('date_to') && $request->date_to) {
            $query->whereDate('order_date', '<=', $request->date_to);
        }
        
        $visites = $query->paginate(20);
        
        // Statistiques
        $stats = [
            'total' => VisiteTechnique::currentVersion()->count(),
            'planned' => VisiteTechnique::currentVersion()->where('status', VisiteTechnique::STATUS_PLANNED)->count(),
            'completed' => VisiteTechnique::currentVersion()->where('status', VisiteTechnique::STATUS_COMPLETED)->count(),
            'failed' => VisiteTechnique::currentVersion()->where('status', VisiteTechnique::STATUS_FAILED)->count(),
            'postponed' => VisiteTechnique::currentVersion()->where('status', VisiteTechnique::STATUS_POSTPONED)->count(),
        ];
        
        return Inertia::render('VisitesTechniques/Index', [
            'visites' => $visites,
            'stats' => $stats,
            'filters' => $request->all()
        ]);
    }
    
    /**
     * Affiche les détails d'une visite technique
     */
public function index(Request $request)
{
    $filter = $request->get('filter', 'all');
    $search = $request->get('search', '');

    $query = VisiteTechnique::withCount('actions')
        ->with(['lastAction', 'annulation']); // ← ajout de annulation

    switch ($filter) {
        case 'planned':
            $query->whereHas('lastAction', fn($q) => $q->where('action_type', 'planification'));
            break;
        case 'delivered':
            $query->whereHas('lastAction', fn($q) => $q->where('action_type', 'livraison_crvt'));
            break;
        case 'impossible':
            $query->whereHas('lastAction', fn($q) => $q->where('action_type', 'impossibilite'));
            break;
    }

    if (!empty($search)) {
        $query->where(function ($q) use ($search) {
            $q->where('admin_rds', 'LIKE', "%{$search}%")
              ->orWhere('admin_bca', 'LIKE', "%{$search}%")
              ->orWhere('admin_contract', 'LIKE', "%{$search}%");
        });
    }

    $visites = $query->orderBy('created_at', 'desc')->get();

    $counts = [
        'all' => VisiteTechnique::count(),
        'planned' => VisiteTechnique::whereHas('lastAction', fn($q) => $q->where('action_type', 'planification'))->count(),
        'delivered' => VisiteTechnique::whereHas('lastAction', fn($q) => $q->where('action_type', 'livraison_crvt'))->count(),
        'impossible' => VisiteTechnique::whereHas('lastAction', fn($q) => $q->where('action_type', 'impossibilite'))->count(),
    ];

    $visitesArray = $visites->map(function($visite) {
        return [
            'id' => $visite->id,
            'admin_rds' => $visite->admin_rds,
            'admin_bca' => $visite->admin_bca,
            'project_name' => $visite->project_name,
            'operator_name' => $visite->operator_name,
            'admin_contract' => $visite->admin_contract,
            'address_site_a_name' => $visite->address_site_a_name,
            'address_site_a_town' => $visite->address_site_a_town,
            'order_date' => $visite->order_date?->format('d/m/Y'),
            'actions_count' => $visite->actions_count,
            'last_action_type' => $visite->lastAction?->action_type,
            'last_action_date' => $visite->lastAction?->file_date?->format('d/m/Y'),
            // Nouveaux champs
            'is_annule' => $visite->annulation ? true : false,
            'annulation_date' => $visite->annulation?->cancellation_date?->format('d/m/Y'),
        ];
    });

    return Inertia::render('VisiteTechniques/Index', [
        'visites' => $visitesArray,
        'counts' => $counts,
        'currentFilter' => $filter,
        'search' => $search,
    ]);
}
    
    /**
     * Affiche les détails d'une visite technique
     */
 public function show($id)
{
    // Récupérer la visite avec ses actions
    $visite = VisiteTechnique::with(['actions' => function($query) {
        $query->orderBy('file_timestamp', 'desc');
    }])->findOrFail($id);
    
    // Récupérer les commentaires associés à cette VT (même RDS et BCA)
    $commentaires = Commentaire::where('rds', $visite->admin_rds)
        ->where('bca', $visite->admin_bca)
        ->where('commande_type', Commentaire::COMMANDE_VT)
        ->orderBy('file_timestamp', 'desc')
        ->orderBy('created_at', 'desc')
        ->get();  // ✅ on garde la collection

        // Récupérer la dernière période d'attente client pour cette commande
    $attente = AttenteClient::where('admin_rds', $visite->admin_rds)
        ->where('admin_bca', $visite->admin_bca)
        ->orderBy('created_at', 'desc')
        ->first();

    // Transformer les commentaires pour la vue
    $commentairesArray = $commentaires->map(function($commentaire) {
        return [
            'id' => $commentaire->id,
            'uuid' => $commentaire->uuid,
            'contenu' => $commentaire->contenu,
            'auteur' => $commentaire->auteur,
            'type_commentaire' => $commentaire->type_commentaire,
            'type_label' => $commentaire->type_label,
            'source' => $commentaire->source,
            'source_label' => $commentaire->source_label,
            'est_reponse' => $commentaire->est_reponse,
            'reponse_a_id' => $commentaire->reponse_a_id,
            'fichiers_joints' => $commentaire->fichiers_joints,
            'file_date' => $commentaire->file_date?->format('d/m/Y'),
            'file_time' => $commentaire->file_time?->format('H:i'),
            'created_at' => $commentaire->created_at?->format('d/m/Y H:i'),
            'lu' => $commentaire->lu,
        ];
    })->toArray();

    // Séparer les commentaires principaux et les réponses
    $commentairesPrincipaux = array_filter($commentairesArray, function($c) {
        return !$c['est_reponse'];
    });
    
    $reponses = array_filter($commentairesArray, function($c) {
        return $c['est_reponse'];
    });
    
    // Organiser les réponses par commentaire parent
    foreach ($commentairesPrincipaux as &$commentaire) {
        $commentaire['reponses'] = array_values(array_filter($reponses, function($r) use ($commentaire) {
            return $r['reponse_a_id'] == $commentaire['id'];
        }));
    }
    
    // Statistiques des commentaires
    $commentairesStats = [
        'total' => $commentaires->count(),
        'non_lus' => $commentaires->where('lu', false)->count(),
        'de_covage' => $commentaires->where('source', 'OUT')->count(),
        'de_notre_app' => $commentaires->where('source', 'IN')->count(),
    ];
    
    // Transformer les actions (similaire, sans erreur)
    $actionsArray = $visite->actions->map(function($action) {
        return [
            'id' => $action->id,
            'action_type' => $action->action_type,
            'label' => $action->label,
            'icon' => $action->icon,
            'color' => $action->color,
            'file_date' => $action->file_date?->format('d/m/Y'),
            'file_time' => $action->file_time?->format('H:i'),
            'source_file' => $action->source_file,
            'source' => $action->source,
            'created_at' => $action->created_at?->format('d/m/Y H:i'),
            
            // Planification
            'planning_date' => $action->planning_date?->format('d/m/Y'),
            'planning_comment' => $action->planning_comment,
            
            // Impossibilité
            'impossibility_fail_reason' => $action->impossibility_fail_reason,
            'impossibility_comment' => $action->impossibility_comment,
            
            // CRVT
            'crvt_effective_date' => $action->crvt_effective_date?->format('d/m/Y'),
            'crvt_comment' => $action->crvt_comment,
            'crvt_infra_to_be_created' => $action->crvt_infra_to_be_created,
            'crvt_result_status' => $action->crvt_result_status,
            'crvt_submission_date' => $action->crvt_submission_date?->format('d/m/Y'),

            //CVRTCLIKO
             'crvt_recu_fail_reason' => $action->crvt_recu_fail_reason, // 
        'crvt_recu_effective_date' => $action->crvt_recu_effective_date?->format('d/m/Y'),
        'crvt_recu_result_status' => $action->crvt_recu_result_status,
        'crvt_recu_comment' => $action->crvt_recu_comment,
        ];
    })->toArray();
    
    // Transformer les données de la visite
    $visiteData = [
        'id' => $visite->id,
        'admin_rds' => $visite->admin_rds,
        'admin_bca' => $visite->admin_bca,
        'admin_contract' => $visite->admin_contract,
        'project_name' => $visite->project_name,
        'operator_name' => $visite->operator_name,
        'techno' => $visite->techno,
        'order_date' => $visite->order_date?->format('d/m/Y'),
        'address_site_a_name' => $visite->address_site_a_name,
        'address_site_a_street' => $visite->address_site_a_street,
        'address_site_a_postal' => $visite->address_site_a_postal,
        'address_site_a_town' => $visite->address_site_a_town,
        'contact_on_site_firstname' => $visite->contact_on_site_firstname,
        'contact_on_site_lastname' => $visite->contact_on_site_lastname,
        'contact_on_site_phone' => $visite->contact_on_site_phone,
        'contact_on_site_mail' => $visite->contact_on_site_mail,
        'covage_contact_name' => $visite->covage_contact_name,
        'client_directive_access' => $visite->client_directive_access,
        'client_directive_intervention' => $visite->client_directive_intervention,
        'client_directive_planning' => $visite->client_directive_planning,
        'created_at' => $visite->created_at?->format('d/m/Y H:i'),
    ];
    
    // Statistiques des actions
    $actionsStats = [
        'total' => $visite->actions->count(),
        'planification' => $visite->actions->where('action_type', 'planification')->count(),
        'impossibilite' => $visite->actions->where('action_type', 'impossibilite')->count(),
        'livraison_crvt' => $visite->actions->where('action_type', 'livraison_crvt')->count(),
    ];
    
    // Statut actuel
    $currentStatus = $this->getCurrentStatus($visite);
    

    $crvtRejected = false;
$crvtRejectReason = null;

// Récupérer la dernière action de type 'crvt_recu' (retour Covage) avec un motif d'échec
$lastCrvtRecu = $visite->actions->where('action_type', 'crvt_recu')->first();
if ($lastCrvtRecu && !empty($lastCrvtRecu->crvt_recu_fail_reason)) {
    $crvtRejected = true;
    $crvtRejectReason = $lastCrvtRecu->crvt_recu_fail_reason;
}
    return Inertia::render('VisiteTechniques/Show', [
        'visite' => $visiteData,
        'actions' => $actionsArray,
        'actionsStats' => $actionsStats,
        'currentStatus' => $currentStatus,
        'commentaires' => $commentairesArray,
        'commentairesStats' => $commentairesStats,
        'attente' => $attente,
        'crvtRejected' => $crvtRejected,           // ← nouveau
    'crvtRejectReason' => $crvtRejectReason,   // ← nouveau
    ]);
}
    
    /**
     * Marquer un commentaire comme lu
     */
    public function marquerCommentaireLu($id)
    {
        $commentaire = Commentaire::findOrFail($id);
        $commentaire->marquerCommeLu();
        
        return response()->json(['success' => true]);
    }
    
    /**
     * Ajouter un commentaire à une VT
     */
    public function ajouterCommentaire(Request $request, $id)
    {
        $request->validate([
            'contenu' => 'required|string|min:3|max:1000',
            'reponse_a_id' => 'nullable|exists:commentaires,id',
        ]);
        
        $visite = VisiteTechnique::findOrFail($id);
        
        $commentaire = new Commentaire();
        $commentaire->type_document = 'COMMENT';
        $commentaire->prefix = 'COMMENT';
        $commentaire->source = 'MANUAL';
        $commentaire->source_file = 'manual_' . now()->format('Ymd_His') . '.csv';
        $commentaire->rds = $visite->admin_rds;
        $commentaire->bca = $visite->admin_bca;
        $commentaire->commande_type = Commentaire::COMMANDE_VT;
        $commentaire->commande_id = $visite->id;
        $commentaire->auteur = auth()->user()->name ?? 'Application';
        $commentaire->contenu = $request->contenu;
        $commentaire->type_commentaire = $request->reponse_a_id ? Commentaire::TYPE_REPONSE_COMMENTAIRE : Commentaire::TYPE_QUESTION;
        $commentaire->est_reponse = !empty($request->reponse_a_id);
        $commentaire->reponse_a_id = $request->reponse_a_id;
        $commentaire->imported_at = now();
        $commentaire->save();
        
        // Ici, vous pouvez ajouter la logique pour générer le fichier CSV et l'envoyer via SFTP
        
        return redirect()->back()->with('success', 'Commentaire ajouté avec succès');
    }
    
    protected function getCurrentStatus($visite)
    {
        $lastAction = $visite->actions->sortByDesc('file_timestamp')->first();
        
        if (!$lastAction) {
            return [
                'code' => 'pending',
                'label' => 'En attente',
                'color' => 'gray',
                'icon' => '⏳'
            ];
        }
        
        $statusMap = [
            'demande' => ['code' => 'pending', 'label' => 'Demande reçue', 'color' => 'blue', 'icon' => '📥'],
            'planification' => ['code' => 'planned', 'label' => 'Planifiée', 'color' => 'green', 'icon' => '📅'],
            'impossibilite' => ['code' => 'impossible', 'label' => 'Impossible', 'color' => 'red', 'icon' => '⚠️'],
            'livraison_crvt' => ['code' => 'completed', 'label' => 'Terminée', 'color' => 'purple', 'icon' => '✅'],
        ];
        
        return $statusMap[$lastAction->action_type] ?? [
            'code' => 'unknown',
            'label' => 'Inconnu',
            'color' => 'gray',
            'icon' => '❓'
        ];
    }
    /**
     * Détermine le statut à partir de la dernière action
     */
    protected function getStatusFromLastAction($lastAction)
    {
        if (!$lastAction) {
            return [
                'code' => 'pending',
                'label' => 'En attente',
                'color' => 'gray',
                'icon' => '⏳'
            ];
        }
        
        $statusMap = [
            'demande' => ['code' => 'pending', 'label' => 'Demande reçue', 'color' => 'blue', 'icon' => '📥'],
            'planification' => ['code' => 'planned', 'label' => 'Planifiée', 'color' => 'green', 'icon' => '📅'],
            'impossibilite' => ['code' => 'impossible', 'label' => 'Impossible', 'color' => 'red', 'icon' => '⚠️'],
            'livraison_crvt' => ['code' => 'completed', 'label' => 'Terminée', 'color' => 'purple', 'icon' => '✅'],
        ];
        
        return $statusMap[$lastAction->action_type] ?? [
            'code' => 'unknown',
            'label' => 'Inconnu',
            'color' => 'gray',
            'icon' => '❓'
        ];
    }
    // Dans VisiteTechniqueController.php
public function importInFiles()
{
    $importService = new \App\Services\ImportInFilesService();
    $result = $importService->importFromInDirectory();
    
    if ($result['success']) {
        return redirect()->back()->with('success', 
            "Import /IN réussi : {$result['stats']['imported']} actions importées"
        );
    }
    
    return redirect()->back()->with('error', 
        "Erreur import /IN: " . implode(', ', $result['stats']['errors'])
    );
}
}
