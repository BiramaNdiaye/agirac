<?php

namespace App\Http\Controllers;

use App\Models\Rejete;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RejeteController extends Controller
{
    public function index(Request $request)
    {
        $query = Rejete::query();

        // Filtres
        if ($request->filled('admin_rds')) {
            $query->where('admin_rds', 'like', '%' . $request->admin_rds . '%');
        }
        if ($request->filled('admin_bca')) {
            $query->where('admin_bca', 'like', '%' . $request->admin_bca . '%');
        }
        if ($request->filled('fail_reason')) {
            $query->where('fail_reason', 'like', '%' . $request->fail_reason . '%');
        }
        if ($request->filled('date_from')) {
            $query->whereDate('imported_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('imported_at', '<=', $request->date_to);
        }

        $query->orderBy('imported_at', 'desc');

        $rejetes = $query->paginate(20)->withQueryString();

        return Inertia::render('Rejetes/Index', [
            'rejetes' => $rejetes,
            'filters' => $request->only(['admin_rds', 'admin_bca', 'fail_reason', 'date_from', 'date_to']),
        ]);
    }

    public function show(Rejete $rejete)
    {
        return Inertia::render('Rejetes/Show', [
            'rejete' => $rejete,
        ]);
    }
}
