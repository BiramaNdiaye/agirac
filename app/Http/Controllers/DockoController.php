<?php

namespace App\Http\Controllers;

use App\Models\DockoResponse;
use Inertia\Inertia;
use Illuminate\Http\Request;

class DockoController extends Controller
{
    public function index(Request $request)
    {
        $query = DockoResponse::query()
            ->with(['commande'])
            ->orderBy('created_at', 'desc');

        // Filtres
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('type')) {
            $query->where('commande_type', $request->type);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('rds', 'LIKE', "%{$search}%")
                  ->orWhere('bca', 'LIKE', "%{$search}%")
                  ->orWhere('fail_reason', 'LIKE', "%{$search}%");
            });
        }

        $responses = $query->paginate(20);

        $stats = [
            'total' => DockoResponse::count(),
            'acceptes' => DockoResponse::where('status', 'accepte')->count(),
            'refuses' => DockoResponse::where('status', 'refuse')->count(),
            'non_lus' => DockoResponse::where('is_read', false)->count(),
        ];

        return Inertia::render('Docko/Index', [
            'responses' => $responses,
            'stats' => $stats,
            'filters' => $request->only(['status', 'type', 'search']),
        ]);
    }

    public function show($id)
    {
        $response = DockoResponse::with(['commande', 'action'])->findOrFail($id);
        
        // Marquer comme lu
        if (!$response->is_read) {
            $response->markAsRead();
        }

        return Inertia::render('Docko/Show', [
            'response' => $response,
        ]);
    }

    public function markAsRead($id)
    {
        $response = DockoResponse::findOrFail($id);
        $response->markAsRead();
        return response()->json(['success' => true]);
    }

    public function markAllAsRead()
    {
        DockoResponse::where('is_read', false)->update([
            'is_read' => true,
            'read_at' => now(),
        ]);
        return redirect()->back()->with('success', 'Tous les retours DOCKO ont été marqués comme lus');
    }
}
