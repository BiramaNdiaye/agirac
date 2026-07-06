<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\AttenteClient;
use App\Models\VisiteTechnique;
use App\Models\Raccordement;
use App\Models\Notification;
use Carbon\Carbon;

class CheckExpiredWaitingPeriods extends Command
{
    protected $signature = 'attente:check-expired';
    protected $description = 'Vérifie les périodes d\'attente client arrivées à terme et relance la planification';

    public function handle()
    {
        $today = Carbon::today();

        $expiredPeriods = AttenteClient::where('client_wait_end', '<=', $today)
            ->where('replanned', false)
            ->get();

        if ($expiredPeriods->isEmpty()) {
            $this->info('Aucune période d\'attente expirée à traiter.');
            return 0;
        }

        foreach ($expiredPeriods as $period) {
            // Marquer comme relancé pour éviter les doublons
            $period->replanned = true;
            $period->save();

            // Récupérer la commande associée (VT ou raccordement)
            // On cherche d'abord dans visite_techniques
            $commande = VisiteTechnique::where('admin_rds', $period->admin_rds)
                ->where('admin_bca', $period->admin_bca)
                ->first();

            $type = 'vt';
            if (!$commande) {
                $commande = Raccordement::where('admin_rds', $period->admin_rds)
                    ->where('admin_bca', $period->admin_bca)
                    ->first();
                $type = 'raccordement';
            }

            if (!$commande) {
                $this->warn("Commande introuvable pour RDS {$period->admin_rds} / BCA {$period->admin_bca}");
                continue;
            }

            // Créer une notification pour l'utilisateur
            Notification::create([
                'type'    => 'attente_expiree',
                'title'   => 'Fin de période d\'attente client',
                'message' => "La période d'attente pour la commande {$period->admin_rds} - {$period->admin_bca} est terminée. Veuillez relancer la planification.",
                'link'    => $type === 'vt' ? route('visites-techniques.show', $commande->id) : route('raccordements.show', $commande->id),
            ]);

            // Optionnel : créer automatiquement une action de planification (exemple pour VT)
            // Pour ne pas le faire automatiquement, commentez ce bloc.
            if ($type === 'vt') {
                // Vérifier si une action de planification n'existe pas déjà récemment
                $lastPlanning = $commande->actions()
                    ->where('action_type', 'planification')
                    ->latest()
                    ->first();
                if (!$lastPlanning || $lastPlanning->created_at->diffInDays(now()) > 1) {
                    // Créer une action "planification" sans date (ou avec une date à définir)
                    // Ici on simule juste un commentaire
                    $commande->actions()->create([
                        'action_type' => 'planification',
                        'prefix' => 'PLANIFVTDATE',
                        'source' => 'auto',
                        'comment' => 'Relance automatique après fin d\'attente client',
                        'imported_at' => now(),
                    ]);
                    $this->info("Action de planification automatique créée pour VT {$commande->admin_rds} - {$commande->admin_bca}");
                }
            }
        }

        $this->info("{$expiredPeriods->count()} période(s) d'attente traitée(s).");
        return 0;
    }
}
