<?php
namespace App\Http\Controllers;

use App\Models\EditPlanifDate;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EditPlanifDateController extends Controller
{
    public function index(Request $request)
    {
        $query = EditPlanifDate::query();

        // Filtres
        if ($request->filled('admin_rds')) {
            $query->where('admin_rds', 'like', '%' . $request->admin_rds . '%');
        }
        if ($request->filled('admin_bca')) {
            $query->where('admin_bca', 'like', '%' . $request->admin_bca . '%');
        }
        if ($request->filled('planning_date')) {
            $query->whereDate('planning_date', $request->planning_date);
        }
        if ($request->filled('date_from')) {
            $query->whereDate('imported_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('imported_at', '<=', $request->date_to);
        }

        $query->orderBy('imported_at', 'desc');

        $editPlanifDates = $query->paginate(20)->withQueryString();

        return Inertia::render('EditPlanifDates/Index', [
            'editPlanifDates' => $editPlanifDates,
            'filters' => $request->only(['admin_rds', 'admin_bca', 'planning_date', 'date_from', 'date_to']),
        ]);
    }

    public function show(EditPlanifDate $editPlanifDate)
    {
        // Charger les relations
        $editPlanifDate->load(['visiteTechnique', 'raccordement']);

        return Inertia::render('EditPlanifDates/Show', [
            'editPlanifDate' => $editPlanifDate,
        ]);
    }

    public function download(EditPlanifDate $editPlanifDate)
    {
        if (!$editPlanifDate->edit_zip_path) {
            abort(404, 'Aucun fichier ZIP associé.');
        }

        $path = storage_path('app/' . $editPlanifDate->edit_zip_path);
        if (!file_exists($path)) {
            abort(404, 'Fichier ZIP introuvable.');
        }

        return response()->download($path);
    }
}
