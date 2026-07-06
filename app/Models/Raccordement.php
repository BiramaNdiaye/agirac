<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Carbon\Carbon;

class Raccordement extends Model
{
    protected $table = 'raccordements';
    
    public $timestamps = true;
    
    protected $fillable = [
        'uuid',
        'admin_rds',
        'admin_bca',
        'admin_contract',
        'admin_prefix',
        'project_name',
        'operator_name',
        'techno',
        'bandwith',
        'network',
        'offer',
        'address_site_a_name',
        'address_site_a_street',
        'address_site_a_postal',
        'address_site_a_town',
        'address_site_a_x',
        'address_site_a_y',
        'contact_on_site_firstname',
        'contact_on_site_lastname',
        'contact_on_site_phone',
        'contact_on_site_mail',
        'covage_contact_name',
        'client_directive_access',
        'client_directive_intervention',
        'client_directive_planning',
        'order_date',
        'begin_client_wait',
        'client_wait_end',
        'nro_name',
        'nro_port',
        'bpe_piquage',
        'building_code',
        'equipement_number',
        'mer_number',
        'insee_code',
        'article_designation',
        'comment',
        'fail_reason'
    ];
    
    protected $casts = [
        'order_date' => 'date',
        'begin_client_wait' => 'date',
        'client_wait_end' => 'date',
        'address_site_a_x' => 'decimal:6',
        'address_site_a_y' => 'decimal:6',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
    
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }
public function routeOptiques()
{
    return $this->hasMany(RouteOptique::class, 'raccordement_id');
}

public function annulation()
{
    return $this->hasOne(Annulation::class);
}
    
public function editPlanifDates()
{
    return $this->hasMany(EditPlanifDate::class);
}
    /**
     * Relation avec les actions
     */
    public function actions()
    {
        return $this->hasMany(RaccordementAction::class, 'raccordement_id')
            ->orderBy('file_timestamp', 'desc');
    }
    
    /**
     * Dernière action
     */
    public function lastAction()
    {
        return $this->hasOne(RaccordementAction::class, 'raccordement_id')
            ->orderBy('file_timestamp', 'desc');
    }
    
    /**
     * Accesseur pour l'adresse complète
     */
    public function getFullAddressAttribute()
    {
        $parts = [];
        if ($this->address_site_a_name) $parts[] = $this->address_site_a_name;
        if ($this->address_site_a_street) $parts[] = $this->address_site_a_street;
        if ($this->address_site_a_postal || $this->address_site_a_town) {
            $parts[] = trim($this->address_site_a_postal . ' ' . $this->address_site_a_town);
        }
        return implode(', ', $parts);
    }
    
    /**
     * Accesseur pour le nom complet du contact
     */
    public function getContactFullNameAttribute()
    {
        return trim($this->contact_on_site_firstname . ' ' . $this->contact_on_site_lastname);
    }
    
    /**
     * Accesseur pour la date formatée (sécurisé)
     */
    public function getFormattedOrderDateAttribute()
    {
        if (!$this->order_date) return '-';
        if ($this->order_date instanceof Carbon) {
            return $this->order_date->format('d/m/Y');
        }
        return date('d/m/Y', strtotime($this->order_date));
    }
    
    public function getFormattedBeginClientWaitAttribute()
    {
        if (!$this->begin_client_wait) return '-';
        if ($this->begin_client_wait instanceof Carbon) {
            return $this->begin_client_wait->format('d/m/Y');
        }
        return date('d/m/Y', strtotime($this->begin_client_wait));
    }
    
    public function getFormattedClientWaitEndAttribute()
    {
        if (!$this->client_wait_end) return '-';
        if ($this->client_wait_end instanceof Carbon) {
            return $this->client_wait_end->format('d/m/Y');
        }
        return date('d/m/Y', strtotime($this->client_wait_end));
    }
    
    /**
     * Accesseur pour le statut actuel
     */
    public function getCurrentStatusAttribute()
    {
        $lastAction = $this->lastAction;
        
        if (!$lastAction) {
            return [
                'code' => 'pending',
                'label' => 'En attente',
                'color' => 'gray',
                'icon' => '⏳'
            ];
        }
        
        $statusMap = [
            'planification' => ['code' => 'planned', 'label' => 'Planifié', 'color' => 'green', 'icon' => '📅'],
            'impossibilite' => ['code' => 'impossible', 'label' => 'Impossible', 'color' => 'red', 'icon' => '⚠️'],
            'livraison_cr' => ['code' => 'cr_delivered', 'label' => 'CR Livré', 'color' => 'blue', 'icon' => '📋'],
            'livraison_doe' => ['code' => 'doe_delivered', 'label' => 'DOE Livré', 'color' => 'purple', 'icon' => '📄'],
            'livraison_dft' => ['code' => 'dft_delivered', 'label' => 'DFT Livré', 'color' => 'orange', 'icon' => '🔧'],
        ];
        
        return $statusMap[$lastAction->action_type] ?? [
            'code' => 'unknown',
            'label' => 'Inconnu',
            'color' => 'gray',
            'icon' => '❓'
        ];
    }
}
