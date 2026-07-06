<?php
// routes/web.php
use App\Http\Controllers\RaccordementController;
use App\Http\Controllers\CommentaireController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use App\Http\Controllers\SftpUploadController;
use App\Http\Controllers\ErrorController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ModuleController;
use App\Http\Controllers\SuiviController;
use App\Http\Controllers\AttenteClientController;
use App\Http\Controllers\Admin\UserController;

use App\Http\Controllers\RejeteController;
use App\Http\Controllers\AnnulationController;
use App\Http\Controllers\RouteOptiqueController;
use App\Http\Controllers\EditPlanifDateController;

use App\Mail\NewImportNotification;
use Illuminate\Support\Facades\Mail;


// ==================== ROUTES PUBLIQUES ====================
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin'      => Route::has('login'),
        'canRegister'   => Route::has('register'),
        'laravelVersion'=> Application::VERSION,
        'phpVersion'    => PHP_VERSION,
    ]);
});

require __DIR__.'/auth.php';

Route::get('/test-mail', function () {
    try {
        Mail::to('votre_email_de_reception@domaine.fr')->send(new NewImportNotification(['test.zip'], 'TEST'));
        return "✅ Email envoyé avec succès !";
    } catch (\Exception $e) {
        return "❌ Erreur : " . $e->getMessage();
    }
});


// ==================== ROUTES PROTÉGÉES ====================
Route::middleware(['auth', 'verified'])->group(function () {
Route::resource('route-optiques', RouteOptiqueController::class)->only(['index', 'show']);
// ou avec un nom plus court
Route::get('/routeoptiques', [RouteOptiqueController::class, 'index'])->name('routeoptiques.index');
Route::get('/routeoptiques/{routeOptique}', [RouteOptiqueController::class, 'show'])->name('routeoptiques.show');
Route::get('/routeoptiques/{routeOptique}/download-rop', [RouteOptiqueController::class, 'downloadRop'])->name('routeoptiques.download-rop');
//edit planifdate
Route::get('/edit-planif-dates', [EditPlanifDateController::class, 'index'])->name('edit-planif-dates.index');
Route::get('/edit-planif-dates/{editPlanifDate}', [EditPlanifDateController::class, 'show'])->name('edit-planif-dates.show');
Route::get('/edit-planif-dates/{editPlanifDate}/download', [EditPlanifDateController::class, 'download'])->name('edit-planif-dates.download');



    // Logout
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/dashboard-test', fn() => Inertia::render('Dashboard'))->name('dashboard-test');

    // ── Profil ──────────────────────────────────────────────
    Route::get('/profile',    [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile',  [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // ── Commentaires ─────────────────────────────────────────
    Route::prefix('commentaires')->name('commentaires.')->group(function () {
        Route::get('/',             [CommentaireController::class, 'index'])->name('index');
        Route::get('/{id}',         [CommentaireController::class, 'show'])->name('show');
        Route::post('/{id}/read',   [CommentaireController::class, 'markAsRead'])->name('mark-read');
        Route::post('/{id}/reply',  [CommentaireController::class, 'storeReply'])->name('reply');
        Route::post('/read-all',    [CommentaireController::class, 'markAllAsRead'])->name('mark-all-read');
    });

    // ── Commandes / SFTP ─────────────────────────────────────
    Route::get('/orders/{bca}/{rds}/{selectedDate?}', [SftpUploadController::class, 'getOrderDetails'])
        ->name('orders.details');
    Route::get('/orders/{bca}/{rds}/versions', [SftpUploadController::class, 'getOrderVersions'])
        ->name('orders.versions');
    Route::get('/test-sftp', [SftpUploadController::class, 'testSftpConnection']);

    // Ancienne route redirigée
    Route::get('/commande/{orderId}/{bcaReference}/{selectedDate?}', function ($orderId, $bcaReference, $selectedDate = null) {
        return redirect()->route('orders.details', [
            'bca'          => $bcaReference,
            'rds'          => $orderId,
            'selectedDate' => $selectedDate,
        ]);
    })->name('commande.details');

    // ── Recherche & téléchargement ───────────────────────────
    Route::get('/commandes/search',        [SftpUploadController::class, 'searchCommande'])->name('commandes.search');
    Route::get('/download-zip/{filename}', [SftpUploadController::class, 'downloadZip'])->name('download.zip');

    // ── API Comments ─────────────────────────────────────────
    Route::prefix('api/comments')->group(function () {
        Route::get('/history/{bca}/{rds}', [CommentController::class, 'getHistory'])->name('api.comments.history');
        Route::post('/add',                [CommentController::class, 'addComment'])->name('api.comments.add');
        Route::delete('/{commentId}',      [CommentController::class, 'deleteComment'])->name('api.comments.delete');
    });

    // ── Backlog VT ───────────────────────────────────────────
    Route::get('/backlog-vt',           [SftpUploadController::class, 'backlogVT'])->name('backlog.vt');
    Route::get('/vt-a-planifier',       [SftpUploadController::class, 'vtAPlanifier'])->name('vt.a-planifier');
    Route::get('/vt-planifiees',        [SftpUploadController::class, 'vtPlanifiees'])->name('vt.planifiees');
    Route::get('/crvt-recus',           [SftpUploadController::class, 'crvtRecus'])->name('vt.crvt-recus');

    // ── Backlog Raccordement ──────────────────────────────────
    Route::get('/backlog-racco',            [SftpUploadController::class, 'backlogRacco'])->name('backlog.racco');
    Route::get('/racco-a-planifier',        [SftpUploadController::class, 'raccoAPlanifier'])->name('racco.a-planifier');
    Route::get('/racco-planifies',          [SftpUploadController::class, 'raccoPlanifies'])->name('racco.planifies');
    Route::get('/cr-interventions-recus',   [SftpUploadController::class, 'crInterventionsRecus'])->name('racco.cr-interventions');

    // ── Divers ───────────────────────────────────────────────
    Route::get('/attente-client', [SftpUploadController::class, 'attenteClient'])->name('attente-client');
    Route::post('/merge-comments', [SftpUploadController::class, 'mergeCommentsFiles'])->name('merge.comments');

    // ── API Dashboard / filtre ───────────────────────────────
    Route::get('/api/dashboard-stats', [SftpUploadController::class, 'getDashboardStats'])->name('api.dashboard-stats');
    Route::post('/api/filter-data',    [SftpUploadController::class, 'filterData'])->name('api.filter-data');
    Route::get('/api/export-data',     [SftpUploadController::class, 'exportFilteredData'])->name('api.export-data');

    // ── VT groupé ────────────────────────────────────────────
    Route::get('/vt/grouped', function () {
        $response = Http::get(config('app.url') . '/api/vt/grouped-data');
        $data = $response->json();
        return Inertia::render('VT/GroupedDataView', [
            'groupedData' => $data['data'] ?? [],
            'stats'       => $data['stats'] ?? [],
        ]);
    })->name('vt.grouped');

    // ── Données groupées ─────────────────────────────────────
    Route::get('/grouped-data', function () {
        try {
            $response = Http::timeout(60)->get(config('app.url') . '/api/grouped-data');
            $data = $response->successful() ? $response->json() : [];
            return Inertia::render('GroupedDataView', [
                'groupedData' => $data['data'] ?? [],
                'stats'       => $data['stats'] ?? [],
                'timestamp'   => now()->toIso8601String(),
                'error'       => $response->successful() ? null : 'Erreur de chargement des données',
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Erreur affichage page groupée', ['error' => $e->getMessage()]);
            return Inertia::render('GroupedDataView', [
                'groupedData' => [], 'stats' => [], 'error' => $e->getMessage(),
            ]);
        }
    })->name('grouped.data');

    Route::get('/grouped-data/{rds}/{refBca}', function ($rds, $refBca) {
        try {
            $response = Http::timeout(60)->get(config('app.url') . "/api/group-details/{$rds}/{$refBca}");
            $data = $response->successful() ? $response->json() : [];
            return Inertia::render('GroupDetailView', [
                'group'  => $data['data'] ?? null,
                'rds'    => $rds,
                'refBca' => $refBca,
                'error'  => $response->successful() ? null : 'Groupe non trouvé',
            ]);
        } catch (\Exception $e) {
            return Inertia::render('GroupDetailView', [
                'group' => null, 'error' => $e->getMessage(), 'rds' => $rds, 'refBca' => $refBca,
            ]);
        }
    })->name('grouped.data.detail');

    // ── API interne groupée ──────────────────────────────────
    Route::prefix('api')->group(function () {
        Route::get('/grouped-data',                      [SftpUploadController::class, 'getGroupedData']);
        Route::get('/group-details/{rds}/{refBca}',      [SftpUploadController::class, 'getGroupDetails']);
    });

    // ── Visites techniques ───────────────────────────────────
    Route::prefix('visites-techniques')->name('visites-techniques.')->group(function () {
        Route::get('/',              [SftpUploadController::class, 'listeVisitesTechniques'])->name('indexe');
        Route::get('/{id}',          [SftpUploadController::class, 'show'])->name('show');
        Route::post('/import',       [SftpUploadController::class, 'importOtplanifvtdate'])->name('import');
    });
    Route::get('/visites-techniques',           [SftpUploadController::class, 'index'])->name('visites-techniques.index');
    Route::get('/visites-techniques/{rds}/{bca}',[SftpUploadController::class, 'showByRdsBca'])->name('visites-techniques.show-by-ids');
    Route::post('/{id}/commentaire',            [SftpUploadController::class, 'ajouterCommentaire'])->name('visites-techniques.commentaire.ajouter');
    Route::post('/commentaire/{id}/lu',         [SftpUploadController::class, 'marquerCommentaireLu'])->name('visites-techniques.commentaire.lu');

    // ── Raccordements ─────────────────────────────────────────
    Route::prefix('raccordements')->name('raccordements.')->group(function () {
        Route::get('/',        [RaccordementController::class, 'index'])->name('index');
        Route::get('/{id}',    [RaccordementController::class, 'show'])->name('show');
        Route::post('/import', [RaccordementController::class, 'import'])->name('import');
        Route::post('/{id}/commentaire',    [RaccordementController::class, 'ajouterCommentaire'])->name('commentaire.ajouter');
        Route::post('/commentaire/{id}/lu', [RaccordementController::class, 'marquerCommentaireLu'])->name('commentaire.lu');
    });

    // ── API VT / CSV ──────────────────────────────────────────
    Route::get('/api/vt/csv-data',        [SftpUploadController::class, 'getCsvData']);
    Route::post('/api/vt/upload-csv',     [SftpUploadController::class, 'uploadCsvData']);
    Route::post('/api/vt/upload-racco',   [SftpUploadController::class, 'uploadCsvDataRacco']);
    Route::post('/api/vt/csv-filtre',     [SftpUploadController::class, 'filterVT']);
    Route::post('/api/vt/comment',        [SftpUploadController::class, 'uploadComment']);
    Route::get('/api/vt/grouped-data',    [SftpUploadController::class, 'getGroupedData']);

    // ── Erreurs CSV ───────────────────────────────────────────
    Route::get('/csv-error',                        [ErrorController::class, 'processAllZipFiles'])->name('errors.index');
    Route::get('/errors/download/{filename}',       [ErrorController::class, 'downloadZip']);

    // ── Suivi ─────────────────────────────────────────────────
    Route::get('/suivi/{rds}', [SuiviController::class, 'show'])->name('suivi.show');

    // ── Attente client ────────────────────────────────────────
    Route::prefix('attente-client')->name('attente-client.')->group(function () {
        Route::get('/',      [AttenteClientController::class, 'index'])->name('index');
        Route::get('/{id}',  [AttenteClientController::class, 'show'])->name('show');
    });

    // ── Admin ─────────────────────────────────────────────────
    Route::middleware('role:admin')->group(function () {
        Route::get('/admin/users',         [UserController::class, 'index'])->name('admin.users.index');
        Route::post('/admin/users',        [UserController::class, 'store'])->name('admin.users.store');
        Route::get('/users/create',        [UserController::class, 'create'])->name('admin.users.create');
        Route::put('/admin/users/{user}',  [UserController::class, 'update'])->name('admin.users.update');
        Route::delete('/admin/users/{user}',[UserController::class, 'destroy'])->name('admin.users.destroy');
        Route::get('/users/{user}/edit',   [UserController::class, 'edit'])->name('admin.users.edit');
    });


Route::resource('rejetes', RejeteController::class)->only(['index', 'show']);
Route::resource('annulations', AnnulationController::class)->only(['index', 'show']);

    // ── Debug (à désactiver en production) ───────────────────
    Route::get('/debug/orders', function () {
        $controller = app(SftpUploadController::class);
        $response = $controller->getCsvData();
        $data = $response->getData(true);
        $orders = [];
        foreach ($data['data'] as $zip) {
            foreach ($zip['csv_files'] as $csv) {
                foreach ($csv['sample_rows'] as $row) {
                    $orders[] = [
                        'bca'      => $row['admin_bca'] ?? null,
                        'rds'      => $row['admin_rds'] ?? null,
                        'prefix'   => $row['admin_prefix'] ?? null,
                        'filename' => $csv['file_name'],
                    ];
                }
            }
        }
        return response()->json($orders);
    });

});
