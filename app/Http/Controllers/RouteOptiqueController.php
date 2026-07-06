<?php

namespace App\Http\Controllers;

use App\Models\RouteOptique;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RouteOptiqueController extends Controller
{
    public function index(Request $request)
    {
        $query = RouteOptique::query();

        if ($request->filled('admin_rds')) {
            $query->where('admin_rds', 'like', '%' . $request->admin_rds . '%');
        }
        if ($request->filled('admin_bca')) {
            $query->where('admin_bca', 'like', '%' . $request->admin_bca . '%');
        }
        if ($request->filled('type_fibre')) {
            $query->where('type_fibre', 'like', '%' . $request->type_fibre . '%');
        }
        if ($request->filled('statut')) {
            $query->where('statut', 'like', '%' . $request->statut . '%');
        }
        if ($request->filled('date_from')) {
            $query->whereDate('imported_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('imported_at', '<=', $request->date_to);
        }

        $query->orderBy('imported_at', 'desc');

        $routeOptiques = $query->paginate(20)->withQueryString();

        return Inertia::render('RouteOptiques/Index', [
            'routeOptiques' => $routeOptiques,
            'filters' => $request->only(['admin_rds', 'admin_bca', 'type_fibre', 'statut', 'date_from', 'date_to']),
        ]);
    }

    public function show(RouteOptique $routeOptique)
    {
        return Inertia::render('RouteOptiques/Show', [
            'routeOptique' => $routeOptique,
        ]);
    }
public function downloadRop(RouteOptique $routeOptique)
{
    if (!$routeOptique->rop_zip_path) {
        abort(404, 'Aucun fichier ROP associé.');
    }
    $fullPath = storage_path('app/' . $routeOptique->rop_zip_path);
    if (!file_exists($fullPath)) {
        abort(404, 'Fichier ROP introuvable sur le serveur.');
    }
    return response()->download($fullPath, basename($fullPath));
}

}
