<?php

namespace App\Http\Controllers;

use App\Models\OTPOSECPECVG;
use Illuminate\Http\Request;

class OTPOSECPECVGController extends Controller
{
    /**
     * Liste des OTPOSECPECVG
     */
    public function index(Request $request)
    {

        $query = OTPOSECPECVG::query()
            ;


        // Recherche
        if ($request->search) {

            $search = $request->search;


            $query->where(function ($q) use ($search) {

                $q->where('admin_rds', 'like', "%{$search}%")
                    ->orWhere('admin_bca', 'like', "%{$search}%")
                    ->orWhere('operator_name', 'like', "%{$search}%")
                    ->orWhere('project_name', 'like', "%{$search}%")
                    ->orWhere('address_site_a_town', 'like', "%{$search}%");

            });

        }


        // Pagination
        $otposecpecvg = $query
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();



        return inertia('OTPOSECPECVG/Index', [
            'otposecpecvg' => $otposecpecvg,
            'filters' => [
                'search' => $request->search
            ]
        ]);

    }




    /**
     * Détail d'un OTPOSECPECVG
     */
    public function show($id)
    {

        $otposecpecvg = OTPOSECPECVG::findOrFail($id);



        return inertia('OTPOSECPECVG/Show', [
            'otposecpecvg' => $otposecpecvg
        ]);

    }




    /**
     * Suppression
     */
    public function destroy($id)
    {

        $otposecpecvg = OTPOSECPECVG::findOrFail($id);


        $otposecpecvg->delete();


        return redirect()
            ->back()
            ->with(
                'success',
                'OTPOSECPECVG supprimé avec succès'
            );

    }
}
