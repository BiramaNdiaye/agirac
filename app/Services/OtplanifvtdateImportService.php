<?php

namespace App\Services;

use App\Models\VisiteTechnique;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Traits\ImportNotifierTrait;

class OtplanifvtdateImportService
{
    use ImportNotifierTrait;
    protected $importedCount = 0;
    protected $updatedCount = 0;
    protected $skippedCount = 0;
    protected $errors = [];
    
    /**
     * Importe toutes les données OTPLANIFVTDATE depuis getCsvData()
     */
    public function importFromCsvData()
    {
        DB::beginTransaction();
         
        try {
            // Récupérer les données via le contrôleur existant
            $controller = app(\App\Http\Controllers\SftpUploadController::class);
            $response = $controller->getCsvData()->getData(true);
            
            if (!isset($response['data']) || empty($response['data'])) {
                throw new \Exception('Aucune donnée CSV trouvée');
            }
            
            $this->resetCounters();
             $this->resetProcessedFiles();
            foreach ($response['data'] as $zipData) {
                $this->processZipData($zipData);
            }
            
            DB::commit();
            
// Notification après import réussi
            $this->sendNotificationIfNeeded('OTPLANIFVTDATE');

            Log::info('Import OTPLANIFVTDATE terminé', [
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
            Log::error('Erreur import OTPLANIFVTDATE', [
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
    
    /**
     * Traite un fichier ZIP
     */
    protected function processZipData($zipData)
    {
        if (!isset($zipData['csv_files']) || !is_array($zipData['csv_files'])) {
            return;
        }
        
        foreach ($zipData['csv_files'] as $csvData) {
            $this->processCsvFile($csvData, $zipData);
        }
    }
    
    /**
     * Traite un fichier CSV
     */
    protected function processCsvFile($csvData, $zipData)
    {
        $filename = $csvData['file_name'];
        $prefix = $csvData['prefix'] ?? explode('_', $filename)[0];
        
        // Ne traiter que les fichiers OTPLANIFVTDATE
        if ($prefix !== 'OTPLANIFVTDATE') {
            return;
        }
        
        if (!isset($csvData['sample_rows']) || !is_array($csvData['sample_rows'])) {
            Log::warning('Aucune ligne dans le CSV', ['filename' => $filename]);
            return;
        }
        
        // Récupérer les informations du fichier
        $fileInfo = $this->parseFileInfo($filename);
        
        foreach ($csvData['sample_rows'] as $rowData) {
            $this->importRow($rowData, $filename, $fileInfo, $csvData['source'] ?? $zipData['source'] ?? null);
        }
    }
    
    /**
     * Importe une ligne du CSV
     */
    protected function importRow($rowData, $sourceFile, $fileInfo, $source)
    {
        try {
            // Extraire RDS et BCA
            $rds = $rowData['admin_rds'] ?? $rowData['rds'] ?? null;
            $bca = $rowData['admin_bca'] ?? $rowData['bca'] ?? null;
            
            if (!$rds || !$bca) {
                $this->skippedCount++;
                $this->errors[] = "Ligne ignorée - RDS ou BCA manquant: " . json_encode($rowData);
                return;
            }
            
            // Vérifier si une version plus récente existe déjà
            $existingRecord = VisiteTechnique::where('admin_rds', $rds)
                ->where('admin_bca', $bca)
                ->where('source_prefix', 'OTPLANIFVTDATE')
                ->orderBy('file_timestamp', 'desc')
                ->first();
            
            $currentTimestamp = $fileInfo['timestamp'] ?? 0;
            
            // Si un enregistrement plus récent existe, on skip
            if ($existingRecord && $existingRecord->file_timestamp >= $currentTimestamp) {
                $this->skippedCount++;
                Log::info('Version plus récente existe déjà', [
                    'rds' => $rds,
                    'bca' => $bca,
                    'existing_timestamp' => $existingRecord->file_timestamp,
                    'new_timestamp' => $currentTimestamp
                ]);
                return;
            }
            
            // Désactiver l'ancienne version si elle existe
            if ($existingRecord) {
                $existingRecord->update(['is_current_version' => false]);
                $this->updatedCount++;
            }
            
            // Créer la nouvelle version
            $visite = new VisiteTechnique();
            
            // Identifiants
            $visite->admin_rds = $rds;
            $visite->admin_bca = $bca;
            $visite->admin_contract = $rowData['admin_contract'] ?? null;
            $visite->admin_prefix = $rowData['admin_prefix'] ?? 'OTPLANIFVTDATE';
            
            // Adresses site A
            $visite->address_site_a_name = $rowData['address_site_a_name'] ?? null;
            $visite->address_site_a_street = $rowData['address_site_a_street'] ?? null;
            $visite->address_site_a_postal = $rowData['address_site_a_postal'] ?? null;
            $visite->address_site_a_town = $rowData['address_site_a_town'] ?? null;
            $visite->address_site_a_x = $this->formatCoordinate($rowData['address_site_a_x'] ?? null);
            $visite->address_site_a_y = $this->formatCoordinate($rowData['address_site_a_y'] ?? null);
            
            // Caractéristiques techniques
            $visite->techno = $rowData['techno'] ?? null;
            $visite->bandwidth = $rowData['bandwith'] ?? null;
            $visite->network = $rowData['network'] ?? null;
            $visite->offer = $rowData['offer'] ?? null;
	        $visite->one_shot_info=$rowData['one_shot_info']?? null;
            
            // Références techniques
            $visite->nro_name = $rowData['nro_name'] ?? null;
            $visite->nro_port = $rowData['nro_port'] ?? null;
            $visite->bpe_piquage = $rowData['bpe_piquage'] ?? null;
            $visite->building_code = $rowData['building_code'] ?? null;
            $visite->equipement_number = $rowData['equipement_number'] ?? null;
            $visite->mer_number = $rowData['mer_number'] ?? null;
            
            // Références opérateur
            $visite->operator_name = $rowData['operator_name'] ?? null;
            $visite->operator_client_ref = $rowData['operator_client_ref'] ?? null;
            $visite->oi_reference = $rowData['oi_reference'] ?? null;
            $visite->rop_ref = $rowData['rop_ref'] ?? null;
            $visite->project_name = $rowData['project_name'] ?? null;
            
            // Dates
            $visite->order_date = $this->formatDate($rowData['order_date'] ?? null);
            $visite->begin_client_wait = $this->formatDate($rowData['begin_client_wait'] ?? null);
            $visite->client_wait_end = $this->formatDate($rowData['client_wait_end'] ?? null);
            
            // Contacts
            $visite->contact_on_site_firstname = $rowData['contact_on_site_firstname'] ?? null;
            $visite->contact_on_site_lastname = $rowData['contact_on_site_lastname'] ?? null;
            $visite->contact_on_site_phone = $rowData['contact_on_site_phone'] ?? null;
            $visite->contact_on_site_mail = $rowData['contact_on_site_mail'] ?? null;
            $visite->covage_contact_name = $rowData['covage_contact_name'] ?? null;
            
            // Directives
            $visite->client_directive_access = $rowData['client_directive_access'] ?? null;
            $visite->client_directive_intervention = $rowData['client_directive_intervention'] ?? null;
            $visite->client_directive_planning = $rowData['client_directive_planning'] ?? null;
            
            // Informations administratives
            $visite->insee_code = $rowData['insee_code'] ?? null;
            $visite->article_designation = $rowData['article_designation'] ?? null;
            
            // Commentaires
            $visite->comment = $rowData['comment'] ?? null;
            $visite->fail_reason = $rowData['fail_reason'] ?? null;
            
            // Statut (par défaut planifiée pour OTPLANIFVTDATE)
            $visite->status = $this->determineStatus($rowData);
            
            // Métadonnées d'import
            $visite->source_file = $sourceFile;
            $visite->source_prefix = 'OTPLANIFVTDATE';
            $visite->imported_at = now();
            $visite->file_date = $fileInfo['date'] ?? null;
            $visite->file_time = $fileInfo['time'] ?? null;
            $visite->file_timestamp = $fileInfo['timestamp'] ?? time();
            $visite->is_current_version = true;
            
            $visite->save();
            
            $this->importedCount++;
            
            Log::info('Visite technique importée', [
                'rds' => $rds,
                'bca' => $bca,
                'project' => $visite->project_name,
                'operator' => $visite->operator_name
            ]);
            
        } catch (\Exception $e) {
            $this->errors[] = "Erreur import ligne: " . $e->getMessage();
            Log::error('Erreur import ligne OTPLANIFVTDATE', [
                'error' => $e->getMessage(),
                'data' => $rowData
            ]);
            throw $e; // Re-throw pour le rollback
        }
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
    
    /**
     * Détermine le statut en fonction des données
     */
    protected function determineStatus($rowData)
    {
        // Si une raison d'échec est présente
        if (!empty($rowData['fail_reason'])) {
            return VisiteTechnique::STATUS_FAILED;
        }
        
        // Si en attente client
        if (!empty($rowData['client_wait_end']) || !empty($rowData['begin_client_wait'])) {
            $waitEnd = $this->formatDate($rowData['client_wait_end'] ?? null);
            if ($waitEnd && $waitEnd > now()) {
                return VisiteTechnique::STATUS_POSTPONED;
            }
        }
        
        // Par défaut, planifiée
        return VisiteTechnique::STATUS_PLANNED;
    }
    
    /**
     * Formate les coordonnées
     */
    protected function formatCoordinate($value)
    {
        if (empty($value)) return null;
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
     * Réinitialise les compteurs
     */
    protected function resetCounters()
    {
        $this->importedCount = 0;
        $this->updatedCount = 0;
        $this->skippedCount = 0;
        $this->errors = [];
    }
}
