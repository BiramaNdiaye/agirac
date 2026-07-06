<?php

namespace App\Http\Controllers;

use App\Models\VisiteTechnique;
use App\Models\Raccordement;
use App\Models\VisiteTechniqueAction;
use App\Models\RaccordementAction;
use App\Models\Commentaire;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        // 1. Statistiques globales
        $stats = [
            'vt' => [
                'total' => VisiteTechnique::count(),
                'planned' => VisiteTechnique::whereHas('lastAction', fn($q) => $q->where('action_type', 'planification'))->count(),
                'completed' => VisiteTechnique::whereHas('lastAction', fn($q) => $q->where('action_type', 'livraison_crvt'))->count(),
                'impossible' => VisiteTechnique::whereHas('lastAction', fn($q) => $q->where('action_type', 'impossibilite'))->count(),
                'pending' => VisiteTechnique::doesntHave('actions')->count(),
            ],
            'raccordements' => [
                'total' => Raccordement::count(),
                'planned' => Raccordement::whereHas('lastAction', fn($q) => $q->where('action_type', 'planification'))->count(),
                'cr_delivered' => Raccordement::whereHas('lastAction', fn($q) => $q->where('action_type', 'livraison_cr'))->count(),
                'doe_delivered' => Raccordement::whereHas('lastAction', fn($q) => $q->where('action_type', 'livraison_doe'))->count(),
                'dft_delivered' => Raccordement::whereHas('lastAction', fn($q) => $q->where('action_type', 'livraison_dft'))->count(),
                'impossible' => Raccordement::whereHas('lastAction', fn($q) => $q->where('action_type', 'impossibilite'))->count(),
                'pending' => Raccordement::doesntHave('actions')->count(),
            ],
            'commentaires' => [
                'total' => Commentaire::count(),
                'non_lus' => Commentaire::whereNull('lu_at')->count(),
                'aujourdhui' => Commentaire::whereDate('imported_at', today())->count(),
            ],
        ];

        // 2. Évolution des commandes (30 derniers jours)
        $evolution = [
            'vt' => VisiteTechnique::selectRaw('DATE(imported_at) as date, count(*) as total')
                ->where('imported_at', '>=', Carbon::now()->subDays(30))
                ->groupBy('date')
                ->orderBy('date')
                ->get()
                ->toArray(),
            'raccordements' => Raccordement::selectRaw('DATE(imported_at) as date, count(*) as total')
                ->where('imported_at', '>=', Carbon::now()->subDays(30))
                ->groupBy('date')
                ->orderBy('date')
                ->get()
                ->toArray(),
        ];

        // 3. Activité récente (actions des 7 derniers jours)
        $recentActivity = collect()
            ->concat(
                VisiteTechniqueAction::with('visiteTechnique')
                    ->where('imported_at', '>=', Carbon::now()->subDays(7))
                    ->orderBy('imported_at', 'desc')
                    ->take(10)
                    ->get()
                    ->map(fn($a) => [
                        'id' => $a->id,
                        'type' => 'vt',
                        'action_type' => $a->action_type,
                        'reference' => $a->visiteTechnique ? "{$a->visiteTechnique->admin_rds} - {$a->visiteTechnique->admin_bca}" : null,
                        'project' => $a->visiteTechnique?->project_name,
                        'imported_at' => $a->imported_at,
                        'link' => $a->visiteTechnique ? route('visites-techniques.show', $a->visite_technique_id) : null,
                    ])
            )
            ->concat(
                RaccordementAction::with('raccordement')
                    ->where('imported_at', '>=', Carbon::now()->subDays(7))
                    ->orderBy('imported_at', 'desc')
                    ->take(10)
                    ->get()
                    ->map(fn($a) => [
                        'id' => $a->id,
                        'type' => 'racco',
                        'action_type' => $a->action_type,
                        'reference' => $a->raccordement ? "{$a->raccordement->admin_rds} - {$a->raccordement->admin_bca}" : null,
                        'project' => $a->raccordement?->project_name,
                        'imported_at' => $a->imported_at,
                        'link' => $a->raccordement ? route('raccordements.show', $a->raccordement_id) : null,
                    ])
            )
            ->sortByDesc('imported_at')
            ->take(15)
            ->values();

        // 4. Commentaires récents (non lus)
        $recentComments = Commentaire::whereNull('lu_at')
            ->orderBy('imported_at', 'desc')
            ->take(10)
            ->get()
            ->map(fn($c) => [
                'id' => $c->id,
                'contenu' => $c->contenu,
                'auteur' => $c->auteur,
                'reference' => "{$c->rds} - {$c->bca}",
                'imported_at' => $c->imported_at,
                
            ]);

        // 5. Top opérateurs (nombre de commandes)
        $topOperators = [
            'vt' => VisiteTechnique::selectRaw('operator_name, count(*) as total')
                ->whereNotNull('operator_name')
                ->groupBy('operator_name')
                ->orderByDesc('total')
                ->limit(5)
                ->get(),
            'raccordements' => Raccordement::selectRaw('operator_name, count(*) as total')
                ->whereNotNull('operator_name')
                ->groupBy('operator_name')
                ->orderByDesc('total')
                ->limit(5)
                ->get(),
        ];

        // 6. Taux de transformation (pour VT)
        $transformationRate = [
            'vt' => [
                'total' => $stats['vt']['total'],
                'completed' => $stats['vt']['completed'],
                'rate' => $stats['vt']['total'] > 0
                    ? round(($stats['vt']['completed'] / $stats['vt']['total']) * 100, 1)
                    : 0,
            ],
            'raccordements' => [
                'total' => $stats['raccordements']['total'],
                'completed' => $stats['raccordements']['cr_delivered'],
                'rate' => $stats['raccordements']['total'] > 0
                    ? round(($stats['raccordements']['cr_delivered'] / $stats['raccordements']['total']) * 100, 1)
                    : 0,
            ],
        ];

        return Inertia::render('DashboardTst', [
            'stats' => $stats,
            'evolution' => $evolution,
            'recentActivity' => $recentActivity,
            'recentComments' => $recentComments,
            'topOperators' => $topOperators,
            'transformationRate' => $transformationRate,
        ]);
    }
}
