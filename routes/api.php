<?php
use App\Http\Controllers\SftpUploadController;
use App\Http\Controllers\ErrorController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\NotificationController;
use Illuminate\Support\Facades\Route;
use App\Http\Middleware\VerifyCsrfToken;

Route::get('/api/vt/csv-data', [SftpUploadController::class, 'getCsvData']);
Route::get('/api/search-reference-bca', [SftpUploadController::class, 'searchReferenceBCA']);
Route::post('/detailCommande', [SftpUploadController::class, 'show'])->name('commande.show');
Route::get('/download-zip/{filename}', [SftpUploadController::class, 'downloadZip']);
Route::post('/api/vt/upload-racco', [SftpUploadController::class, 'uploadCsvDataRacco']);
Route::post('/api/vt/csv-filtre', [SftpUploadController::class, 'filterVT']);

Route::get('/api/vt/csv-error', [ErrorController::class, 'processAllZipFiles']);

Route::prefix('comments')->group(function () {
    // Récupérer l'historique d'une commande
    Route::get('/history/{bca}/{rds?}', [CommentController::class, 'getHistory'])
        ->name('api.comments.history');
    
    // Récupérer tous les commentaires
    Route::get('/all', [CommentController::class, 'getAllComments'])
        ->name('api.comments.all');
    
    // Ajouter un commentaire
    Route::post('/add', [CommentController::class, 'addComment'])
        ->name('api.comments.add');
    
    // Supprimer un commentaire
    Route::delete('/{commentId}', [CommentController::class, 'deleteComment'])
        ->name('api.comments.delete');
});

Route::get('/notifications', [NotificationController::class, 'index']);
Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);


    Route::get('/test-json', function () {
    return response()->json(['ok' => true]);
});
   
