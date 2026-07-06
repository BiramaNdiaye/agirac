<?php

namespace App\Http\Controllers;

use App\Models\VisiteTechnique;
use App\Models\Raccordement;
use App\Models\VisiteTechniqueAction;
use App\Models\RaccordementAction;
use App\Models\Commentaire;
use App\Models\AttenteClient;
use Inertia\Inertia;

class SuiviController extends Controller
{
    /**
     * Affiche le suivi complet d'une commande identifiée par son RDS.
     *
     * @param string $rds
     * @return \Inertia\Response
     */
    public function show($rds)
    {
        // 1. Récupérer toutes les entités liées à ce RDS
        $visites = VisiteTechnique::where('admin_rds', $rds)->get();
        $raccordements = Raccordement::where('admin_rds', $rds)->get();

        // 2. Actions des visites techniques
        $actionsVT = VisiteTechniqueAction::whereIn('visite_technique_id', $visites->pluck('id'))
            ->with('visiteTechnique')
            ->get()
            ->map(function ($action) {
                return [
                    'id'            => $action->id,
                    'type'          => 'vt',
                    'action_type'   => $action->action_type,
                    'label'         => $action->label,
                    'icon'          => $action->icon,
                    'color'         => $action->color,
                    'date'          => $action->created_at?->format('Y-m-d H:i:s'),
                    'file_date'     => $action->file_date?->format('d/m/Y'),
                    'planning_date' => $action->planning_date?->format('d/m/Y'),
                    'fail_reason'   => $action->impossibility_fail_reason,
                    'comment'       => $action->planning_comment ?? $action->impossibility_comment ?? $action->demande_comment,
                    'bca'           => $action->visiteTechnique?->admin_bca,
                    'project_name'  => $action->visiteTechnique?->project_name,
                    'operator_name' => $action->visiteTechnique?->operator_name,
                ];
            });

        // 3. Actions des raccordements
        $actionsRaccordement = RaccordementAction::whereIn('raccordement_id', $raccordements->pluck('id'))
            ->with('raccordement')
            ->get()
            ->map(function ($action) {
                return [
                    'id'            => $action->id,
                    'type'          => 'raccordement',
                    'action_type'   => $action->action_type,
                    'label'         => $action->label,
                    'icon'          => $action->icon,
                    'color'         => $action->color,
                    'date'          => $action->created_at?->format('Y-m-d H:i:s'),
                    'file_date'     => $action->file_date?->format('d/m/Y'),
                    'planning_date' => $action->planning_date?->format('d/m/Y'),
                    'fail_reason'   => $action->impossibility_fail_reason,
                    'comment'       => $action->planning_comment ?? $action->impossibility_comment ?? $action->cr_comment,
                    'bca'           => $action->raccordement?->admin_bca,
                    'project_name'  => $action->raccordement?->project_name,
                    'operator_name' => $action->raccordement?->operator_name,
                ];
            });

        // 4. Commentaires (tous types confondus)
        $commentaires = Commentaire::where('rds', $rds)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($comment) {
                return [
                    'id'            => $comment->id,
                    'type'          => 'commentaire',
                    'action_type'   => 'commentaire',
                    'label'         => 'Commentaire',
                    'icon'          => '💬',
                    'color'         => 'gray',
                    'date'          => $comment->created_at?->format('Y-m-d H:i:s'),
                    'file_date'     => $comment->file_date?->format('d/m/Y'),
                    'auteur'        => $comment->auteur,
                    'contenu'       => $comment->contenu,
                    'est_reponse'   => $comment->est_reponse,
                    'reponse_a_id'  => $comment->reponse_a_id,
                    'bca'           => $comment->bca,
                ];
            });

        // 5. Périodes d’attente client
        $attentes = AttenteClient::where('admin_rds', $rds)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($attente) {
                return [
                    'id'                => $attente->id,
                    'type'              => 'attente',
                    'action_type'       => 'attente_client',
                    'label'             => 'Attente client',
                    'icon'              => '⏳',
                    'color'             => 'yellow',
                    'date'              => $attente->created_at?->format('Y-m-d H:i:s'),
                    'begin_client_wait' => $attente->begin_client_wait?->format('d/m/Y'),
                    'client_wait_end'   => $attente->client_wait_end?->format('d/m/Y'),
                    'comment'           => $attente->comment,
                    'bca'               => $attente->admin_bca,
                ];
            });

        // 6. Fusion et tri chronologique décroissant
        $allEvents = $actionsVT
            ->concat($actionsRaccordement)
            ->concat($commentaires)
            ->concat($attentes)
            ->sortByDesc('date')
            ->values();

        $firstEvent = $allEvents->last();
        $lastEvent  = $allEvents->first();

        // 7. Informations de synthèse
        $info = [
    'rds'                   => $rds,
    'bcas'                  => $visites->pluck('admin_bca')
                                ->merge($raccordements->pluck('admin_bca'))
                                ->unique()
                                ->values(),
    'contrats'              => $visites->pluck('admin_contract')
                                ->merge($raccordements->pluck('admin_contract'))
                                ->unique()
                                ->values(),
    'projets'               => $visites->pluck('project_name')
                                ->merge($raccordements->pluck('project_name'))
                                ->unique()
                                ->values(),
    'operateurs'            => $visites->pluck('operator_name')
                                ->merge($raccordements->pluck('operator_name'))
                                ->unique()
                                ->values(),
    'date_premiere_demande' => $firstEvent ? $firstEvent['date'] : null,
    'date_derniere_action'  => $lastEvent ? $lastEvent['date'] : null,
];

        // 8. Rendu Inertia avec Vue React
        return Inertia::render('Suivi/Index', [
            'rds'    => $rds,
            'info'   => $info,
            'events' => $allEvents,
        ]);
    }
}
