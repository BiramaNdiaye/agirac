<?php
// app/Services/SynchronisationService.php
namespace App\Services;

use App\Models\Commande;
use App\Models\FichierImporte;
use App\Models\VisiteTechnique;
use App\Models\Commentaire;
use App\Models\Raccordement;
use App\Models\RetourCrVt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SynchronisationService
{
    protected $extractionService;
    
    public function __construct(ExtractionService $extractionService)
    {
        $this->extractionService = $extractionService;
    }
    
    /**
     * Traiter un fichier importé
     */
    public function traiterFichier($cheminFichier, $nomFichier, $type)
    {
        DB::beginTransaction();
        
        try {
            // 1. Extraire les données
            $donnees = $this->extractionService->extraireDonnees($cheminFichier, $nomFichier, $type);
            
            // 2. Trouver ou créer la commande
            $commande = $this->trouverOuCreerCommande($donnees['reference'], $type, $donnees['donnees_extraites']);
            
            // 3. Créer l'enregistrement du fichier
            $fichierImporte = FichierImporte::create([
                'nom_fichier' => $nomFichier,
                'prefixe' => $donnees['prefixe'],
                'type_fichier' => $type,
                'reference' => $donnees['reference'],
                'chemin_stockage' => $cheminFichier,
                'contenu_brut' => $donnees['contenu_brut'],
                'donnees_extraites' => $donnees['donnees_extraites'],
                'date_fichier' => $donnees['date_fichier'],
                'commande_id' => $commande->id,
                'statut_traitement' => 'completed'
            ]);
            
            // 4. Traiter selon le préfixe
            $this->traiterSelonPrefixe($commande, $fichierImporte, $donnees['prefixe'], $donnees['donnees_extraites']);
            
            // 5. Mettre à jour le statut de la commande
            $this->mettreAJourStatutCommande($commande);
            
            DB::commit();
            
            return $commande;
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Erreur traitement fichier {$nomFichier}: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Trouver ou créer une commande
     */
    private function trouverOuCreerCommande($reference, $type, $donnees)
    {
        $commande = Commande::where(function($query) use ($reference, $type) {
            if ($type === 'RDS') {
                $query->where('admin_rds', $reference);
            } else {
                $query->where('admin_bca', $reference);
            }
        })->first();
        
        if (!$commande) {
            // Créer une nouvelle commande avec les données disponibles
            $commande = Commande::create([
                'admin_rds' => $type === 'RDS' ? $reference : null,
                'admin_bca' => $type === 'REFBCA' ? $reference : null,
                'operator_client_ref' => $this->extraireValeur($donnees, 'operator_client_ref'),
                'oi_reference' => $this->extraireValeur($donnees, 'oi_reference'),
                'address_site_a_name' => $this->extraireValeur($donnees, 'address_site_a_name'),
                'address_site_a_street' => $this->extraireValeur($donnees, 'address_site_a_street'),
                'address_site_a_town' => $this->extraireValeur($donnees, 'address_site_a_town'),
                'address_site_a_postal' => $this->extraireValeur($donnees, 'address_site_a_postal'),
                'insee_code' => $this->extraireValeur($donnees, 'insee_code'),
                'techno' => $this->extraireValeur($donnees, 'techno'),
                'network' => $this->extraireValeur($donnees, 'network'),
                'operator_name' => $this->extraireValeur($donnees, 'operator_name'),
                'order_date' => $this->extraireValeur($donnees, 'order_date'),
            ]);
        } else {
            // Mettre à jour la commande avec les nouvelles données
            $this->mettreAJourCommande($commande, $type, $reference, $donnees);
        }
        
        return $commande;
    }
    
    /**
     * Traiter selon le préfixe du fichier
     */
    private function traiterSelonPrefixe($commande, $fichierImporte, $prefixe, $donnees)
    {
        switch ($prefixe) {
            case 'OTPLANIFVTDATE':
                $this->traiterVisiteTechnique($commande, $fichierImporte, $donnees);
                break;
                
            case 'COMMENT':
                $this->traiterCommentaire($commande, $fichierImporte, $donnees);
                break;
                
            case 'OTPLANIFRACCODATE':
                $this->traiterRaccordement($commande, $fichierImporte, $donnees);
                break;
                
            case 'CRVTCLIKO':
                $this->traiterRetourCrVt($commande, $fichierImporte, $donnees);
                break;
        }
    }
    
    /**
     * Traiter les données de visite technique
     */
    private function traiterVisiteTechnique($commande, $fichierImporte, $donnees)
    {
        VisiteTechnique::updateOrCreate(
            ['commande_id' => $commande->id],
            [
                'fichier_importe_id' => $fichierImporte->id,
                'date_visite' => $this->extraireValeur($donnees, 'date_visite'),
                'technicien_nom' => $this->extraireValeur($donnees, 'technicien_nom'),
                'statut_visite' => $this->extraireValeur($donnees, 'statut_visite'),
                'commentaire_visite' => $this->extraireValeur($donnees, 'commentaire'),
                'acces_site' => $this->extraireValeur($donnees, 'acces_site', false),
                'travaux_possibles' => $this->extraireValeur($donnees, 'travaux_possibles', false),
                'observations' => $this->extraireValeur($donnees, 'observations'),
            ]
        );
    }
    
    /**
     * Traiter les commentaires
     */
    private function traiterCommentaire($commande, $fichierImporte, $donnees)
    {
        Commentaire::create([
            'commande_id' => $commande->id,
            'fichier_importe_id' => $fichierImporte->id,
            'contenu' => $this->extraireValeur($donnees, 'commentaire') ?? json_encode($donnees),
            'type_commentaire' => 'general',
            'date_commentaire' => now()
        ]);
    }
    
    /**
     * Traiter les données de raccordement
     */
    private function traiterRaccordement($commande, $fichierImporte, $donnees)
    {
        Raccordement::updateOrCreate(
            ['commande_id' => $commande->id],
            [
                'fichier_importe_id' => $fichierImporte->id,
                'date_raccordement' => $this->extraireValeur($donnees, 'date_raccordement'),
                'type_raccordement' => $this->extraireValeur($donnees, 'type_raccordement'),
                'statut_raccordement' => $this->extraireValeur($donnees, 'statut'),
                'pm_zde' => $this->extraireValeur($donnees, 'pm_zde'),
                'longueur_cable' => $this->extraireValeur($donnees, 'longueur_cable'),
                'test_continuité' => $this->extraireValeur($donnees, 'test_continuite', false),
            ]
        );
    }
    
    /**
     * Traiter le retour CR VT
     */
    private function traiterRetourCrVt($commande, $fichierImporte, $donnees)
    {
        RetourCrVt::updateOrCreate(
            ['commande_id' => $commande->id],
            [
                'fichier_importe_id' => $fichierImporte->id,
                'date_retour' => $this->extraireValeur($donnees, 'date_retour'),
                'reference_cr' => $this->extraireValeur($donnees, 'reference_cr'),
                'statut_cr' => $this->extraireValeur($donnees, 'statut'),
                'conclusion' => $this->extraireValeur($donnees, 'conclusion'),
                'valide_technique' => $this->extraireValeur($donnees, 'valide_technique', false),
                'valide_administratif' => $this->extraireValeur($donnees, 'valide_administratif', false),
            ]
        );
    }
    
    /**
     * Extraire une valeur des données
     */
    private function extraireValeur($donnees, $cle, $defaut = null)
    {
        // Recherche récursive dans le tableau
        foreach ($donnees as $fichier => $contenu) {
            if (is_array($contenu)) {
                if (isset($contenu[0][$cle])) {
                    return $contenu[0][$cle];
                }
                if (isset($contenu[$cle])) {
                    return $contenu[$cle];
                }
            }
        }
        
        return $defaut;
    }
    
    /**
     * Mettre à jour le statut de la commande
     */
    private function mettreAJourStatutCommande($commande)
    {
        $hasVisite = VisiteTechnique::where('commande_id', $commande->id)->exists();
        $hasRaccordement = Raccordement::where('commande_id', $commande->id)->exists();
        $hasRetour = RetourCrVt::where('commande_id', $commande->id)->exists();
        
        if ($hasVisite && $hasRaccordement && $hasRetour) {
            $commande->update(['statut' => 'complete']);
        } elseif ($hasVisite || $hasRaccordement) {
            $commande->update(['statut' => 'en_cours']);
        }
    }
    
    /**
     * Mettre à jour une commande existante
     */
    private function mettreAJourCommande($commande, $type, $reference, $donnees)
    {
        $updateData = [];
        
        if ($type === 'RDS') {
            $updateData['admin_rds'] = $reference;
        } else {
            $updateData['admin_bca'] = $reference;
        }
        
        // Mettre à jour les champs non remplis
        $champs = [
            'operator_client_ref', 'oi_reference', 'address_site_a_name',
            'address_site_a_street', 'address_site_a_town', 'address_site_a_postal',
            'insee_code', 'techno', 'network', 'operator_name'
        ];
        
        foreach ($champs as $champ) {
            if (empty($commande->$champ)) {
                $valeur = $this->extraireValeur($donnees, $champ);
                if ($valeur) {
                    $updateData[$champ] = $valeur;
                }
            }
        }
        
        if (!empty($updateData)) {
            $commande->update($updateData);
        }
    }
}
