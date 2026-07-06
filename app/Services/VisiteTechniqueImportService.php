<?php

namespace App\Services;

use App\Models\VisiteTechnique;
use App\Models\VisiteTechniqueAction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class VisiteTechniqueImportService
{
    protected $stats = [
        'created' => 0,
        'updated' => 0,
        'skipped' => 0,
        'errors' => []
    ];
    
    /**
     * Importe toutes les données VT depuis getCsvData()
     */
    public function importFromCsvData()
    {
        DB::beginTransaction();
        
        try {
            $controller = app(\App\Http\Controllers\SftpUploadController::class);
            $response = $controller->getCsvData()->getData(true);
            
            if (!isset($response['data']) || empty($response['data'])) {
                throw new \Exception('Aucune donnée CSV trouvée');
            }
            
            foreach ($response['data'] as $zipData) {
                $this->processZipData($zipData);
            }
            
            DB::commit();
            
            Log::info('Import VT terminé', $this->stats);
            
            return [
                'success' => true,
                'stats' => $this->stats
            ];
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur import VT', ['error' => $e->getMessage()]);
            
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'stats' => $this->stats
            ];
        }
    }
    
    protected function processZipData($zipData)
    {
        if (!isset($zipData['csv_files'])) return;
        
        foreach ($zipData['csv_files'] as $csvData) {
            $this->processCsvFile($csvData);
        }
    }
    
    protected function processCsvFile($csvData)
    {
        $filename = $csvData['file_name'];
        $prefix = $csvData['prefix'] ?? explode('_', $filename)[0];
        
        // Déterminer le type d'action
        $actionType = VisiteTechniqueAction::$prefixMapping[$prefix] ?? null;
        
        if (!$actionType) return;
        
        // Récupérer les informations du fichier
        $fileInfo = $this->parseFileInfo($filename);
        
        foreach ($csvData['sample_rows'] as $rowData) {
            $this->importRow($rowData, $filename, $prefix, $actionType, $fileInfo);
        }
    }
    
    protected function importRow($rowData, $sourceFile, $prefix, $actionType, $fileInfo)
    {
        try {
            // Extraire RDS et BCA
            $rds = $rowData['admin_rds'] ?? $rowData['rds'] ?? null;
            $bca = $rowData['admin_bca'] ?? $rowData['bca'] ?? null;
            
            if (!$rds || !$bca) {
                $this->stats['skipped']++;
                return;
            }
            
            // Créer ou récupérer la visite technique
            $visite = VisiteTechnique::firstOrCreate(
                ['admin_rds' => $rds, 'admin_bca' => $bca],
                $this->extractVisiteData($rowData)
            );
            
            // Vérifier si l'action existe déjà
            $exists = VisiteTechniqueAction::where('visite_technique_id', $visite->id)
                ->where('action_type', $actionType)
                ->where('source_file', $sourceFile)
                ->exists();
            
            if ($exists) {
                $this->stats['skipped']++;
                return;
            }
            
            // Créer l'action
            $action = new VisiteTechniqueAction();
            $action->visite_technique_id = $visite->id;
            $action->action_type = $actionType;
            $action->prefix = $prefix;
            $action->source_file = $sourceFile;
            $action->source = $rowData['source'] ?? null;
            $action->file_date = $fileInfo['date'] ?? null;
            $action->file_time = $fileInfo['time'] ?? null;
            $action->file_timestamp = $fileInfo['timestamp'] ?? time();
            
            // Remplir les champs selon le type d'action
            $this->fillActionFields($action, $rowData, $actionType);
            
            // Champs communs techniques
            $action->bandwidth = $rowData['bandwith'] ?? null;
            $action->nro_name = $rowData['nro_name'] ?? null;
            $action->nro_port = $rowData['nro_port'] ?? null;
            $action->bpe_piquage = $rowData['bpe_piquage'] ?? null;
            $action->building_code = $rowData['building_code'] ?? null;
            $action->equipement_number = $rowData['equipement_number'] ?? null;
            $action->mer_number = $rowData['mer_number'] ?? null;
            $action->insee_code = $rowData['insee_code'] ?? null;
            $action->article_designation = $rowData['article_designation'] ?? null;
            $action->raw_data = $rowData;
            $action->imported_at = now();
            
            $action->save();
            
            $this->stats['created']++;
            
            Log::info('Action VT importée', [
                'visite' => "$rds - $bca",
                'action' => $actionType,
                'file' => $sourceFile
            ]);
            
        } catch (\Exception $e) {
            $this->stats['errors'][] = $e->getMessage();
            Log::error('Erreur import ligne VT', [
                'error' => $e->getMessage(),
                'data' => $rowData
            ]);
        }
    }
    
    /**
     * Remplit les champs spécifiques selon le type d'action
     */
    protected function fillActionFields($action, $rowData, $actionType)
    {
        switch ($actionType) {
            case VisiteTechniqueAction::ACTION_DEMANDE:
                // OTPLANIFVTDATE - Demande VT
                $action->demande_comment = $rowData['comment'] ?? null;
                break;
                
            case VisiteTechniqueAction::ACTION_PLANIFICATION:
                // PLANIFVTDATE - Planifier VT
                $action->planning_date = $this->formatDate($rowData['planning_date'] ?? null);
                $action->planning_comment = $rowData['comment'] ?? null;
                break;
                
            case VisiteTechniqueAction::ACTION_IMPOSSIBILITE:
                // PLANIFDATEVTKO - Impossibilité VT
                $action->impossibility_fail_reason = $rowData['fail_reason'] ?? null;
                $action->impossibility_comment = $rowData['comment'] ?? null;
                break;
                
            case VisiteTechniqueAction::ACTION_LIVRAISON_CRVT:
                // CRVTCLI - Livrer CRVT
                $action->crvt_effective_date = $this->formatDate($rowData['effective_date'] ?? $rowData['intervention_date'] ?? null);
                $action->crvt_comment = $rowData['comment'] ?? null;
                $action->crvt_infra_to_be_created = filter_var(
                    $rowData['infra_to_be_created'] ?? $rowData['infra_a_creer'] ?? false,
                    FILTER_VALIDATE_BOOLEAN
                );
                $action->crvt_result_status = $rowData['result_status'] ?? $rowData['resultat'] ?? null;
                $action->crvt_submission_date = $this->formatDate($rowData['submission_date'] ?? $rowData['date_soumission'] ?? null);
                
                // Gestion des documents (peut être un JSON ou une chaîne)
                if (isset($rowData['doc'])) {
                    $doc = $rowData['doc'];
                    if (is_string($doc) && $this->isJson($doc)) {
                        $action->crvt_doc = $doc;
                    } elseif (is_array($doc)) {
                        $action->crvt_doc = json_encode($doc);
                    } else {
                        $action->crvt_doc = $doc;
                    }
                }
                break;
        }
    }
    
    /**
     * Extrait les données de la visite technique
     */
    protected function extractVisiteData($rowData)
    {
        return [
            'admin_contract' => $rowData['admin_contract'] ?? null,
            'project_name' => $rowData['project_name'] ?? null,
            'operator_name' => $rowData['operator_name'] ?? null,
            'techno' => $rowData['techno'] ?? null,
            'address_site_a_name' => $rowData['address_site_a_name'] ?? null,
            'address_site_a_street' => $rowData['address_site_a_street'] ?? null,
            'address_site_a_postal' => $rowData['address_site_a_postal'] ?? null,
            'address_site_a_town' => $rowData['address_site_a_town'] ?? null,
            'address_site_a_x' => $this->formatCoordinate($rowData['address_site_a_x'] ?? null),
            'address_site_a_y' => $this->formatCoordinate($rowData['address_site_a_y'] ?? null),
            'contact_on_site_firstname' => $rowData['contact_on_site_firstname'] ?? null,
            'contact_on_site_lastname' => $rowData['contact_on_site_lastname'] ?? null,
            'contact_on_site_phone' => $rowData['contact_on_site_phone'] ?? null,
            'contact_on_site_mail' => $rowData['contact_on_site_mail'] ?? null,
            'covage_contact_name' => $rowData['covage_contact_name'] ?? null,
            'client_directive_access' => $rowData['client_directive_access'] ?? null,
            'client_directive_intervention' => $rowData['client_directive_intervention'] ?? null,
            'client_directive_planning' => $rowData['client_directive_planning'] ?? null,
            'order_date' => $this->formatDate($rowData['order_date'] ?? null)
        ];
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
    
    protected function isJson($string)
    {
        json_decode($string);
        return json_last_error() === JSON_ERROR_NONE;
    }
}
