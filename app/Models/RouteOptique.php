<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RouteOptique extends Model
{
    protected $table = 'route_optiques';

    protected $fillable = [
        'admin_rds',
        'admin_bca',
        'admin_contract',
        'admin_prefix',
        'source_file',
        'source_prefix',
	'rop_zip_path', 
        'imported_at',
        'file_date',
        'file_time',
        'file_timestamp',
        'is_current_version',
    ];

    protected $casts = [
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
