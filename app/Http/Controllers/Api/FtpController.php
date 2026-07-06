<?php

namespace App\Http\Controllers\Api;

use Illuminate\Support\Facades\Storage;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class FtpController extends Controller
{
    /**
     * Liste les fichiers du serveur FTP
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        try {
            // Récupère tous les fichiers du répertoire racine
            $files = Storage::disk('ftp')->listContents('/');
            
            // Filtre pour ne garder que les fichiers (exclut les dossiers)
            $files = array_filter($files, function($file) {
                return $file['type'] === 'file';
            });

            return response()->json([
                'success' => true,
                'data' => array_values($files), // Réindexe le tableau
                'message' => 'Fichiers récupérés avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de connexion FTP: ' . $e->getMessage()
            ], 500);
        }
    }
}
