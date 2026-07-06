<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ModuleController extends Controller
{
    public function covageSav()
    {
        return Inertia::render('Modules/SAV/Index.jsx', [
            'title' => 'COVAGE / FTTH PRO',
            'breadcrumbs' => [
                ['name' => 'Modules', 'url' => route('modules.index')],
                ['name' => 'COVAGE / FTTH PRO', 'current' => true],
            ],
            'stats' => [
                'totalCommandes' => 125,
                'enCours' => 42,
                'terminees' => 83,
                'enRetard' => 15,
            ],
        ]);
    }

    /**
     * Page du module COVAGE / FTTO
     */
    public function covageFtto()
    {
        return Inertia::render('Modules/CovageFtto', [
            'title' => 'COVAGE / FTTO',
            'breadcrumbs' => [
                ['name' => 'Modules', 'url' => route('modules.index')],
                ['name' => 'COVAGE / FTTO', 'current' => true],
            ],
            'stats' => [
                'totalCommandes' => 89,
                'enCours' => 31,
                'terminees' => 58,
                'enRetard' => 8,
            ],
        ]);
    }

}
