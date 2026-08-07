<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\OTPOSECPECVGImportService;
use Illuminate\Support\Facades\Log;

class ImportOTPOSECPECVG extends Command
{
    /**
     * Nom et signature de la commande
     */
    protected $signature = 'import:otposecpecvg';

    /**
     * Description
     */
    protected $description = 'Importer les fichiers CSV OTPOSECPECVG depuis le SFTP';


    /**
     * Exécution de la commande
     */
    public function handle(OTPOSECPECVGImportService $service)
    {

        $this->info('Début import OTPOSECPECVG...');


        try {

            $result = $service->importFromCsvData();


            if ($result['success']) {


                $this->info('Import OTPOSECPECVG terminé avec succès');


                $this->table(
                    [
                        'Statut',
                        'Importés',
                        'Mis à jour',
                        'Ignorés',
                        'Erreurs'
                    ],
                    [
                        [
                            'OK',
                            $result['imported'],
                            $result['updated'],
                            $result['skipped'],
                            count($result['errors'])
                        ]
                    ]
                );


                Log::info('Commande import:otposecpecvg exécutée', $result);


            } else {


                $this->error(
                    'Erreur pendant l\'import OTPOSECPECVG : '
                    .$result['error']
                );


                Log::error(
                    'Commande import:otposecpecvg échouée',
                    $result
                );


                return Command::FAILURE;

            }



        } catch (\Exception $e) {


            $this->error(
                'Exception : '.$e->getMessage()
            );


            Log::error(
                'Erreur commande import:otposecpecvg',
                [
                    'error'=>$e->getMessage(),
                    'trace'=>$e->getTraceAsString()
                ]
            );


            return Command::FAILURE;

        }


        return Command::SUCCESS;

    }
}
