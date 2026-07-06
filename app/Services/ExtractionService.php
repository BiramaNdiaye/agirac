<?php
// app/Services/ExtractionService.php
namespace App\Services;

use App\Models\Commande;
use App\Models\FichierImporte;
use Illuminate\Support\Facades\Storage;
use ZipArchive;

class ExtractionService
{
    /**
     * Extraire les données du fichier zip
     */
    public function extraireDonnees($cheminFichier, $nomFichier, $type)
    {
        // Extraire les informations du nom de fichier
        $infosFichier = $this->extraireInfosNomFichier($nomFichier);
        
        // Lire le contenu du zip
        $contenu = $this->lireFichierZip($cheminFichier);
        
        // Extraire les données structurées selon le type
        $donneesExtraites = $this->extraireDonneesStructurees($contenu, $type);
        
        return [
            'prefixe' => $infosFichier['prefixe'],
            'reference' => $infosFichier['reference'],
            'date_fichier' => $infosFichier['date'],
            'contenu_brut' => $contenu,
            'donnees_extraites' => $donneesExtraites
        ];
    }
    
    /**
     * Extraire les informations du nom de fichier
     * Format: PREFIXE_RDS_REFBCA_AAAAMMJJ_HHMM
     */
    private function extraireInfosNomFichier($nomFichier)
    {
        $parts = explode('_', pathinfo($nomFichier, PATHINFO_FILENAME));
        
        return [
            'prefixe' => $parts[0] ?? null,
            'type' => $parts[1] ?? null,
            'reference' => $parts[2] ?? null,
            'date' => isset($parts[3]) ? \DateTime::createFromFormat('Ymd', $parts[3]) : null,
            'heure' => $parts[4] ?? null
        ];
    }
    
    /**
     * Lire le contenu d'un fichier zip
     */
    private function lireFichierZip($chemin)
    {
        $zip = new ZipArchive();
        $contenu = [];
        
        if ($zip->open($chemin) === true) {
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $filename = $zip->getNameIndex($i);
                $contenu[$filename] = $zip->getFromIndex($i);
            }
            $zip->close();
        }
        
        return $contenu;
    }
    
    /**
     * Extraire les données structurées
     */
    private function extraireDonneesStructurees($contenu, $type)
    {
        $donnees = [];
        
        foreach ($contenu as $fichier => $content) {
            // Déterminer le format (CSV, XML, JSON, etc.)
            $extension = pathinfo($fichier, PATHINFO_EXTENSION);
            
            switch (strtolower($extension)) {
                case 'csv':
                    $donnees[$fichier] = $this->parserCsv($content);
                    break;
                case 'json':
                    $donnees[$fichier] = json_decode($content, true);
                    break;
                case 'xml':
                    $donnees[$fichier] = $this->parserXml($content);
                    break;
                default:
                    $donnees[$fichier] = $content;
            }
        }
        
        return $donnees;
    }
    
    /**
     * Parser un fichier CSV
     */
    private function parserCsv($contenu)
    {
        $lines = explode("\n", $contenu);
        $headers = str_getcsv(array_shift($lines));
        $data = [];
        
        foreach ($lines as $line) {
            if (empty(trim($line))) continue;
            $row = str_getcsv($line);
            $data[] = array_combine($headers, $row);
        }
        
        return $data;
    }
    
    /**
     * Parser un fichier XML
     */
    private function parserXml($contenu)
    {
        $xml = simplexml_load_string($contenu);
        return json_decode(json_encode($xml), true);
    }
}
