<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Annulation extends Model
{
    protected $table = 'annulations';

    protected $fillable = [
        'admin_rds',
        'admin_bca',
        'admin_contract',
        'admin_prefix',
        'cancellation_date',
        'fail_reason',
        'source_file',
        'source_prefix',
        'imported_at',
        'file_date',
        'file_time',
        'file_timestamp',
 'visite_technique_id',
    'raccordement_id',
        'is_current_version',
    ];

    // Éventuellement des casts
    protected $casts = [
        'cancellation_date' => 'date',
        'file_timestamp' => 'integer',
        'is_current_version' => 'boolean',
    ];

public function visiteTechnique()
{
    return $this->belongsTo(VisiteTechnique::class);
}

public function raccordement()
{
    return $this->belongsTo(Raccordement::class);
}
}
