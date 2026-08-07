<?php

namespace App\Services;

use App\Models\OTPOSECPECVG;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;


class OTPOSECPECVGImportService
{
    protected $importedCount = 0;
    protected $updatedCount = 0;
    protected $skippedCount = 0;
    protected $errors = [];


    /**
     * Import toutes les données OTPOSECPECVG depuis getCsvData()
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



            $this->resetCounters();



            foreach ($response['data'] as $zipData) {

                $this->processZipData($zipData);

            }




            DB::commit();



            Log::info('Import OTPOSECPECVG terminé', [

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



            Log::error('Erreur import OTPOSECPECVG', [

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




    protected function processZipData($zipData)
    {

        if (!isset($zipData['csv_files']) || !is_array($zipData['csv_files'])) {

            return;

        }



        foreach ($zipData['csv_files'] as $csvData) {


            $this->processCsvFile($csvData, $zipData);


        }


    }





    protected function processCsvFile($csvData, $zipData)
    {


        $filename = $csvData['file_name'];


        $prefix = $csvData['prefix'] 
            ?? explode('_', $filename)[0];



        // Import uniquement OTPOSECPECVG

        if ($prefix !== 'OTPOSECPECVG') {

            return;

        }




        if (!isset($csvData['sample_rows']) 
            || !is_array($csvData['sample_rows'])) {


            Log::warning(
                'Aucune ligne dans le CSV OTPOSECPECVG',
                [
                    'filename' => $filename
                ]
            );


            return;

        }




        $fileInfo = $this->parseFileInfo($filename);




        foreach ($csvData['sample_rows'] as $rowData) {


            $this->importRow(

                $rowData,

                $filename,

                $fileInfo,

                $csvData['source'] 
                    ?? $zipData['source'] 
                    ?? null

            );


        }


    }
protected function importRow($rowData, $sourceFile, $fileInfo, $source)
{
    try {

        // Champs obligatoires
        $rds = $rowData['admin_rds'] ?? $rowData['rds'] ?? null;
        $bca = $rowData['admin_bca'] ?? $rowData['bca'] ?? null;


        if (!$rds || !$bca) {

            $this->skippedCount++;

            $this->errors[] =
                "Ligne ignorée - RDS ou BCA manquant : "
                . json_encode($rowData);

            return;

        }



        $currentTimestamp = $fileInfo['timestamp'] ?? 0;



        /*
        |--------------------------------------------------------------------------
        | Gestion du versionnement
        |--------------------------------------------------------------------------
        */

        $existingRecord = OTPOSECPECVG::where('admin_rds', $rds)
            ->where('admin_bca', $bca)
            ->where('source_prefix', 'OTPOSECPECVG')
            ->orderBy('file_timestamp', 'desc')
            ->first();



        if ($existingRecord &&
            $existingRecord->file_timestamp >= $currentTimestamp
        ) {

            $this->skippedCount++;


            Log::info(
                'Version plus récente existe déjà OTPOSECPECVG',
                [
                    'rds' => $rds,
                    'bca' => $bca
                ]
            );


            return;

        }




        if ($existingRecord) {

            $existingRecord->update([
                'is_current_version' => false
            ]);


            $this->updatedCount++;

        }




        /*
        |--------------------------------------------------------------------------
        | Création OTPOSECPECVG
        |--------------------------------------------------------------------------
        */


        $ot = new OTPOSECPECVG();



        /*
        | Administratif
        */

        $ot->admin_rds = $rds;
        $ot->admin_bca = $bca;

        $ot->admin_contract =
            $rowData['admin_contract'] ?? null;

        $ot->admin_prefix =
            $rowData['admin_prefix'] ?? 'OTPOSECPECVG';



        /*
        | Site A
        */

        $ot->address_site_a_name =
            $rowData['address_site_a_name'] ?? null;

        $ot->address_site_a_postal =
            $rowData['address_site_a_postal'] ?? null;

        $ot->address_site_a_street =
            $rowData['address_site_a_street'] ?? null;

        $ot->address_site_a_town =
            $rowData['address_site_a_town'] ?? null;

        $ot->address_site_a_x =
            $rowData['address_site_a_x'] ?? null;

        $ot->address_site_a_y =
            $rowData['address_site_a_y'] ?? null;



        /*
        | Technique
        */

        $ot->bandwith =
            $rowData['bandwith'] ?? null;

        $ot->bpe_piquage =
            $rowData['bpe_piquage'] ?? null;

        $ot->building_code =
            $rowData['building_code'] ?? null;

        $ot->techno =
            $rowData['techno'] ?? null;

        $ot->network =
            $rowData['network'] ?? null;



        /*
        | Instructions client
        */

        $ot->client_directive_access =
            $rowData['client_directive_access'] ?? null;


        $ot->client_directive_intervention =
            $rowData['client_directive_intervention'] ?? null;


        $ot->client_directive_planning =
            $rowData['client_directive_planning'] ?? null;


        $ot->comment =
            $rowData['comment'] ?? null;




        /*
        | Contact site A
        */

        $ot->contact_on_site_firstname =
            $rowData['contact_on_site_firstname'] ?? null;


        $ot->contact_on_site_lastname =
            $rowData['contact_on_site_lastname'] ?? null;


        $ot->contact_on_site_mail =
            $rowData['contact_on_site_mail'] ?? null;


        $ot->contact_on_site_phone =
            $rowData['contact_on_site_phone'] ?? null;




        /*
        | Opérateur
        */

        $ot->covage_contact_name =
            $rowData['covage_contact_name'] ?? null;


        $ot->offer =
            $rowData['offer'] ?? null;


        $ot->oi_reference =
            $rowData['oi_reference'] ?? null;


        $ot->operator_client_ref =
            $rowData['operator_client_ref'] ?? null;


        $ot->operator_name =
            $rowData['operator_name'] ?? null;




        /*
        | Projet
        */

        $ot->project_name =
            $rowData['project_name'] ?? null;


        $ot->rop_ref =
            $rowData['rop_ref'] ?? null;


        $ot->article_designation =
            $rowData['article_designation'] ?? null;




        /*
        | NRO / ODF
        */

        $ot->nro_name =
            $rowData['nro_name'] ?? null;


        $ot->nro_port =
            $rowData['nro_port'] ?? null;


        $ot->odf_pop =
            $rowData['odf_pop'] ?? null;


        $ot->odf_client =
            $rowData['odf_client'] ?? null;




        /*
        | Site B
        */

        $ot->address_site_b_name =
            $rowData['address_site_b_name'] ?? null;


        $ot->address_site_b_postal =
            $rowData['address_site_b_postal'] ?? null;


        $ot->address_site_b_street =
            $rowData['address_site_b_street'] ?? null;


        $ot->address_site_b_town =
            $rowData['address_site_b_town'] ?? null;


        $ot->address_site_b_x =
            $rowData['address_site_b_x'] ?? null;


        $ot->address_site_b_y =
            $rowData['address_site_b_y'] ?? null;



        $ot->insee_code =
            $rowData['insee_code'] ?? null;


        $ot->insee_code_site_b =
            $rowData['insee_code_site_b'] ?? null;




        /*
        | Contact site B
        */

        $ot->contact_on_site_b_firstname =
            $rowData['contact_on_site_b_firstname'] ?? null;


        $ot->contact_on_site_b_lastname =
            $rowData['contact_on_site_b_lastname'] ?? null;


        $ot->contact_on_site_b_mail =
            $rowData['contact_on_site_b_mail'] ?? null;


        $ot->contact_on_site_b_phone =
            $rowData['contact_on_site_b_phone'] ?? null;




        /*
        | Dates
        */

        $ot->order_date =
            $this->formatDateTime(
                $rowData['order_date'] ?? null
            );


        $ot->begin_client_wait =
            $this->formatDateTime(
                $rowData['begin_client_wait'] ?? null
            );


        $ot->client_wait_end =
            $this->formatDateTime(
                $rowData['client_wait_end'] ?? null
            );


        $ot->cancellation_date =
            $this->formatDateTime(
                $rowData['cancellation_date'] ?? null
            );



        /*
        | Autres
        */

        $ot->fail_reason =
            $rowData['fail_reason'] ?? null;


        $ot->mer_number =
            $rowData['mer_number'] ?? null;


        $ot->equipement_number =
            $rowData['equipement_number'] ?? null;


        $ot->one_shot_info =
            $rowData['one_shot_info'] ?? null;


        $ot->bpe_piquage_2 =
            $rowData['bpe_piquage_2'] ?? null;


        $ot->number_fibers_fon =
            $rowData['number_fibers_fon'] ?? null;




        /*
        | Métadonnées import
        */

        $ot->source_file = $sourceFile;
        $ot->source_prefix = 'OTPOSECPECVG';

        $ot->imported_at = now();

        $ot->file_date =
            $fileInfo['date'] ?? null;

        $ot->file_time =
            $fileInfo['time'] ?? null;

        $ot->file_timestamp =
            $currentTimestamp;


        $ot->is_current_version = true;



        $ot->save();



        $this->importedCount++;



        Log::info('OTPOSECPECVG importé', [
            'rds' => $rds,
            'bca' => $bca,
            'id' => $ot->id
        ]);



    } catch (\Exception $e) {


        $this->errors[] =
            "Erreur import OTPOSECPECVG : "
            . $e->getMessage();



        Log::error('Erreur import ligne OTPOSECPECVG', [

            'error' => $e->getMessage(),

            'data' => $rowData

        ]);


        throw $e;

    }
}
    /**
     * Extraction des informations du nom du fichier
     *
     * Exemple :
     * OTPOSECPECVG_xxx_xxx_20260807_1530.csv
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



            $info['datetime'] =
                "$year-$month-$day";


            $info['timestamp'] =
                strtotime(
                    "$year-$month-$day"
                );



            if ($info['time'] && strlen($info['time']) == 4) {


                $hour = substr($info['time'], 0, 2);

                $minute = substr($info['time'], 2, 2);



                $info['datetime'] =
                    "$year-$month-$day $hour:$minute:00";



                $info['timestamp'] =
                    strtotime(
                        "$year-$month-$day $hour:$minute:00"
                    );

            }

        }



        return $info;

    }




    /**
     * Conversion des dates provenant du CSV
     */
    protected function formatDateTime($value)
    {

        if (empty($value)) {

            return null;

        }



        try {


            return Carbon::parse($value)
                ->format('Y-m-d H:i:s');


        } catch (\Exception $e) {


            Log::warning(
                'Date invalide OTPOSECPECVG',
                [
                    'value' => $value
                ]
            );


            return null;

        }

    }




    /**
     * Réinitialisation des compteurs
     */
    protected function resetCounters()
    {

        $this->importedCount = 0;

        $this->updatedCount = 0;

        $this->skippedCount = 0;

        $this->errors = [];

    }


}
