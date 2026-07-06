<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class VisiteTechnique extends Model
{
    protected $table = 'visite_techniques';
    
    public $timestamps = true;
    
    protected $fillable = [
        'uuid',
        'admin_rds',
        'admin_bca',
        'admin_contract',
        'project_name',
        'operator_name',
        'techno',
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
	 'one_shot_info',
    ];
    
    protected $casts = [
        'order_date' => 'date',
        'address_site_a_x' => 'decimal:6',
        'address_site_a_y' => 'decimal:6',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
	'one_shot_info' => 'boolean',
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
    
    /**
     * Relation HAS MANY avec les actions (CORRECTION IMPORTANTE)
     * Une visite peut avoir plusieurs actions
     */

public function annulation()
{
    return $this->hasOne(Annulation::class);
}

public function editPlanifDates()
{
    return $this->hasMany(EditPlanifDate::class);
}
    public function actions()
    {
        return $this->hasMany(VisiteTechniqueAction::class, 'visite_technique_id')
            ->orderBy('file_timestamp', 'desc');
    }
    
    /**
     * Récupère la dernière action (hasOne avec order)
     */
    public function lastAction()
    {
        return $this->hasOne(VisiteTechniqueAction::class, 'visite_technique_id')
            ->orderBy('file_timestamp', 'desc');
    }
    
    /**
     * Récupère la demande (première action)
     */
    public function demande()
    {
        return $this->hasOne(VisiteTechniqueAction::class, 'visite_technique_id')
            ->where('action_type', VisiteTechniqueAction::ACTION_DEMANDE);
    }
    
    /**
     * Récupère la planification
     */
    public function planification()
    {
        return $this->hasOne(VisiteTechniqueAction::class, 'visite_technique_id')
            ->where('action_type', VisiteTechniqueAction::ACTION_PLANIFICATION);
    }
    
    /**
     * Récupère l'impossibilité
     */
    public function impossibilite()
    {
        return $this->hasOne(VisiteTechniqueAction::class, 'visite_technique_id')
            ->where('action_type', VisiteTechniqueAction::ACTION_IMPOSSIBILITE);
    }
    
    /**
     * Récupère la livraison CRVT
     */
    public function livraisonCrvt()
    {
        return $this->hasOne(VisiteTechniqueAction::class, 'visite_technique_id')
            ->where('action_type', VisiteTechniqueAction::ACTION_LIVRAISON_CRVT);
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
     * Accesseur pour le statut actuel basé sur la dernière action
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
            VisiteTechniqueAction::ACTION_DEMANDE => ['code' => 'pending', 'label' => 'Demande reçue', 'color' => 'blue', 'icon' => '📥'],
            VisiteTechniqueAction::ACTION_PLANIFICATION => ['code' => 'planned', 'label' => 'Planifiée', 'color' => 'green', 'icon' => '📅'],
            VisiteTechniqueAction::ACTION_IMPOSSIBILITE => ['code' => 'impossible', 'label' => 'Impossible', 'color' => 'red', 'icon' => '⚠️'],
            VisiteTechniqueAction::ACTION_LIVRAISON_CRVT => ['code' => 'completed', 'label' => 'Terminée', 'color' => 'purple', 'icon' => '✅'],
        ];
        
        return $statusMap[$lastAction->action_type] ?? [
            'code' => 'unknown',
            'label' => 'Inconnu',
            'color' => 'gray',
            'icon' => '❓'
        ];
    }
    
    /**
     * Récupère toutes les actions groupées par type
     */
    public function getActionsByTypeAttribute()
    {
        return [
            'demande' => $this->actions->where('action_type', VisiteTechniqueAction::ACTION_DEMANDE),
            'planification' => $this->actions->where('action_type', VisiteTechniqueAction::ACTION_PLANIFICATION),
            'impossibilite' => $this->actions->where('action_type', VisiteTechniqueAction::ACTION_IMPOSSIBILITE),
            'livraison_crvt' => $this->actions->where('action_type', VisiteTechniqueAction::ACTION_LIVRAISON_CRVT),
        ];
    }
public function routeOptiques()
{
    return $this->hasMany(RouteOptique::class, 'visite_technique_id');
}
}
