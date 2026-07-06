<?php

namespace App\Http\Controllers;

use App\Models\Commentaire;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use ZipArchive;

class CommentaireController extends Controller
{
public function storeReply(Request $request, $id)
{
    $parent = Commentaire::findOrFail($id);

    $request->validate([
        'contenu' => 'required|string|min:3|max:250',
    ]);

    // 1. Enregistrer la réponse en base
    $reply = new Commentaire();
    $reply->contenu = $request->contenu;
    $reply->auteur = auth()->user()->name ?? 'Application';
    $reply->rds = $parent->rds;
    $reply->bca = $parent->bca;
    $reply->commande_type = $parent->commande_type;
    $reply->commande_id = $parent->commande_id;
    $reply->type_document = 'COMMENT';
    $reply->prefix = 'COMMENT';
    $reply->source = 'MANUAL';
    $reply->source_file = 'manual_reply_' . now()->format('Ymd_His') . '.csv';
    $reply->est_reponse = true;
    $reply->reponse_a_id = $parent->id;
    $reply->imported_at = now();
    $reply->save();

    // 2. Générer le fichier CSV et l’envoyer vers Covage
    $this->sendCommentToCovage($reply);

    return redirect()->back()->with('success', 'Réponse ajoutée et envoyée à Covage');
}

private function sendCommentToCovage(Commentaire $commentaire)
{
    // 1. Définir la liste complète des colonnes (allFields + les trois obligatoires)
    $allFields = [
        'address_site_a_name', 'address_site_a_postal', 'address_site_a_street', 'address_site_a_town',
        'address_site_a_x', 'address_site_a_y', 'insee_code', 'admin_contract', 'bandwith', 'building_code',
        'client_directive_access', 'client_directive_intervention', 'client_directive_planning',
        'contact_on_site_firstname', 'contact_on_site_lastname', 'contact_on_site_mail', 'contact_on_site_phone',
        'covage_contact_name', 'covage_contact_mail', 'network', 'nro_name', 'nro_port', 'offer',
        'oi_reference', 'operator_client_ref', 'operator_name', 'order_date', 'bpe_piquage', 'project_name',
        'rop_ref', 'techno', 'begin_client_wait', 'client_wait_end', 'mer_number', 'equipement_number',
        'article_designation', 'cable_capacity', 'gc_length', 'ml_length_extension_cable',
        'ml_length_racco_cable_private_domain', 'ml_length_racco_cable_public_domain', 'pmv_validation_date',
        'submission_date_doe', 'enedis_validation_date', 'orange_submission_date', 'orange_validation_date',
        'pole_intervention', 'orange_order_ref', 'enedis_order_start_date', 'orange_order_start_date',
        'planning_date', 'effective_date', 'fail_reason', 'submission_date'
    ];

    // 2. Construire la ligne de données : toutes les colonnes vides sauf les 4 obligatoires
    $rowData = [];
    foreach ($allFields as $field) {
        $rowData[$field] = ''; // toutes vides
    }
    // Ajout des champs obligatoires (non présents dans allFields)
    $rowData['admin_rds'] = $commentaire->rds;
    $rowData['admin_bca'] = $commentaire->bca;
    $rowData['admin_prefix'] = 'COMMENT';
    $rowData['comment'] = $commentaire->contenu;

    // 3. Préparer les en-têtes (colonnes)
    $headers = array_keys($rowData);

    // 4. Échapper les valeurs CSV
    $escape = function($value) {
        if ($value === null) return '';
        $str = (string) $value;
        // Mettre entre guillemets si contient virgule, guillemet ou saut de ligne
        if (strpos($str, ',') !== false || strpos($str, '"') !== false || strpos($str, "\n") !== false) {
            return '"' . str_replace('"', '""', $str) . '"';
        }
        return $str;
    };

    $headerLine = implode(',', array_map($escape, $headers));
    $valueLine = implode(',', array_map($escape, array_values($rowData)));

    $csvContent = $headerLine . "\n" . $valueLine;

    // 5. Nom du fichier
    $now = now();
    $formattedDate = $now->format('Ymd');
    $formattedTime = $now->format('Hi');
    $csvFilename = sprintf('COMMENT_%s_%s_%s_%s.csv',
        $commentaire->rds,
        $commentaire->bca,
        $formattedDate,
        $formattedTime
    );
    $zipFilename = str_replace('.csv', '.zip', $csvFilename);

    // 6. Créer le ZIP temporaire
    $tempDir = storage_path('app/temp/');
    if (!is_dir($tempDir)) mkdir($tempDir, 0755, true);
    $tempZipPath = $tempDir . $zipFilename;

    $zip = new \ZipArchive();
    if ($zip->open($tempZipPath, \ZipArchive::CREATE) !== true) {
        throw new \Exception("Impossible de créer le fichier ZIP pour le commentaire");
    }
    $zip->addFromString($csvFilename, $csvContent);
    $zip->close();

    // 7. Envoyer vers SFTP (dossier /IN)
    $disk = \Illuminate\Support\Facades\Storage::disk('sftp_out');
    $stream = fopen($tempZipPath, 'r+');
    if ($stream) {
        $disk->put($zipFilename, $stream);
        fclose($stream);
    } else {
        throw new \Exception("Impossible d'ouvrir le fichier ZIP temporaire");
    }

    // 8. Nettoyage
    unlink($tempZipPath);

    \Illuminate\Support\Facades\Log::info("Commentaire envoyé à Covage", [
        'fichier' => $zipFilename,
        'rds' => $commentaire->rds,
        'bca' => $commentaire->bca,
    ]);
}

private function arrayToCsv(array $data)
{
    $headers = array_keys($data);
    $escapedHeaders = array_map(function ($h) {
        return '"' . str_replace('"', '""', $h) . '"';
    }, $headers);
    $escapedValues = array_map(function ($v) {
        $str = (string) $v;
        return '"' . str_replace('"', '""', $str) . '"';
    }, array_values($data));
    return implode(',', $escapedHeaders) . "\n" . implode(',', $escapedValues);
}
    public function index(Request $request)
{
    $query = Commentaire::with('commande');

    // Filtres
    if ($request->filled('type')) {
        $query->where('commande_type', $request->type);
    }
    if ($request->filled('status')) {
        if ($request->status === 'lu') {
            $query->whereNotNull('lu_at');
        } elseif ($request->status === 'non_lu') {
            $query->whereNull('lu_at');
        }
    }
    if ($request->filled('search')) {
        $search = $request->search;
        $query->where(function($q) use ($search) {
            $q->where('contenu', 'LIKE', "%{$search}%")
              ->orWhere('auteur', 'LIKE', "%{$search}%")
              ->orWhere('rds', 'LIKE', "%{$search}%")
              ->orWhere('bca', 'LIKE', "%{$search}%");
        });
    }

    // Récupérer tous les commentaires filtrés, triés par date croissante
    $commentaires = $query->orderBy('created_at', 'asc')->get();

    // Regrouper par rds + bca → chaque groupe = une "discussion"
    $discussions = $commentaires
        ->groupBy(fn($c) => $c->rds . '||' . $c->bca)
        ->map(function ($messages, $key) {
            [$rds, $bca] = explode('||', $key);
            return [
                'rds'          => $rds,
                'bca'          => $bca,
                'messages'     => $messages->values(),
                'dernier_at'   => $messages->max('created_at'),
                'non_lus'      => $messages->whereNull('lu_at')->count(),
            ];
        })
        ->sortByDesc('dernier_at')
        ->values();

    // Stats
    $stats = [
        'total'        => Commentaire::count(),
        'lus'          => Commentaire::whereNotNull('lu_at')->count(),
        'non_lus'      => Commentaire::whereNull('lu_at')->count(),
        'vt'           => Commentaire::where('commande_type', Commentaire::COMMANDE_VT)->count(),
        'raccordement' => Commentaire::where('commande_type', Commentaire::COMMANDE_RACCORDEMENT)->count(),
    ];

    return Inertia::render('Commentaire/Index', [
        'discussions' => $discussions,
        'stats'       => $stats,
        'filters'     => $request->only(['type', 'status', 'search']),
    ]);
}

    public function show($id)
    {
        $commentaire = Commentaire::with('commande')->findOrFail($id);
        
        // Marquer comme lu si ce n'est pas déjà fait
        if (is_null($commentaire->lu_at)) {
            $commentaire->markAsRead();
        }
        
        // Récupérer les réponses (si vous avez une colonne reponse_a_id)
        $reponses = Commentaire::where('reponse_a_id', $id)->orderBy('created_at')->get();

        return Inertia::render('Commentaire/Show', [
            'commentaire' => $commentaire,
            'reponses' => $reponses,
        ]);
    }

    public function markAsRead($id)
    {
        $commentaire = Commentaire::findOrFail($id);
        $commentaire->markAsRead();
        return redirect()->back()->with('success', 'Commentaire marqué comme lu');
    }

    public function markAllAsRead()
    {
        Commentaire::whereNull('lu_at')->update(['lu_at' => now()]);
        return redirect()->back()->with('success', 'Tous les commentaires marqués comme lus');
    }
}
