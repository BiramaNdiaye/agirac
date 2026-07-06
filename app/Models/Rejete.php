<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rejete extends Model
{
    protected $table = 'rejetes';

    protected $fillable = [
        'admin_rds',
        'admin_bca',
        'admin_contract',
        'admin_prefix',
        'fail_reason',
        'source_file',
        'source_prefix',
        'imported_at',
        'file_date',
        'file_time',
        'file_timestamp',
        'is_current_version',
    ];

    // Si vous voulez des constantes de statut (optionnel)
    // const STATUS_ACTIVE = 1;
}
