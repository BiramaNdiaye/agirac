<?php

namespace App\Http\Controllers;

use App\Models\AttenteClient;
use Inertia\Inertia;
use Illuminate\Http\Request;

class AttenteClientController extends Controller
{
   public function index(Request $request)
{
    $query = AttenteClient::query();

    // Filtre de recherche
    if ($request->filled('search')) {
        $search = $request->search;
        $query->where(function ($q) use ($search) {
            $q->where('admin_rds', 'LIKE', "%{$search}%")
              ->orWhere('admin_bca', 'LIKE', "%{$search}%")
              ->orWhere('project_name', 'LIKE', "%{$search}%")
              ->orWhere('operator_name', 'LIKE', "%{$search}%");
        });
    }

    // Filtre par statut
    $status = $request->input('status');
    switch ($status) {
        case 'to_relaunch':
            $query->where('replanned', false)
                  ->whereNotNull('client_wait_end')
                  ->where('client_wait_end', '<', now());
            break;
        case 'replanned':
            $query->where('replanned', true);
            break;
        // Les anciens statuts (optionnels, gardés pour compatibilité)
        case 'active':
            $query->where('begin_client_wait', '<=', now())
                  ->where('client_wait_end', '>=', now());
            break;
        case 'expired':
            $query->where('client_wait_end', '<', now());
            break;
        case 'future':
            $query->where('begin_client_wait', '>', now());
            break;
    }

    // Pagination
    $attentes = $query->orderBy('created_at', 'desc')->paginate(20);

$attentes->getCollection()->transform(function ($attente) {
    $attente->commande_link = $attente->getCommandeLink();
    return $attente;
});
    // Statistiques
    $toRelaunch = AttenteClient::where('replanned', false)
    ->whereNotNull('client_wait_end')
    ->where('client_wait_end', '<', now())
    ->count();

$replanned = AttenteClient::where('replanned', true)->count();

$indetermine = AttenteClient::where('replanned', false)
    ->whereNull('client_wait_end')
    ->count();

    $stats = [
        'total' => AttenteClient::count(),
        'to_relaunch' => $toRelaunch,
        'replanned' => $replanned,
    ];

    return Inertia::render('VisiteTechniques/IndexAttente', [
        'attentes' => $attentes,
        'stats' => $stats,
        'filters' => $request->only(['search', 'status']),
    ]);
}

    public function show($id)
    {
        $attente = AttenteClient::findOrFail($id);
        return Inertia::render('VisiteTechniques/ShowAttente', [
            'attente' => $attente,
        ]);
    }

public function getCommandeLink()
{
    $vt = VisiteTechnique::where('admin_rds', $this->admin_rds)
        ->where('admin_bca', $this->admin_bca)
        ->first();
    if ($vt) {
        return route('visites-techniques.show', $vt->id) . '?tab=comments';
    }
    $racco = Raccordement::where('admin_rds', $this->admin_rds)
        ->where('admin_bca', $this->admin_bca)
        ->first();
    if ($racco) {
        return route('raccordements.show', $racco->id) . '?tab=comments';
    }
    return null;
}
}
