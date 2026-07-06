<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class AttenteClient extends Model
{
    protected $table = 'attente_client';

    protected $fillable = [
        'uuid',
        'admin_rds',
        'admin_bca',
        'admin_contract',
        'admin_prefix',
        'project_name',
        'operator_name',
        'begin_client_wait',
        'client_wait_end',
        'comment',
        'source_file',
        'source_prefix',
        'imported_at','replanned'
    ];

    protected $casts = [
        'begin_client_wait' => 'date',
        'client_wait_end' => 'date',
        'imported_at' => 'datetime',
    ];

public function getCommandeLink()
{
    // Chercher d'abord dans les visites techniques
    $vt = VisiteTechnique::where('admin_rds', $this->admin_rds)
        ->where('admin_bca', $this->admin_bca)
        ->first();
    if ($vt) {
        return route('visites-techniques.show', $vt->id) . '?tab=comments';
    }
    // Sinon dans les raccordements
    $racco = Raccordement::where('admin_rds', $this->admin_rds)
        ->where('admin_bca', $this->admin_bca)
        ->first();
    if ($racco) {
        return route('raccordements.show', $racco->id) . '?tab=comments';
    }
    return null;
}
    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
            if (empty($model->imported_at)) {
                $model->imported_at = now();
            }
        });
    }

    // Relation optionnelle avec la commande parente (VT ou raccordement) via RDS/BCA ?
    // Pas de clé étrangère directe, mais on peut définir un accesseur
}
