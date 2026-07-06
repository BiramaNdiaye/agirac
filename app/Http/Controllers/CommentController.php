<?php
// app/Http/Controllers/CommentController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;
use Carbon\Carbon;

class CommentController extends Controller
{
    protected $commentStoragePath;

    public function __construct()
    {
        $this->commentStoragePath = storage_path('app/comments/');
        
        if (!File::isDirectory($this->commentStoragePath)) {
            File::makeDirectory($this->commentStoragePath, 0755, true);
        }
    }

    /**
     * Récupère l'historique des commentaires pour une commande
     */
    public function getHistory($bca, $rds = null)
    {
        try {
            $comments = [];
            
            // Rechercher tous les fichiers de commentaires
            $commentFiles = File::glob($this->commentStoragePath . "*.json");
            
            foreach ($commentFiles as $file) {
                $content = json_decode(File::get($file), true);
                
                // Filtrer par BCA et RDS
                if ($content['bca'] === $bca) {
                    if ($rds === null || $content['rds'] === $rds) {
                        $comments[] = array_merge($content, [
                            'id' => basename($file, '.json'),
                            'file' => basename($file)
                        ]);
                    }
                }
            }
            
            // Trier par date décroissante (plus récent en premier)
            usort($comments, function($a, $b) {
                return strtotime($b['created_at']) - strtotime($a['created_at']);
            });
            
            return response()->json([
                'success' => true,
                'comments' => $comments,
                'count' => count($comments),
                'bca' => $bca,
                'rds' => $rds
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur récupération historique commentaires', [
                'error' => $e->getMessage(),
                'bca' => $bca,
                'rds' => $rds
            ]);
            
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'comments' => []
            ], 500);
        }
    }

    /**
     * Ajoute un nouveau commentaire
     */
    public function addComment(Request $request)
    {
        try {
            $validated = $request->validate([
                'comment' => 'required|string|max:1000',
                'bca_reference' => 'required|string',
                'rds_reference' => 'nullable|string',
                'author' => 'nullable|string|max:100',
                'file' => 'nullable|file|mimes:zip,pdf,doc,docx,jpg,png|max:10240'
            ]);
            
            $bca = $validated['bca_reference'];
            $rds = $validated['rds_reference'] ?? 'unknown';
            $comment = $validated['comment'];
            $author = $validated['author'] ?? auth()->user()->name ?? 'Utilisateur';
            
            // Créer le dossier pour cette commande si nécessaire
            $commandDir = $this->commentStoragePath . $bca . '/' . $rds . '/';
            if (!File::isDirectory($commandDir)) {
                File::makeDirectory($commandDir, 0755, true);
            }
            
            // Générer un identifiant unique pour le commentaire
            $timestamp = Carbon::now()->format('Ymd_His');
            $commentId = uniqid() . '_' . $timestamp;
            
            // Sauvegarder le fichier ZIP si présent
            $zipFilename = null;
            if ($request->hasFile('file')) {
                $file = $request->file('file');
                $zipFilename = $commentId . '_' . $file->getClientOriginalName();
                $file->move($commandDir, $zipFilename);
            }
            
            // Créer l'objet commentaire
            $commentData = [
                'id' => $commentId,
                'bca' => $bca,
                'rds' => $rds,
                'content' => $comment,
                'author' => $author,
                'created_at' => Carbon::now()->toISOString(),
                'formatted_date' => Carbon::now()->format('d/m/Y H:i'),
                'filename' => $zipFilename,
                'user_id' => auth()->id(),
                'user_email' => auth()->user()->email ?? null
            ];
            
            // Sauvegarder au format JSON
            $jsonFile = $commandDir . $commentId . '.json';
            File::put($jsonFile, json_encode($commentData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            
            // Enregistrer également dans un fichier CSV pour la traçabilité
            $csvFile = $commandDir . 'comments_history.csv';
            $csvExists = File::exists($csvFile);
            $csvHandle = fopen($csvFile, 'a');
            
            if (!$csvExists) {
                // Ajouter l'en-tête
                fputcsv($csvHandle, ['date', 'author', 'comment', 'filename', 'bca', 'rds']);
            }
            
            fputcsv($csvHandle, [
                Carbon::now()->format('Y-m-d H:i:s'),
                $author,
                $comment,
                $zipFilename,
                $bca,
                $rds
            ]);
            fclose($csvHandle);
            
            Log::info('Nouveau commentaire ajouté', [
                'bca' => $bca,
                'rds' => $rds,
                'author' => $author,
                'comment_id' => $commentId
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Commentaire ajouté avec succès',
                'comment' => $commentData
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur ajout commentaire', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupère tous les commentaires groupés par commande
     */
    public function getAllComments(Request $request)
    {
        try {
            $comments = [];
            $commentFiles = File::glob($this->commentStoragePath . '*/*/*.json');
            
            foreach ($commentFiles as $file) {
                $content = json_decode(File::get($file), true);
                $comments[] = $content;
            }
            
            // Trier par date
            usort($comments, function($a, $b) {
                return strtotime($b['created_at']) - strtotime($a['created_at']);
            });
            
            return response()->json([
                'success' => true,
                'comments' => $comments,
                'count' => count($comments)
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprime un commentaire
     */
    public function deleteComment($commentId)
    {
        try {
            // Rechercher le fichier du commentaire
            $commentFiles = File::glob($this->commentStoragePath . '*/*/' . $commentId . '.json');
            
            if (empty($commentFiles)) {
                return response()->json([
                    'success' => false,
                    'error' => 'Commentaire non trouvé'
                ], 404);
            }
            
            $commentFile = $commentFiles[0];
            $commentData = json_decode(File::get($commentFile), true);
            
            // Supprimer le fichier ZIP associé si existant
            if (isset($commentData['filename'])) {
                $zipPath = dirname($commentFile) . '/' . $commentData['filename'];
                if (File::exists($zipPath)) {
                    File::delete($zipPath);
                }
            }
            
            // Supprimer le fichier JSON
            File::delete($commentFile);
            
            Log::info('Commentaire supprimé', [
                'comment_id' => $commentId,
                'bca' => $commentData['bca'] ?? null,
                'rds' => $commentData['rds'] ?? null
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Commentaire supprimé avec succès'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
