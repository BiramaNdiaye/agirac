<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

use Illuminate\Database\Eloquent\Model;

class HubSubscription extends Model
{
    use HasUuids;

// app/Models/HubSubscription.php
protected $fillable = ['hub_id', 'callback_url', 'secret', 'filters', 'status', 'expires_at'];
protected $casts = ['filters' => 'array', 'expires_at' => 'datetime'];
}
