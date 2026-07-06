<?php

namespace App\Services;
use App\Models\RaccordementAction;
use App\Models\VisiteTechnique;
use App\Models\VisiteTechniqueAction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
use App\Models\AttenteClient;

class ImportInFilesService
{
    protected $stats = [
        'processed' => 0,
        'imported' => 0,
        'skipped' => 0,
        'errors' => []
    ];
    
    // Mapping des préfixes /IN vers les types d'actions
    protected $actionMapping = [
        'PLANIFVTDATE' => VisiteTechniqueAction::ACTION_PLANIFICATION,
        'PLANIFDATEVTKO' => VisiteTechniqueAction::ACTION_IMPOSSIBILITE,
        'CRVTCLI' => VisiteTechniqueAction::ACTION_LIVRAISON_CRVT,
        

      
    ];
    
    /**
     * Importe tous les fichiers du dossier /IN
     */
    public function importFromInDirectory()
    {
        DB::beginTransaction();
        
        try {
            $this->stats = ['processed' => 0, 'imported' => 0, 'skipped' => 0, 'errors' => []];
            
            // Récupérer les données via getCsvData() qui lit le dossier /IN
            $controller = app(\App\Http\Controllers\SftpUploadController::class);
            $response = $controller->getCsvData()->getData(true);
            
            if (!isset($response['data']) || empty($response['data'])) {
                Log::info('Aucun fichier trouvé dans /IN');
                return $this->getResult();
            }
            
            foreach ($response['data'] as $zipData) {
                $this->processZipData($zipData);
            }
            
            DB::commit();
            
            Log::info('Import /IN terminé', $this->stats);
            
            return $this->getResult();
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur import /IN', ['error' => $e->getMessage()]);
            $this->stats['errors'][] = $e->getMessage();
            
            return $this->getResult();
        }
    }
    
    /**
     * Traite un fichier ZIP
     */
    protected function processZipData($zipData)
    {
        if (!isset($zipData['csv_files'])) return;
        
        // Vérifier si c'est un fichier /IN (sortant)
        $isInFile = isset($zipData['source']) && str_contains($zipData['source'], 'IN');
        
        foreach ($zipData['csv_files'] as $csvData) {
            $this->processCsvFile($csvData, $isInFile);
        }
    }
    
    /**
     * Traite un fichier CSV
     */
    protected function processCsvFile($csvData, $isInFile)
    {
        $filename = $csvData['file_name'];
        $prefix = $csvData['prefix'] ?? explode('_', $filename)[0];
        
        // Ne traiter que les fichiers /IN
        if (!$isInFile) {
            return;
        }
        
        $actionType = $this->actionMapping[$prefix] ?? null;
        
        if (!$actionType) {
            Log::info('Prefix non géré pour /IN', ['prefix' => $prefix, 'file' => $filename]);
            return;
        }
        
        $this->stats['processed']++;
        
        // Récupérer les informations du fichier
        $fileInfo = $this->parseFileInfo($filename);
        
        foreach ($csvData['sample_rows'] as $rowData) {
            $this->importRow($rowData, $filename, $prefix, $actionType, $fileInfo);
        }
    }
    
    /**
     * Importe une ligne du CSV
     */
protected function importRow($rowData, $sourceFile, $prefix, $actionType, $fileInfo, $force = false, $source = 'IN')
{
    try {
        $rds = $rowData['admin_rds'] ?? $rowData['rds'] ?? null;
        $bca = $rowData['admin_bca'] ?? $rowData['bca'] ?? null;

        if (!$rds || !$bca) {
            $this->stats['skipped']++;
            return;
        }
        // ✅ À partir d'ici : JAMAIS un EDITPLANIFDATE
        $visite = VisiteTechnique::where('admin_rds', $rds)
            ->where('admin_bca', $bca)
            ->first();

        if (!$visite) {
            $visite                                = new VisiteTechnique();
            $visite->admin_rds                     = $rds;
            $visite->admin_bca                     = $bca;
            $visite->admin_contract                = $rowData['admin_contract'] ?? null;
            $visite->admin_prefix                  = $rowData['admin_prefix']   ?? null;
            $visite->project_name                  = $rowData['project_name']   ?? null;
            $visite->operator_name                 = $rowData['operator_name']  ?? null;
            $visite->techno                        = $rowData['techno']         ?? null;
            $visite->address_site_a_name           = $rowData['address_site_a_name']   ?? null;
            $visite->address_site_a_street         = $rowData['address_site_a_street'] ?? null;
            $visite->address_site_a_postal         = $rowData['address_site_a_postal'] ?? null;
            $visite->address_site_a_town           = $rowData['address_site_a_town']   ?? null;
            $visite->address_site_a_x              = $this->formatCoordinate($rowData['address_site_a_x'] ?? null);
            $visite->address_site_a_y              = $this->formatCoordinate($rowData['address_site_a_y'] ?? null);
            $visite->contact_on_site_firstname     = $rowData['contact_on_site_firstname'] ?? null;
            $visite->contact_on_site_lastname      = $rowData['contact_on_site_lastname']  ?? null;
            $visite->contact_on_site_phone         = $rowData['contact_on_site_phone']     ?? null;
            $visite->contact_on_site_mail          = $rowData['contact_on_site_mail']      ?? null;
            $visite->covage_contact_name           = $rowData['covage_contact_name']       ?? null;
            $visite->client_directive_access       = $rowData['client_directive_access']       ?? null;
            $visite->client_directive_intervention = $rowData['client_directive_intervention'] ?? null;
            $visite->client_directive_planning     = $rowData['client_directive_planning']     ?? null;
            $visite->order_date                    = $this->formatDate($rowData['order_date'] ?? null);
            $visite->save();

            Log::info('Visite technique créée depuis /IN', [
                'rds'    => $rds,
                'bca'    => $bca,
                'source' => $sourceFile
            ]);
        }

        if ($prefix === 'PLANIFVTDATE' && $actionType === VisiteTechniqueAction::ACTION_PLANIFICATION) {
            AttenteClient::where('admin_rds', $rds)
                ->where('admin_bca', $bca)
                ->where('replanned', false)
                ->update(['replanned' => true]);
        }

        $existingAction = VisiteTechniqueAction::where('visite_technique_id', $visite->id)
            ->where('action_type', $actionType)
            ->where('source_file', $sourceFile)
            ->first();

        if ($existingAction) {
            $this->stats['skipped']++;
            return;
        }

        $action                      = new VisiteTechniqueAction();
        $action->visite_technique_id = $visite->id;
        $action->action_type         = $actionType;
        $action->prefix              = $prefix;
        $action->source_file         = $sourceFile;
        $action->source              = $source;
        $action->file_date           = $fileInfo['date']      ?? null;
        $action->file_time           = $fileInfo['time']      ?? null;
        $action->file_timestamp      = $fileInfo['timestamp'] ?? time();

        $this->fillActionFields($action, $rowData, $actionType);

        $action->bandwidth           = $rowData['bandwith']            ?? null;
        $action->nro_name            = $rowData['nro_name']            ?? null;
        $action->nro_port            = $rowData['nro_port']            ?? null;
        $action->bpe_piquage         = $rowData['bpe_piquage']         ?? null;
        $action->building_code       = $rowData['building_code']       ?? null;
        $action->equipement_number   = $rowData['equipement_number']   ?? null;
        $action->mer_number          = $rowData['mer_number']          ?? null;
        $action->insee_code          = $rowData['insee_code']          ?? null;
        $action->article_designation = $rowData['article_designation'] ?? null;
        $action->raw_data            = $rowData;
        $action->imported_at         = now();
        $action->save();

        $this->stats['imported']++;

        Log::info('Action /IN importée', [
            'visite' => "$rds - $bca",
            'action' => $actionType,
            'file'   => $sourceFile
        ]);

    } catch (\Exception $e) {
        $this->stats['errors'][] = $e->getMessage();
        Log::error('Erreur import ligne /IN', [
            'error' => $e->getMessage(),
            'data'  => $rowData
        ]);
    }
}

/**
 * Remplit les champs spécifiques selon le type d'action.
 * ACTION_MODIFICATION_DATE est exclu : géré exclusivement par handleEditPlanifDate.
 */
protected function fillActionFields($action, $rowData, $actionType)
{
    switch ($actionType) {
        case VisiteTechniqueAction::ACTION_PLANIFICATION:
            $action->planning_date    = $this->formatDate($rowData['planning_date'] ?? null);
            $action->planning_comment = $rowData['comment'] ?? null;
            break;

        case VisiteTechniqueAction::ACTION_IMPOSSIBILITE:
            $action->impossibility_fail_reason = $rowData['fail_reason'] ?? null;
            $action->impossibility_comment     = $rowData['comment']     ?? null;
            break;

        case VisiteTechniqueAction::ACTION_LIVRAISON_CRVT:
            $action->crvt_effective_date = $this->formatDate(
                $rowData['effective_date'] ?? $rowData['intervention_date'] ?? null
            );
            $action->crvt_comment             = $rowData['comment'] ?? null;
            $action->crvt_infra_to_be_created = filter_var(
                $rowData['infra_to_be_created'] ?? $rowData['infra_a_creer'] ?? false,
                FILTER_VALIDATE_BOOLEAN
            );
            $action->crvt_result_status   = $rowData['result_status'] ?? $rowData['resultat']          ?? null;
            $action->crvt_submission_date = $this->formatDate(
                $rowData['submission_date'] ?? $rowData['date_soumission'] ?? null
            );
            $action->crvt_doc = $rowData['doc'] ?? null;
            break;

      
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
    
    protected function getResult()
    {
        return [
            'success' => empty($this->stats['errors']),
            'stats' => $this->stats
        ];
    }
}
