<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class DockoResponse extends Model
{
    protected $table = 'docko_responses';

    protected $fillable = [
        'uuid',
        'rds',
        'bca',
	'admin_prefix',
	'admin_contract',
        'commande_type',
        'commande_id',
        'action_id',
        'action_type',
        'status',
        'fail_reason',
        'comment',
        'effective_date',
        'source_file',
        'imported_at',
        'is_read',
        'read_at',
    ];

    protected $casts = [
        'effective_date' => 'date',
        'imported_at' => 'datetime',
        'read_at' => 'datetime',
        'is_read' => 'boolean',
    ];

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

    public function commande()
    {
        if ($this->commande_type === 'vt') {
            return $this->belongsTo(VisiteTechnique::class, 'commande_id');
        }
        return $this->belongsTo(Raccordement::class, 'commande_id');
    }

    public function action()
    {
        if ($this->action_type === 'livraison_crvt') {
            return $this->belongsTo(VisiteTechniqueAction::class, 'action_id');
        }
        return $this->belongsTo(RaccordementAction::class, 'action_id');
    }

    public function getStatusLabelAttribute()
    {
        return $this->status === 'accepte' ? '✅ Accepté' : '❌ Refusé';
    }

    public function getTypeLabelAttribute()
    {
        return $this->commande_type === 'vt' ? 'Visite technique' : 'Raccordement';
    }

    public function markAsRead()
    {
        if (!$this->is_read) {
            $this->is_read = true;
            $this->read_at = now();
            $this->save();
        }
    }
}
