<?php
// app/Http/Controllers/CommandeController.php
namespace App\Http\Controllers;

use App\Models\Commande;
use App\Models\FichierImporte;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CommandeController extends Controller
{
    /**
     * Liste des commandes avec leurs informations
     */
    public function index(Request $request)
    {
        $query = Commande::with([
            'visiteTechnique',
            'commentaires',
            'raccordement',
            'retourCrVt',
            'fichiersImportes'
        ]);
        
        // Filtres
        if ($request->has('statut')) {
            $query->where('statut', $request->statut);
        }
        
        if ($request->has('date_debut')) {
            $query->whereDate('order_date', '>=', $request->date_debut);
        }
        
        if ($request->has('date_fin')) {
            $query->whereDate('order_date', '<=', $request->date_fin);
        }
        
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('admin_rds', 'like', "%{$search}%")
                  ->orWhere('admin_bca', 'like', "%{$search}%")
                  ->orWhere('operator_client_ref', 'like', "%{$search}%")
                  ->orWhere('oi_reference', 'like', "%{$search}%")
                  ->orWhere('address_site_a_town', 'like', "%{$search}%");
            });
        }
        
        $commandes = $query->orderBy('created_at', 'desc')->paginate(20);
        
        return response()->json($commandes);
    }
    
    /**
     * Détails d'une commande
     */
    public function show($id)
    {
        $commande = Commande::with([
            'visiteTechnique',
            'commentaires' => function($q) {
                $q->orderBy('created_at', 'desc');
            },
            'raccordement',
            'retourCrVt',
            'fichiersImportes'
        ])->findOrFail($id);
        
        return response()->json([
            'commande' => $commande,
            'infos_completes' => [
                'visite_technique' => $commande->visiteTechnique,
                'commentaires' => $commande->commentaires,
                'raccordement' => $commande->raccordement,
                'retour_cr_vt' => $commande->retourCrVt,
                'fichiers' => $commande->fichiersImportes
            ]
        ]);
    }
    
    /**
     * Statistiques des commandes
     */
    public function statistiques()
    {
        $stats = [
            'total' => Commande::count(),
            'completes' => Commande::where('statut', 'complete')->count(),
            'en_cours' => Commande::where('statut', 'en_cours')->count(),
            'par_techno' => Commande::groupBy('techno')->select('techno', DB::raw('count(*) as total'))->get(),
            'par_region' => Commande::groupBy('address_site_a_town')->select('address_site_a_town', DB::raw('count(*) as total'))->get(),
            'dernieres_commandes' => Commande::orderBy('created_at', 'desc')->limit(5)->get()
        ];
        
        return response()->json($stats);
    }
}
