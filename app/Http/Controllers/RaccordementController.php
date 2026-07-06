<?php

namespace App\Http\Controllers;

use App\Models\Raccordement;
use App\Models\RaccordementAction;
use App\Models\Commentaire;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Carbon\Carbon;
use App\Models\AttenteClient;

class RaccordementController extends Controller
{
    /**
     * Affiche les détails d'un raccordement avec toutes ses informations
     */
    public function show($id)
    {
        // Récupérer le raccordement avec ses actions
        $raccordement = Raccordement::with(['actions' => function($query) {
            $query->orderBy('file_timestamp', 'desc');
        }])->findOrFail($id);
        
        // Récupérer les commentaires associés
        $commentaires = Commentaire::where('rds', $raccordement->admin_rds)
            ->where('bca', $raccordement->admin_bca)
            ->where('commande_type', Commentaire::COMMANDE_RACCORDEMENT)
            ->orderBy('file_timestamp', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();
        
        $attente = AttenteClient::where('admin_rds', $raccordement->admin_rds)
    ->where('admin_bca', $raccordement->admin_bca)
    ->orderBy('created_at', 'desc')
    ->first();
        // Transformer les commentaires avec formatage sécurisé
        $commentairesArray = $commentaires->map(function($commentaire) {
            return [
                'id' => $commentaire->id,
                'uuid' => $commentaire->uuid,
                'contenu' => $commentaire->contenu,
                'auteur' => $commentaire->auteur,
                'type_commentaire' => $commentaire->type_commentaire,
                'type_label' => $commentaire->type_label,
                'source' => $commentaire->source,
                'source_label' => $commentaire->source_label,
                'est_reponse' => $commentaire->est_reponse,
                'reponse_a_id' => $commentaire->reponse_a_id,
                'fichiers_joints' => $commentaire->fichiers_joints,
                'file_date' => $this->safeFormatDate($commentaire->file_date),
                'file_time' => $this->safeFormatTime($commentaire->file_time),
                'created_at' => $this->safeFormatDateTime($commentaire->created_at),
                'lu' => $commentaire->lu,
            ];
        })->toArray();
        
        // Séparer les commentaires
        $commentairesPrincipaux = array_filter($commentairesArray, function($c) {
            return !$c['est_reponse'];
        });
        
        $reponses = array_filter($commentairesArray, function($c) {
            return $c['est_reponse'];
        });
        
        foreach ($commentairesPrincipaux as &$commentaire) {
            $commentaire['reponses'] = array_values(array_filter($reponses, function($r) use ($commentaire) {
                return $r['reponse_a_id'] == $commentaire['id'];
            }));
        }
        
        // Statistiques commentaires
        $commentairesStats = [
            'total' => $commentaires->count(),
            'non_lus' => $commentaires->where('lu', false)->count(),
            'de_covage' => $commentaires->where('source', 'OUT')->count(),
            'de_notre_app' => $commentaires->where('source', 'IN')->count(),
        ];
        
        // Transformer les actions avec formatage sécurisé
        $actionsArray = $raccordement->actions->map(function($action) {
            return [
                'id' => $action->id,
                'action_type' => $action->action_type,
                'label' => $action->label,
                'icon' => $action->icon,
                'color' => $action->color,
                'file_date' => $this->safeFormatDate($action->file_date),
                'file_time' => $this->safeFormatTime($action->file_time),
                'source_file' => $action->source_file,
                'source' => $action->source,
                'created_at' => $this->safeFormatDateTime($action->created_at),
                
                // Planification
                'planning_date' => $this->safeFormatDate($action->planning_date),
                'planning_comment' => $action->planning_comment,
                
                // Impossibilité
                'impossibility_fail_reason' => $action->impossibility_fail_reason,
                'impossibility_comment' => $action->impossibility_comment,
                
                // CR Client
                'cr_effective_date' => $this->safeFormatDate($action->cr_effective_date),
                'cr_comment' => $action->cr_comment,
                'cr_result_status' => $action->cr_result_status,
                'cr_infra_to_be_created' => $action->cr_infra_to_be_created,
                'cr_submission_date' => $this->safeFormatDate($action->cr_submission_date),
                'cr_doc_path' => $action->cr_doc_path,
                
                // DOE
                'doe_delivery_date' => $this->safeFormatDate($action->doe_delivery_date),
                'doe_comment' => $action->doe_comment,
                'doe_gc_length' => $action->doe_gc_length,
                'doe_ml_length_extension' => $action->doe_ml_length_extension,
                'doe_ml_length_private' => $action->doe_ml_length_private,
                'doe_ml_length_public' => $action->doe_ml_length_public,
                
                // DFT
                'dft_delivery_date' => $this->safeFormatDate($action->dft_delivery_date),
                'dft_comment' => $action->dft_comment,
            ];
        })->toArray();
        
        // Transformer les données du raccordement avec formatage sécurisé
        $raccordementData = [
            'id' => $raccordement->id,
            'uuid' => $raccordement->uuid,
            'admin_rds' => $raccordement->admin_rds,
            'admin_bca' => $raccordement->admin_bca,
            'admin_contract' => $raccordement->admin_contract,
            'admin_prefix' => $raccordement->admin_prefix,
            'project_name' => $raccordement->project_name,
            'operator_name' => $raccordement->operator_name,
            'techno' => $raccordement->techno,
            'bandwith' => $raccordement->bandwith,
            'network' => $raccordement->network,
            'offer' => $raccordement->offer,
            'order_date' => $this->safeFormatDate($raccordement->order_date),
            'begin_client_wait' => $this->safeFormatDate($raccordement->begin_client_wait),
            'client_wait_end' => $this->safeFormatDate($raccordement->client_wait_end),
            
            // Adresse
            'address_site_a_name' => $raccordement->address_site_a_name,
            'address_site_a_street' => $raccordement->address_site_a_street,
            'address_site_a_postal' => $raccordement->address_site_a_postal,
            'address_site_a_town' => $raccordement->address_site_a_town,
            'address_site_a_x' => $raccordement->address_site_a_x,
            'address_site_a_y' => $raccordement->address_site_a_y,
            'full_address' => $raccordement->full_address,
            
            // Contacts
            'contact_on_site_firstname' => $raccordement->contact_on_site_firstname,
            'contact_on_site_lastname' => $raccordement->contact_on_site_lastname,
            'contact_on_site_phone' => $raccordement->contact_on_site_phone,
            'contact_on_site_mail' => $raccordement->contact_on_site_mail,
            'contact_full_name' => $raccordement->contact_full_name,
            'covage_contact_name' => $raccordement->covage_contact_name,
            
            // Directives
            'client_directive_access' => $raccordement->client_directive_access,
            'client_directive_intervention' => $raccordement->client_directive_intervention,
            'client_directive_planning' => $raccordement->client_directive_planning,
            
            // Références techniques
            'nro_name' => $raccordement->nro_name,
            'nro_port' => $raccordement->nro_port,
            'bpe_piquage' => $raccordement->bpe_piquage,
            'building_code' => $raccordement->building_code,
            'equipement_number' => $raccordement->equipement_number,
            'mer_number' => $raccordement->mer_number,
            'insee_code' => $raccordement->insee_code,
            'article_designation' => $raccordement->article_designation,
            
            // Commentaires
            'comment' => $raccordement->comment,
            'fail_reason' => $raccordement->fail_reason,
            
            'created_at' => $this->safeFormatDateTime($raccordement->created_at),
            'updated_at' => $this->safeFormatDateTime($raccordement->updated_at),
        ];
        
        // Statistiques actions
        $actionsStats = [
            'total' => $raccordement->actions->count(),
            'planification' => $raccordement->actions->where('action_type', 'planification')->count(),
            'impossibilite' => $raccordement->actions->where('action_type', 'impossibilite')->count(),
            'livraison_cr' => $raccordement->actions->where('action_type', 'livraison_cr')->count(),
            'livraison_doe' => $raccordement->actions->where('action_type', 'livraison_doe')->count(),
            'livraison_dft' => $raccordement->actions->where('action_type', 'livraison_dft')->count(),
            'modification_date' => $raccordement->actions->where('action_type', 'modification_date')->count(),
        ];
        
        // Statut actuel
        $currentStatus = $this->getCurrentStatus($raccordement);
        
        return Inertia::render('ShowRacco', [
            'raccordement' => $raccordementData,
            'actions' => $actionsArray,
            'actionsStats' => $actionsStats,
            'currentStatus' => $currentStatus,
            'commentaires' => $commentairesPrincipaux,
            'commentairesStats' => $commentairesStats,
            'attente' => $attente,
        ]);
    }
    
    /**
     * Formate une date de façon sécurisée (évite l'erreur sur string)
     */
    protected function safeFormatDate($date, $format = 'd/m/Y')
    {
        if (empty($date)) {
            return null;
        }
        
        // Si c'est déjà un objet Carbon
        if ($date instanceof Carbon) {
            return $date->format($format);
        }
        
        // Si c'est une chaîne
        if (is_string($date)) {
            try {
                return Carbon::parse($date)->format($format);
            } catch (\Exception $e) {
                return $date;
            }
        }
        
        return null;
    }
    
    /**
     * Formate une date/heure de façon sécurisée
     */
    protected function safeFormatDateTime($datetime, $format = 'd/m/Y H:i')
    {
        if (empty($datetime)) {
            return null;
        }
        
        if ($datetime instanceof Carbon) {
            return $datetime->format($format);
        }
        
        if (is_string($datetime)) {
            try {
                return Carbon::parse($datetime)->format($format);
            } catch (\Exception $e) {
                return $datetime;
            }
        }
        
        return null;
    }
    
    /**
     * Formate une heure de façon sécurisée
     */
    protected function safeFormatTime($time, $format = 'H:i')
    {
        if (empty($time)) {
            return null;
        }
        
        if ($time instanceof Carbon) {
            return $time->format($format);
        }
        
        if (is_string($time)) {
            try {
                return Carbon::parse($time)->format($format);
            } catch (\Exception $e) {
                return $time;
            }
        }
        
        return null;
    }
    
    /**
     * Affiche la liste des raccordements
     */
public function index(Request $request)
{
    $filter = $request->get('filter', 'all');
    $search = $request->get('search', '');

    $query = Raccordement::withCount('actions')
        ->with(['lastAction', 'annulation']); // ajout de la relation 'annulation'

    // Filtres existants
    switch ($filter) {
        case 'planned':
            $query->whereHas('lastAction', fn($q) => $q->where('action_type', 'planification'));
            break;
        case 'delivered_cr':
            $query->whereHas('lastAction', fn($q) => $q->where('action_type', 'livraison_cr'));
            break;
        case 'delivered_doe':
            $query->whereHas('lastAction', fn($q) => $q->where('action_type', 'livraison_doe'));
            break;
        case 'delivered_dft':
            $query->whereHas('lastAction', fn($q) => $q->where('action_type', 'livraison_dft'));
            break;
        case 'impossible':
            $query->whereHas('lastAction', fn($q) => $q->where('action_type', 'impossibilite'));
            break;
    }

    if (!empty($search)) {
        $query->where(function ($q) use ($search) {
            $q->where('admin_rds', 'LIKE', "%{$search}%")
              ->orWhere('admin_bca', 'LIKE', "%{$search}%")
              ->orWhere('admin_contract', 'LIKE', "%{$search}%");
        });
    }

    $raccordements = $query->orderBy('created_at', 'desc')->get();

    // Compteurs
    $counts = [
        'all' => Raccordement::count(),
        'planned' => Raccordement::whereHas('lastAction', fn($q) => $q->where('action_type', 'planification'))->count(),
        'delivered_cr' => Raccordement::whereHas('lastAction', fn($q) => $q->where('action_type', 'livraison_cr'))->count(),
        'delivered_doe' => Raccordement::whereHas('lastAction', fn($q) => $q->where('action_type', 'livraison_doe'))->count(),
        'delivered_dft' => Raccordement::whereHas('lastAction', fn($q) => $q->where('action_type', 'livraison_dft'))->count(),
        'impossible' => Raccordement::whereHas('lastAction', fn($q) => $q->where('action_type', 'impossibilite'))->count(),
    ];

    $raccordementsArray = $raccordements->map(function($raccordement) {
        return [
            'id' => $raccordement->id,
            'admin_rds' => $raccordement->admin_rds,
            'admin_bca' => $raccordement->admin_bca,
            'project_name' => $raccordement->project_name,
            'operator_name' => $raccordement->operator_name,
            'admin_contract' => $raccordement->admin_contract,
            'address_site_a_name' => $raccordement->address_site_a_name,
            'address_site_a_town' => $raccordement->address_site_a_town,
            'order_date' => $raccordement->order_date?->format('d/m/Y'),
            'actions_count' => $raccordement->actions_count,
            'last_action_type' => $raccordement->lastAction?->action_type,
            'last_action_date' => $raccordement->lastAction?->file_date?->format('d/m/Y'),
            // Ajout pour l'annulation
            'is_annule' => $raccordement->annulation ? true : false,
            'annulation_date' => $raccordement->annulation?->cancellation_date?->format('d/m/Y'),
        ];
    });

    return Inertia::render('Racco', [
        'raccordements' => $raccordementsArray,
        'counts' => $counts,
        'currentFilter' => $filter,
        'search' => $search,
    ]);
}
    
    /**
     * Planifier un raccordement (PLANIFRACCODATE)
     */
    public function planifier(Request $request, $id)
    {
        $request->validate([
            'planning_date' => 'required|date',
            'comment' => 'nullable|string|max:500',
        ]);
        
        $raccordement = Raccordement::findOrFail($id);
        
         $action = new RaccordementAction();
    $action->raccordement_id = $raccordement->id;
    $action->action_type = RaccordementAction::ACTION_PLANIFICATION;
    $action->prefix = 'PLANIFRACCODATE';
    $action->planning_date = $request->planning_date;
    $action->planning_comment = $request->comment;
    $action->source = 'MANUAL';
    $action->file_timestamp = time();
    $action->imported_at = now();
    $action->save();

     AttenteClient::where('admin_rds', $raccordement->admin_rds)
        ->where('admin_bca', $raccordement->admin_bca)
        ->where('replanned', false)
        ->update(['replanned' => true]);

        
        return redirect()->back()->with('success', 'Raccordement planifié avec succès');
    }
    
    /**
     * Enregistrer une impossibilité de raccordement (PLANIFRACCODATEKO)
     */
    public function impossible(Request $request, $id)
    {
        $request->validate([
            'fail_reason' => 'required|string|max:255',
            'comment' => 'nullable|string|max:500',
        ]);
        
        $raccordement = Raccordement::findOrFail($id);
        
        // Logique de création de l'action et envoi SFTP
        // ...
        
        return redirect()->back()->with('success', 'Impossibilité enregistrée avec succès');
    }
    
    /**
     * Livrer un CR Client (CRIDOCCLI)
     */
    public function livrerCr(Request $request, $id)
    {
        $request->validate([
            'effective_date' => 'required|date',
            'result_status' => 'required|in:OK,KO,PARTIAL',
            'comment' => 'nullable|string|max:500',
            'infra_to_be_created' => 'boolean',
            'submission_date' => 'nullable|date',
        ]);
        
        $raccordement = Raccordement::findOrFail($id);
        
        // Logique de création de l'action et envoi SFTP
        // ...
        
        return redirect()->back()->with('success', 'CR Client livré avec succès');
    }
    
    /**
     * Livrer un DOE (DOEDOC)
     */
    public function livrerDoe(Request $request, $id)
    {
        $request->validate([
            'delivery_date' => 'required|date',
            'comment' => 'nullable|string|max:500',
            'gc_length' => 'nullable|numeric',
            'ml_length_extension' => 'nullable|numeric',
            'ml_length_private' => 'nullable|numeric',
            'ml_length_public' => 'nullable|numeric',
        ]);
        
        $raccordement = Raccordement::findOrFail($id);
        
        // Logique de création de l'action et envoi SFTP
        // ...
        
        return redirect()->back()->with('success', 'DOE livré avec succès');
    }
    
    /**
     * Livrer un DFT (DFTDOC)
     */
    public function livrerDft(Request $request, $id)
    {
        $request->validate([
            'delivery_date' => 'required|date',
            'comment' => 'nullable|string|max:500',
        ]);
        
        $raccordement = Raccordement::findOrFail($id);
        
        // Logique de création de l'action et envoi SFTP
        // ...
        
        return redirect()->back()->with('success', 'DFT livré avec succès');
    }
    
    /**
     * Ajouter un commentaire à un raccordement
     */
    public function ajouterCommentaire(Request $request, $id)
    {
        $request->validate([
            'contenu' => 'required|string|min:3|max:1000',
            'reponse_a_id' => 'nullable|exists:commentaires,id',
        ]);
        
        $raccordement = Raccordement::findOrFail($id);
        
        $commentaire = new Commentaire();
        $commentaire->type_document = 'COMMENT';
        $commentaire->prefix = 'COMMENT';
        $commentaire->source = 'MANUAL';
        $commentaire->source_file = 'manual_' . now()->format('Ymd_His') . '.csv';
        $commentaire->rds = $raccordement->admin_rds;
        $commentaire->bca = $raccordement->admin_bca;
        $commentaire->commande_type = Commentaire::COMMANDE_RACCORDEMENT;
        $commentaire->commande_id = $raccordement->id;
        $commentaire->auteur = auth()->user()->name ?? 'Application';
        $commentaire->contenu = $request->contenu;
        $commentaire->type_commentaire = $request->reponse_a_id ? Commentaire::TYPE_REPONSE_COMMENTAIRE : Commentaire::TYPE_QUESTION;
        $commentaire->est_reponse = !empty($request->reponse_a_id);
        $commentaire->reponse_a_id = $request->reponse_a_id;
        $commentaire->imported_at = now();
        $commentaire->save();
        
        return redirect()->back()->with('success', 'Commentaire ajouté avec succès');
    }
    
    /**
     * Marquer un commentaire comme lu
     */
    public function marquerCommentaireLu($id)
    {
        $commentaire = Commentaire::findOrFail($id);
        $commentaire->marquerCommeLu();
        
        return response()->json(['success' => true]);
    }
    
    /**
     * Détermine le statut actuel du raccordement
     */
    protected function getCurrentStatus($raccordement)
    {
        $lastAction = $raccordement->actions->sortByDesc('file_timestamp')->first();
        
        if (!$lastAction) {
            return [
                'code' => 'pending',
                'label' => 'En attente',
                'color' => 'gray',
                'icon' => '⏳'
            ];
        }
        
        $statusMap = [
            'planification' => ['code' => 'planned', 'label' => 'Planifié', 'color' => 'green', 'icon' => '📅'],
            'impossibilite' => ['code' => 'impossible', 'label' => 'Impossible', 'color' => 'red', 'icon' => '⚠️'],
            'livraison_cr' => ['code' => 'cr_delivered', 'label' => 'CR Livré', 'color' => 'blue', 'icon' => '📋'],
            'livraison_doe' => ['code' => 'doe_delivered', 'label' => 'DOE Livré', 'color' => 'purple', 'icon' => '📄'],
            'livraison_dft' => ['code' => 'dft_delivered', 'label' => 'DFT Livré', 'color' => 'orange', 'icon' => '🔧'],
            'modification_date' => ['code' => 'modification_date', 'label' => 'Planif Modifier', 'color' => 'green', 'icon' => '🔧'],
        ];
        
        return $statusMap[$lastAction->action_type] ?? [
            'code' => 'unknown',
            'label' => 'Inconnu',
            'color' => 'gray',
            'icon' => '❓'
        ];
    }
}
