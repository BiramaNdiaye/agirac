<?php

use Illuminate\Support\Facades\Schedule;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

// Commandes d'import
use App\Console\Commands\ImportOtplanifvtdate;
use App\Console\Commands\ImportAllCsvData;
use App\Console\Commands\ImportOtplanifraccodate;
use App\Console\Commands\ImportArchivedFiles;

use App\Console\Commands\ImportRaccordementArchives;
use App\Console\Commands\ImportPlanifDateVtko;
use App\Console\Commands\ImportInFiles;
use App\Console\Commands\ImportCommentaires;
use App\Console\Commands\ImportPlanifRaccoDateKo;
use App\Console\Commands\ImportAttenteClient;
use App\Console\Commands\CheckExpiredWaitingPeriods;

use App\Console\Commands\ImportRejetes;
use App\Console\Commands\ImportAnnulations;
use App\Console\Commands\ImportRouteOptiques;
use App\Console\Commands\ImportEditplanifdate;




Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// ============================================
// IMPORTS DES VISITES TECHNIQUES (OTPLANIFVTDATE)
// ============================================

Schedule::command(ImportOtplanifvtdate::class)
    ->name('import-otplanifvtdate')
    ->everyFiveMinutes()
    ->withoutOverlapping(5)
    ->runInBackground()
    ->onSuccess(function () {
        Log::channel('schedule')->info('✅ Import OTPLANIFVTDATE réussi');
    })
    ->onFailure(function () {
        Log::channel('schedule')->error('❌ Échec import OTPLANIFVTDATE');
    });

//pour les attentes clients
Schedule::command(CheckExpiredWaitingPeriods::class)
    ->name('check-expired-waiting')
    ->dailyAt('08:00')  // chaque jour à 8h
    ->withoutOverlapping()
    ->runInBackground();

// ============================================

// importers fichiers erreurs depuis   /ERROR

// IMPORTS DES RACCORDEMENTS (OTPLANIFRACCODATE)
// ============================================

Schedule::command(ImportOtplanifraccodate::class)
    ->name('import-otplanifraccodate')
    ->everyFiveMinutes()
    ->withoutOverlapping(5)
    ->runInBackground()
    ->onSuccess(function () {
        Log::channel('schedule')->info('✅ Import OTPLANIFRACCODATE réussi');
    })
    ->onFailure(function () {
        Log::channel('schedule')->error('❌ Échec import OTPLANIFRACCODATE');
    });

// ============================================
// IMPORTS DES ARCHIVES VT
// ============================================

// Import de tous les types d'archives VT
Schedule::command(ImportArchivedFiles::class)
    ->name('import-archived-vt')
    ->everyFiveMinutes()
    ->withoutOverlapping(5)
    ->runInBackground()
    ->onSuccess(function () {
        Log::channel('schedule')->info('✅ Import archives VT réussi');
    })
    ->onFailure(function () {
        Log::channel('schedule')->error('❌ Échec import archives VT');
    });

// Import spécifique PLANIFVTDATE
Schedule::command(ImportPlanifVtDate::class)
    ->name('import-planif-vt')
    ->everyFiveMinutes()
    ->withoutOverlapping(5)
    ->runInBackground();

// Import spécifique PLANIFDATEVTKO

// ============================================
// IMPORTS DES ARCHIVES RACCORDEMENT
// ============================================

// Import de tous les types d'archives raccordement
Schedule::command(ImportRaccordementArchives::class)
    ->name('import-raccordement-archives')
    ->everyFiveMinutes()
    ->withoutOverlapping(5)
    ->runInBackground()
    ->onSuccess(function () {
        Log::channel('schedule')->info('✅ Import archives raccordement réussi');
    })
    ->onFailure(function () {
        Log::channel('schedule')->error('❌ Échec import archives raccordement');
    });

// Import spécifique PLANIFRACCODATEKO
Schedule::command(ImportPlanifRaccoDateKo::class)
    ->name('import-planif-racco-ko')
    ->everyFiveMinutes()
    ->withoutOverlapping(5)
    ->runInBackground();

// ============================================
// IMPORTS DES FICHIERS /IN
// ============================================

Schedule::command(ImportInFiles::class)
    ->name('import-in-files')
    ->everyFiveMinutes()
    ->withoutOverlapping(5)
    ->runInBackground()
    ->onSuccess(function () {
        Log::channel('schedule')->info('✅ Import /IN réussi');
    })
    ->onFailure(function () {
        Log::channel('schedule')->error('❌ Échec import /IN');
    });

// ============================================
// IMPORTS DES COMMENTAIRES
// ============================================

Schedule::command(ImportCommentaires::class)
    ->name('import-commentaires')
    ->everyFiveMinutes()
    ->withoutOverlapping(5)
    ->runInBackground()
    ->onSuccess(function () {
        Log::channel('schedule')->info('✅ Import commentaires réussi');
    })
    ->onFailure(function () {
        Log::channel('schedule')->error('❌ Échec import commentaires');
    });

// ============================================
// IMPORTS COMPLETS CSV
// ============================================

Schedule::command(ImportAllCsvData::class)
    ->name('import-all-csv')
    ->everyFifteenMinutes()
    ->withoutOverlapping(10)
    ->runInBackground();

/// fichier rejetes par covage
Schedule::command(ImportRejetes::class)
        ->name('import-rejetes')
        ->everyFiveMinutes()
        ->withoutOverlapping(5)
        ->runInBackground()
        ->onSuccess(function () {
            Log::channel('schedule')->info('✅ Import DOCKO (rejetes) réussi');
        })
        ->onFailure(function () {
            Log::channel('schedule')->error('❌ Échec import DOCKO (rejetes)');
        });

////annulation de commande

Schedule::command(ImportAnnulations::class)
    ->name('import-annulations')
    ->everyFiveMinutes()
    ->withoutOverlapping(5)
    ->runInBackground()
    ->onSuccess(function () {
        Log::channel('schedule')->info('✅ Import ANNULATION réussi');
    })
    ->onFailure(function () {
        Log::channel('schedule')->error('❌ Échec import ANNULATION');
    });



/// route optique 
Schedule::command(ImportRouteOptiques::class)
    ->name('import-routeoptiques')
    ->everyFiveMinutes()
    ->withoutOverlapping(5)
    ->runInBackground()
    ->onSuccess(function () {
        Log::channel('schedule')->info('✅ Import ROUTEOPTIQUE réussi');
    })
    ->onFailure(function () {
        Log::channel('schedule')->error('❌ Échec import ROUTEOPTIQUE');
    });


//// editplanidate 

Schedule::command(ImportEditplanifdate::class)
    ->name('import-editplanifdate')
    ->everyFiveMinutes()
    ->withoutOverlapping(5)
    ->runInBackground()
    ->onSuccess(fn() => Log::channel('schedule')->info('✅ Import EDITPLANIFDATE réussi'))
    ->onFailure(fn() => Log::channel('schedule')->error('❌ Échec import EDITPLANIFDATE')); 
// ============================================
// TÂCHES DE NETTOYAGE AVEC NOMS UNIQUES
// ============================================

// Nettoyage des anciennes versions
Schedule::call(function () {
    try {
        $deleted = \App\Models\VisiteTechnique::where('is_current_version', false)
            ->where('created_at', '<', now()->subMonths(6))
            ->delete();
        
        Log::channel('schedule')->info("🧹 Nettoyage anciennes versions VT: {$deleted} supprimées");
    } catch (\Exception $e) {
        Log::channel('schedule')->error("Erreur nettoyage versions: " . $e->getMessage());
    }
})
->name('clean-old-visite-versions')
->weekly()
->withoutOverlapping();

// Nettoyage des fichiers temporaires
Schedule::call(function () {
    try {
        $tempDir = storage_path('app/temp/');
        if (File::isDirectory($tempDir)) {
            $files = File::glob($tempDir . '*');
            $count = 0;
            foreach ($files as $file) {
                if (File::lastModified($file) < now()->subHour()->timestamp) {
                    if (is_dir($file)) {
                        File::deleteDirectory($file);
                    } else {
                        File::delete($file);
                    }
                    $count++;
                }
            }
            Log::channel('schedule')->info("🧹 Nettoyage fichiers temporaires: {$count} supprimés");
        }
    } catch (\Exception $e) {
        Log::channel('schedule')->error("Erreur nettoyage temp: " . $e->getMessage());
    }
})
->name('clean-temp-files')
->hourly()
->withoutOverlapping();

// Nettoyage des archives anciennes
Schedule::command('archives:clean --days=90')
    ->name('clean-old-archives')
    ->weekly()
    ->withoutOverlapping()
    ->appendOutputTo(storage_path('logs/archive-clean.log'));

// ============================================
// TÂCHES DE MAINTENANCE
// ============================================

// Vérification des connexions SFTP
Schedule::call(function () {
    try {
        $diskIn = Storage::disk('sftp_in');
        $diskOut = Storage::disk('sftp_out');
        
        $diskIn->files('/');
        $diskOut->files('/');
        
        Log::channel('schedule')->info('✅ Connexions SFTP OK');
    } catch (\Exception $e) {
        Log::channel('schedule')->error('❌ Problème connexion SFTP', [
            'error' => $e->getMessage()
        ]);
    }
})
->name('check-sftp-connections')
->everyFifteenMinutes()
->withoutOverlapping();

// ============================================
// TÂCHES SPÉCIFIQUES POUR ENVIRONNEMENT DE DÉVELOPPEMENT
// ============================================

if (app()->environment('local', 'staging')) {
    Schedule::command(ImportArchivedFiles::class . ' --show-details')
        ->name('import-archived-vt-details')
        ->everyMinute()
        ->withoutOverlapping()
        ->runInBackground();
    
    Schedule::command('log:clear')
        ->name('clear-logs')
        ->daily()
        ->withoutOverlapping();
}

// ============================================
// TÂCHES DE PRODUCTION
// ============================================

if (app()->environment('production')) {
    Schedule::command(ImportArchivedFiles::class . ' --force')
        ->name('import-archived-vt-force')
        ->dailyAt('03:00')
        ->withoutOverlapping()
        ->runInBackground();
    
    Schedule::call(function () {
        Log::channel('schedule')->info('💾 Backup des données effectué');
    })
    ->name('database-backup')
    ->weekly()
    ->withoutOverlapping();
}


Schedule::command(ImportAttenteClient::class)
    ->name('import-attente-client')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->runInBackground();
// ============================================
// LOG HEARTBEAT
// ============================================

Schedule::call(function () {
    if (now()->minute % 5 == 0) {
        Log::channel('schedule')->info('🔄 Scheduler actif', [
            'time' => now()->format('Y-m-d H:i:s')
        ]);
    }
})
->name('scheduler-heartbeat')
->everyMinute();
