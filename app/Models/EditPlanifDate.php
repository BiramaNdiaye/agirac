<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EditPlanifDate extends Model
{
    protected $table = 'edit_planif_dates';

    protected $fillable = [
        'admin_rds',
        'admin_bca',
        'planning_date',
        'admin_contract',
        'admin_prefix',
        'visite_technique_id',
        'raccordement_id',
        'source_file',
        'source_prefix',
        'imported_at',
        'file_date',
        'file_time',
        'file_timestamp',
        'is_current_version',
        'edit_zip_path',
    ];

    protected $casts = [
        'planning_date' => 'date',
        'imported_at' => 'datetime',
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
