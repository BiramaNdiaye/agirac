<?php

namespace App\Services;

use App\Models\ZipFile;
use App\Models\CsvFile;
use App\Models\Order;
use App\Models\OrderVersion;
use App\Models\OrderData;
use App\Models\Comment;
use App\Models\OrderStatistic;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class CsvImportService
{
    protected $localDirectory;
    
    public function __construct()
    {
        $this->localDirectory = storage_path('app/csv_files/');
    }
    
    /**
     * Importe tous les fichiers CSV dans la base de données
     */
    public function importAllCsvFiles()
    {
        DB::beginTransaction();
        
        try {
            $controller = app(\App\Http\Controllers\SftpUploadController::class);
            $response = $controller->getCsvData()->getData(true);
            
            if (!isset($response['data'])) {
                throw new \Exception('Aucune donnée à importer');
            }
            
            $importedCount = 0;
            $ordersProcessed = [];
            
            foreach ($response['data'] as $zipData) {
                $result = $this->importZipData($zipData);
                $importedCount += $result['count'];
                $ordersProcessed = array_merge($ordersProcessed, $result['orders']);
            }
            
            // Mettre à jour les statistiques pour les commandes modifiées
            foreach (array_unique($ordersProcessed) as $orderId) {
                $this->updateOrderStatistics($orderId);
            }
            
            DB::commit();
            
            Log::info('Import terminé', [
                'total_imported' => $importedCount,
                'orders_affected' => count(array_unique($ordersProcessed))
            ]);
            
            return [
                'success' => true,
                'imported' => $importedCount,
                'orders_affected' => count(array_unique($ordersProcessed))
            ];
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur importation', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Importe les données d'un ZIP
     */
    protected function importZipData($zipData)
    {
        $importedCount = 0;
        $ordersProcessed = [];
        
        // Créer l'enregistrement du ZIP
        $zipFile = ZipFile::updateOrCreate(
            ['filename' => $zipData['zip_name']],
            [
                'prefix' => $zipData['prefix'] ?? explode('_', $zipData['zip_name'])[0],
                'source' => $zipData['source'] ?? 'UNKNOWN',
                'is_archived' => $zipData['archived'] ?? false,
                'processed_at' => now(),
                'file_size' => $zipData['file_size'] ?? null
            ]
        );
        
        // Traiter chaque fichier CSV
        foreach ($zipData['csv_files'] as $csvData) {
            $result = $this->importCsvData($zipFile->id, $csvData);
            $importedCount += $result['count'];
            $ordersProcessed = array_merge($ordersProcessed, $result['orders']);
        }
        
        return [
            'count' => $importedCount,
            'orders' => $ordersProcessed
        ];
    }
    
    /**
     * Importe un fichier CSV
     */
    protected function importCsvData($zipFileId, $csvData)
    {
        $importedCount = 0;
        $ordersProcessed = [];
        
        // Créer l'enregistrement du CSV
        $csvFile = CsvFile::create([
            'zip_file_id' => $zipFileId,
            'filename' => $csvData['file_name'],
            'prefix' => $csvData['prefix'] ?? explode('_', $csvData['file_name'])[0],
            'row_count' => $csvData['row_count'],
            'extracted_at' => now()
        ]);
        
        // Traiter chaque ligne du CSV
        foreach ($csvData['sample_rows'] as $rowData) {
            $orderId = $this->importOrderData($csvFile->id, $rowData, $csvData);
            if ($orderId) {
                $ordersProcessed[] = $orderId;
                $importedCount++;
            }
        }
        
        return [
            'count' => $importedCount,
            'orders' => $ordersProcessed
        ];
    }
    
    /**
     * Importe les données d'une commande
     */
    protected function importOrderData($csvFileId, $rowData, $csvData)
    {
        // Extraire RDS et BCA
        $rds = $rowData['admin_rds'] ?? $rowData['rds'] ?? null;
        $bca = $rowData['bca'] ?? null;
        $prefix = $csvData['prefix'] ?? explode('_', $csvData['file_name'])[0];
        
        if (!$rds || !$bca) {
            Log::warning('Données incomplètes - RDS ou BCA manquant', ['row' => $rowData]);
            return null;
        }
        
        // Trouver ou créer la commande
        $order = Order::firstOrCreate(
            ['rds' => $rds, 'bca' => $bca],
            [
                'contract' => $rowData['admin_contract'] ?? null,
                'prefix' => $rowData['admin_prefix'] ?? $prefix,
                'current_status' => $this->determineStatus($prefix, $rowData)
            ]
        );
        
        // Créer une version
        $fileInfo = $this->parseFileInfo($csvData['file_name']);
        
        $orderVersion = OrderVersion::create([
            'order_id' => $order->id,
            'csv_file_id' => $csvFileId,
            'version_number' => $this->getNextVersionNumber($order->id),
            'prefix' => $prefix,
            'file_date' => $fileInfo['date'],
            'file_time' => $fileInfo['time'],
            'file_timestamp' => $fileInfo['timestamp']
        ]);
        
        // Créer les données détaillées avec toutes les variables
        OrderData::create([
            'order_version_id' => $orderVersion->id,
            
            // Adresses site A
            'address_site_a_name' => $rowData['address_site_a_name'] ?? null,
            'address_site_a_street' => $rowData['address_site_a_street'] ?? null,
            'address_site_a_postal' => $rowData['address_site_a_postal'] ?? null,
            'address_site_a_town' => $rowData['address_site_a_town'] ?? null,
            'address_site_a_x' => $this->formatCoordinate($rowData['address_site_a_x'] ?? null),
            'address_site_a_y' => $this->formatCoordinate($rowData['address_site_a_y'] ?? null),
            
            // Informations techniques
            'bandwidth' => $rowData['bandwith'] ?? null,
            'techno' => $rowData['techno'] ?? null,
            'network' => $rowData['network'] ?? null,
            'offer' => $rowData['offer'] ?? null,
            'nro_name' => $rowData['nro_name'] ?? null,
            'nro_port' => $rowData['nro_port'] ?? null,
            'equipement_number' => $rowData['equipement_number'] ?? null,
            'mer_number' => $rowData['mer_number'] ?? null,
            
            // Dates
            'order_date' => $this->formatDate($rowData['order_date'] ?? null),
            'bca_sending_date' => $this->formatDate($rowData['bca_sending_date'] ?? null),
            
            // Opérateur
            'operator_name' => $rowData['operator_name'] ?? null,
            'operator_client_ref' => $rowData['operator_client_ref'] ?? null,
            'oi_reference' => $rowData['oi_reference'] ?? null,
            'rop_ref' => $rowData['rop_ref'] ?? null,
            'project_name' => $rowData['project_name'] ?? null,
            
            // Contacts site
            'contact_on_site_firstname' => $rowData['contact_on_site_firstname'] ?? null,
            'contact_on_site_lastname' => $rowData['contact_on_site_lastname'] ?? null,
            'contact_on_site_phone' => $rowData['contact_on_site_phone'] ?? null,
            'contact_on_site_mail' => $rowData['contact_on_site_mail'] ?? null,
            
            // Contacts Covage
            'covage_contact_name' => $rowData['covage_contact_name'] ?? null,
            'covage_contact_phone' => $rowData['covage_contact_phone'] ?? null,
            'covage_contact_mail' => $rowData['covage_contact_mail'] ?? null,
            
            // Directives client
            'client_directive_access' => $rowData['client_directive_access'] ?? null,
            'client_directive_intervention' => $rowData['client_directive_intervention'] ?? null,
            'client_directive_planning' => $rowData['client_directive_planning'] ?? null,
            
            // Attente client
            'client_wait_end' => $this->formatDate($rowData['client_wait_end'] ?? null),
            'begin_client_wait' => $this->formatDate($rowData['begin_client_wait'] ?? null),
            
            // Références techniques
            'building_code' => $rowData['building_code'] ?? null,
            'bpe_piquage' => $rowData['bpe_piquage'] ?? null,
            
            // INSEE
            'insee_code' => $rowData['insee_code'] ?? null,
            'article_designation' => $rowData['article_designation'] ?? null,
            
            // Commentaire
            'comment' => $rowData['comment'] ?? null,
            
            // Données brutes
            'raw_data' => json_encode($rowData)
        ]);
        
        // Si c'est un commentaire, l'ajouter dans la table dédiée
        if (isset($rowData['comment']) && !empty($rowData['comment'])) {
            Comment::create([
                'order_id' => $order->id,
                'author' => $rowData['contact_on_site_firstname'] ?? $rowData['operator_name'] ?? 'System',
                'content' => $rowData['comment'],
                'comment_type' => $this->determineCommentType($prefix, $rowData)
            ]);
        }
        
        // Mettre à jour le statut
        $newStatus = $this->determineStatus($prefix, $rowData);
        if ($order->current_status !== $newStatus) {
            $order->update(['current_status' => $newStatus]);
        }
        
        return $order->id;
    }
    
    /**
     * Détermine le statut en fonction du préfixe et des données
     */
    protected function determineStatus($prefix, $rowData)
    {
        // Statut basé sur le préfixe
        $statusMap = [
            'OTPLANIFVTDATE' => 'pending',
            'PLANIFVTDATE' => 'planned',
            'CRVTCLIKO' => 'completed',
            'CRVTCLI' => 'completed',
            'OTPLANIFRACCODATE' => 'pending',
            'PLANIFRACCODATE' => 'planned',
            'ATTENTECLIENT' => 'waiting_client',
            'COMMENT' => 'pending',
        ];
        
        $status = $statusMap[$prefix] ?? 'pending';
        
        // Vérifier si en attente client
        if (!empty($rowData['client_wait_end']) || !empty($rowData['begin_client_wait'])) {
            $status = 'waiting_client';
        }
        
        return $status;
    }
    
    /**
     * Détermine le type de commentaire
     */
    protected function determineCommentType($prefix, $rowData)
    {
        if ($prefix === 'COMMENT') {
            return 'user';
        }
        if (isset($rowData['admin_comment'])) {
            return 'admin';
        }
        return 'system';
    }
    
    /**
     * Parse les informations du fichier
     */
    protected function parseFileInfo($filename)
    {
        $name = str_replace(['.zip', '.csv'], '', $filename);
        $parts = explode('_', $name);
        
        $info = [
            'date' => $parts[3] ?? null,
            'time' => $parts[4] ?? null,
            'timestamp' => null
        ];
        
        if ($info['date'] && strlen($info['date']) == 8) {
            $year = substr($info['date'], 0, 4);
            $month = substr($info['date'], 4, 2);
            $day = substr($info['date'], 6, 2);
            $info['timestamp'] = strtotime("$year-$month-$day");
            
            if ($info['time'] && strlen($info['time']) == 4) {
                $hour = substr($info['time'], 0, 2);
                $minute = substr($info['time'], 2, 2);
                $info['datetime'] = "$year-$month-$day $hour:$minute:00";
            }
        }
        
        return $info;
    }
    
    /**
     * Formate les coordonnées
     */
    protected function formatCoordinate($value)
    {
        if (empty($value)) return null;
        
        // Convertir en float
        return (float) str_replace(',', '.', $value);
    }
    
    /**
     * Formate les dates
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
     * Récupère le prochain numéro de version
     */
    protected function getNextVersionNumber($orderId)
    {
        $lastVersion = OrderVersion::where('order_id', $orderId)
            ->orderBy('version_number', 'desc')
            ->first();
            
        return $lastVersion ? $lastVersion->version_number + 1 : 1;
    }
    
    /**
     * Met à jour les statistiques d'une commande
     */
    protected function updateOrderStatistics($orderId)
    {
        $stats = OrderStatistic::firstOrNew(['order_id' => $orderId]);
        
        $stats->version_count = OrderVersion::where('order_id', $orderId)->count();
        $stats->total_comments = Comment::where('order_id', $orderId)->count();
        $stats->has_attachments = Attachment::where('order_id', $orderId)->exists();
        $stats->last_update = now();
        
        // Calculer les jours de traitement
        $firstVersion = OrderVersion::where('order_id', $orderId)
            ->orderBy('created_at', 'asc')
            ->first();
            
        if ($firstVersion) {
            $stats->processing_time_days = Carbon::parse($firstVersion->created_at)
                ->diffInDays(now());
        }
        
        $stats->save();
    }
}
