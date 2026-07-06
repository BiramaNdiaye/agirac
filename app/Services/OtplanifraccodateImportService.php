<?php

namespace App\Services;

use App\Models\Raccordement;
use App\Traits\ImportNotifierTrait; // ✅ Import du trait
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use App\Models\Notification;

class OtplanifraccodateImportService
{
    use ImportNotifierTrait; // ✅ Déclaration correcte du trait

    protected $importedCount = 0;
    protected $updatedCount = 0;
    protected $skippedCount = 0;
    protected $errors = [];

    /**
     * Importe toutes les données OTPLANIFRACCODATE
     */
    public function importFromCsvData()
    {
        DB::beginTransaction();

        try {
            $this->resetCounters();
            $this->resetProcessedFiles(); // ✅ Réinitialiser la liste des fichiers

            $controller = app(\App\Http\Controllers\SftpUploadController::class);
            $response = $controller->getCsvData()->getData(true);

            if (!isset($response['data']) || empty($response['data'])) {
                throw new \Exception('Aucune donnée CSV trouvée');
            }

            foreach ($response['data'] as $zipData) {
                $this->processZipData($zipData);
            }

            DB::commit();

            // 🔔 Envoyer la notification après le commit réussi
            $this->sendNotificationIfNeeded('OTPLANIFRACCODATE');

            Log::info('Import OTPLANIFRACCODATE terminé', [
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
            Log::error('Erreur import OTPLANIFRACCODATE', [
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

        // ✅ Ajouter le nom du fichier à la liste pour la notification
        if (isset($zipData['zip_name'])) {
            $this->addProcessedFile($zipData['zip_name']);
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

        if ($prefix !== 'OTPLANIFRACCODATE') {
            return;
        }

        if (!isset($csvData['sample_rows']) || !is_array($csvData['sample_rows'])) {
            Log::warning('Aucune ligne dans le CSV', ['filename' => $filename]);
            return;
        }

        foreach ($csvData['sample_rows'] as $rowData) {
            $this->importRow($rowData, $filename, $csvData['source'] ?? $zipData['source'] ?? null);
        }
    }

    /**
     * Importe une ligne du CSV
     */
    protected function importRow($rowData, $sourceFile, $source)
    {
        try {
            $rds = $rowData['admin_rds'] ?? $rowData['rds'] ?? null;
            $bca = $rowData['admin_bca'] ?? $rowData['bca'] ?? null;

            if (!$rds || !$bca) {
                $this->skippedCount++;
                $this->errors[] = "Ligne ignorée - RDS ou BCA manquant";
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

            // Adresses site A
            $raccordement->address_site_a_name = $rowData['address_site_a_name'] ?? null;
            $raccordement->address_site_a_street = $rowData['address_site_a_street'] ?? null;
            $raccordement->address_site_a_postal = $rowData['address_site_a_postal'] ?? null;
            $raccordement->address_site_a_town = $rowData['address_site_a_town'] ?? null;
            $raccordement->address_site_a_x = $this->formatCoordinate($rowData['address_site_a_x'] ?? null);
            $raccordement->address_site_a_y = $this->formatCoordinate($rowData['address_site_a_y'] ?? null);

            // Informations techniques
            $raccordement->techno = $rowData['techno'] ?? null;
            $raccordement->bandwith = $rowData['bandwith'] ?? null;
            $raccordement->network = $rowData['network'] ?? null;
            $raccordement->offer = $rowData['offer'] ?? null;
            $raccordement->one_shot_info = $rowData['one_shot_info'] ?? false;

            // Références techniques
            $raccordement->nro_name = $rowData['nro_name'] ?? null;
            $raccordement->nro_port = $rowData['nro_port'] ?? null;
            $raccordement->bpe_piquage = $rowData['bpe_piquage'] ?? null;
            $raccordement->building_code = $rowData['building_code'] ?? null;
            $raccordement->equipement_number = $rowData['equipement_number'] ?? null;
            $raccordement->mer_number = $rowData['mer_number'] ?? null;

            // Références opérateur
            $raccordement->operator_name = $rowData['operator_name'] ?? null;
            $raccordement->operator_client_ref = $rowData['operator_client_ref'] ?? null;
            $raccordement->oi_reference = $rowData['oi_reference'] ?? null;
            $raccordement->rop_ref = $rowData['rop_ref'] ?? null;
            $raccordement->project_name = $rowData['project_name'] ?? null;

            // Dates
            $raccordement->order_date = $this->formatDate($rowData['order_date'] ?? null);
            $raccordement->begin_client_wait = $this->formatDate($rowData['begin_client_wait'] ?? null);
            $raccordement->client_wait_end = $this->formatDate($rowData['client_wait_end'] ?? null);

            // Contacts
            $raccordement->contact_on_site_firstname = $rowData['contact_on_site_firstname'] ?? null;
            $raccordement->contact_on_site_lastname = $rowData['contact_on_site_lastname'] ?? null;
            $raccordement->contact_on_site_phone = $rowData['contact_on_site_phone'] ?? null;
            $raccordement->contact_on_site_mail = $rowData['contact_on_site_mail'] ?? null;
            $raccordement->covage_contact_name = $rowData['covage_contact_name'] ?? null;

            // Directives
            $raccordement->client_directive_access = $rowData['client_directive_access'] ?? null;
            $raccordement->client_directive_intervention = $rowData['client_directive_intervention'] ?? null;
            $raccordement->client_directive_planning = $rowData['client_directive_planning'] ?? null;

            // Informations administratives
            $raccordement->insee_code = $rowData['insee_code'] ?? null;
            $raccordement->article_designation = $rowData['article_designation'] ?? null;

            // Commentaires
            $raccordement->comment = $rowData['comment'] ?? null;
            $raccordement->fail_reason = $rowData['fail_reason'] ?? null;

            // Statut
            $raccordement->status = $this->determineStatus($rowData);

            // Métadonnées
            $raccordement->source_file = $sourceFile;
            $raccordement->source_prefix = 'OTPLANIFRACCODATE';
            $raccordement->imported_at = now();

            $raccordement->save();

            if (!$existingRecord) {
                Notification::create([
                    'type' => 'raccordement',
                    'title' => 'Nouvelle demande de raccordement',
                    'message' => "Nouveau raccordement : {$rds} - {$bca}",
                    'reference' => "{$rds}_{$bca}",
                    'link' => route('raccordements.show', $raccordement->id),
                ]);
            }

            Log::info('Raccordement importé', [
                'rds' => $rds,
                'bca' => $bca,
                'action' => $existingRecord ? 'updated' : 'created',
                'project' => $raccordement->project_name
            ]);

        } catch (\Exception $e) {
            $this->errors[] = "Erreur import: " . $e->getMessage();
            Log::error('Erreur import OTPLANIFRACCODATE', [
                'error' => $e->getMessage(),
                'data' => $rowData
            ]);
            throw $e;
        }
    }

    /**
     * Détermine le statut en fonction des données
     */
    protected function determineStatus($rowData)
    {
        if (!empty($rowData['fail_reason'])) {
            return 'failed';
        }
        if (!empty($rowData['client_wait_end']) || !empty($rowData['begin_client_wait'])) {
            return 'waiting';
        }
        return 'planned';
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
