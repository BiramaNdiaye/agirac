<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ErrorFile extends Model
{
    protected $table = 'error_files';

    protected $fillable = [
        'filename', 'original_path', 'error_message', 'csv_headers', 'csv_rows', 'files_list', 'processed', 'processed_at'
    ];

    protected $casts = [
        'csv_headers' => 'array',
        'csv_rows' => 'array',
        'files_list' => 'array',
        'processed_at' => 'datetime',
    ];
}
