<?php

namespace App\Http\Controllers;

use App\Models\Annulation;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AnnulationController extends Controller
{
    public function index(Request $request)
    {
        $query = Annulation::query();

        if ($request->filled('admin_rds')) {
            $query->where('admin_rds', 'like', '%' . $request->admin_rds . '%');
        }
        if ($request->filled('admin_bca')) {
            $query->where('admin_bca', 'like', '%' . $request->admin_bca . '%');
        }
        if ($request->filled('cancellation_date')) {
            $query->whereDate('cancellation_date', $request->cancellation_date);
        }
        if ($request->filled('date_from')) {
            $query->whereDate('cancellation_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('cancellation_date', '<=', $request->date_to);
        }
        if ($request->filled('type')) {
        if ($request->type === 'visite_technique') {
            $query->whereNotNull('visite_technique_id');
        } elseif ($request->type === 'raccordement') {
            $query->whereNotNull('raccordement_id');
        }
        // Sinon, 'all' ne filtre pas
    }

         $annulations = $query->orderBy('cancellation_date', 'desc')->paginate(20);

    // Ajouter le type dans chaque item
    $annulations->getCollection()->transform(function ($annulation) {
        $annulation->type_lie = $annulation->visite_technique_id ? 'visite_technique' : ($annulation->raccordement_id ? 'raccordement' : null);
        return $annulation;
    });

    return Inertia::render('Annulations/Index', [
        'annulations' => $annulations,
        'filters' => $request->all(),
    ]);
    }

    public function show(Annulation $annulation)
    {
        return Inertia::render('Annulations/Show', [
            'annulation' => $annulation,
        ]);
    }
}
