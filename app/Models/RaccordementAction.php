<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RaccordementAction extends Model
{
    protected $table = 'raccordement_actions';
    
    public $timestamps = true;
    
    protected $fillable = [
        'raccordement_id',
        'action_type',
        'prefix',
        'source_file',
        'source',
        'file_date',
        'file_time',
        'file_timestamp',
        'imported_at',
        
        // Planification
        'planning_date',
        'planning_comment',
        
        // Impossibilité
        'impossibility_fail_reason',
        'impossibility_comment',
        
        // CR Client
        'cr_effective_date',
        'cr_comment',
        'cr_result_status',
        'cr_infra_to_be_created',
        'cr_submission_date',
        'cr_doc_path',
        
        // DOE
        'doe_delivery_date',
        'doe_comment',
        'doe_file_path',
        'doe_cable_shape_file',
        'doe_pmv_closure_file',
        'doe_gc_length',
        'doe_ml_length_extension',
        'doe_ml_length_private',
        'doe_ml_length_public',
        
        // DFT
        'dft_delivery_date',
        'dft_comment',
        'dft_supply_file_path',
        'dft_supply_dft_file_path',
        
        // Communs
        'bandwidth',
        'nro_name',
        'nro_port',
        'bpe_piquage',
        'building_code',
        'equipement_number',
        'mer_number',
        'insee_code',
        'article_designation',
        
        'raw_data'
    ];
    
    protected $casts = [
        'file_date' => 'date',
        'planning_date' => 'date',
        'cr_effective_date' => 'date',
        'cr_submission_date' => 'date',
        'doe_delivery_date' => 'date',
        'dft_delivery_date' => 'date',
        'cr_infra_to_be_created' => 'boolean',
        'imported_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'doe_gc_length' => 'decimal:3',
        'doe_ml_length_extension' => 'decimal:3',
        'doe_ml_length_private' => 'decimal:3',
        'doe_ml_length_public' => 'decimal:3',
        'raw_data' => 'array'
    ];
    
    // Constantes pour les types d'actions
    const ACTION_PLANIFICATION = 'planification';
    const ACTION_IMPOSSIBILITE = 'impossibilite';
    const ACTION_LIVRAISON_CR = 'livraison_cr';
    const ACTION_LIVRAISON_DOE = 'livraison_doe';
    const ACTION_LIVRAISON_DFT = 'livraison_dft';
    const ACTION_MODIFICATION_DATE = 'modification_date';
    const ACTION_ROUTE_OPTIQUE = 'route_optique';

    // Mapping des préfixes
    public static $prefixMapping = [
        'PLANIFRACCODATE' => self::ACTION_PLANIFICATION,
        'PLANIFRACCODATEKO' => self::ACTION_IMPOSSIBILITE,
        'CRIDOCCLI' => self::ACTION_LIVRAISON_CR,
        'DOEDOC' => self::ACTION_LIVRAISON_DOE,
        'DFTDOC' => self::ACTION_LIVRAISON_DFT,
        'EDITPLANIFDATE' => self::ACTION_MODIFICATION_DATE,
        'ROUTEOPTIQUE' => self::ACTION_ROUTE_OPTIQUE,
    ];
    
    // Libellés des actions
    public static $actionLabels = [
        self::ACTION_PLANIFICATION => 'Planification du raccordement',
        self::ACTION_IMPOSSIBILITE => 'Impossibilité de raccordement',
        self::ACTION_LIVRAISON_CR => 'Livraison CR Client',
        self::ACTION_LIVRAISON_DOE => 'Livraison DOE',
        self::ACTION_LIVRAISON_DFT => 'Livraison DFT',
        self::ACTION_MODIFICATION_DATE => 'Modification de date',
        self::ACTION_ROUTE_OPTIQUE => 'Route Optique',
    ];
    
    // Icônes
    public static $actionIcons = [
        self::ACTION_PLANIFICATION => '📅',
        self::ACTION_IMPOSSIBILITE => '⚠️',
        self::ACTION_LIVRAISON_CR => '📋',
        self::ACTION_LIVRAISON_DOE => '📄',
        self::ACTION_LIVRAISON_DFT => '🔧',
        self::ACTION_MODIFICATION_DATE => '✏️', 
        self::ACTION_ROUTE_OPTIQUE => '✏️', 
    ];
    
    // Couleurs
    public static $actionColors = [
        self::ACTION_PLANIFICATION => 'green',
        self::ACTION_IMPOSSIBILITE => 'red',
        self::ACTION_LIVRAISON_CR => 'blue',
        self::ACTION_LIVRAISON_DOE => 'purple',
        self::ACTION_LIVRAISON_DFT => 'orange',
         self::ACTION_MODIFICATION_DATE => 'amber',
         self::ACTION_ROUTE_OPTIQUE  => 'gold',
    ];
    
    /**
     * Relation inverse avec le raccordement
     */
    public function raccordement()
    {
        return $this->belongsTo(Raccordement::class, 'raccordement_id');
    }
    
    /**
     * Accesseur pour le libellé
     */
    public function getLabelAttribute()
    {
        return self::$actionLabels[$this->action_type] ?? $this->action_type;
    }
    
    /**
     * Accesseur pour l'icône
     */
    public function getIconAttribute()
    {
        return self::$actionIcons[$this->action_type] ?? '📌';
    }
    
    /**
     * Accesseur pour la couleur
     */
    public function getColorAttribute()
    {
        return self::$actionColors[$this->action_type] ?? 'gray';
    }
    
    /**
     * Accesseur pour la date formatée
     */
    public function getFormattedDateAttribute()
    {
        return match($this->action_type) {
            self::ACTION_PLANIFICATION => $this->planning_date?->format('d/m/Y'),
            self::ACTION_LIVRAISON_CR => $this->cr_effective_date?->format('d/m/Y'),
            self::ACTION_LIVRAISON_DOE => $this->doe_delivery_date?->format('d/m/Y'),
            self::ACTION_LIVRAISON_DFT => $this->dft_delivery_date?->format('d/m/Y'),
            default => $this->file_date?->format('d/m/Y'),
        };
    }
    
    /**
     * Accesseur pour les données spécifiques
     */
    public function getSpecificDataAttribute()
    {
        return match($this->action_type) {
            self::ACTION_PLANIFICATION => [
                'planning_date' => $this->planning_date?->format('d/m/Y'),
                'comment' => $this->planning_comment,
            ],
            self::ACTION_IMPOSSIBILITE => [
                'fail_reason' => $this->impossibility_fail_reason,
                'comment' => $this->impossibility_comment,
            ],
            self::ACTION_LIVRAISON_CR => [
                'effective_date' => $this->cr_effective_date?->format('d/m/Y'),
                'comment' => $this->cr_comment,
                'result_status' => $this->cr_result_status,
                'infra_to_be_created' => $this->cr_infra_to_be_created,
                'submission_date' => $this->cr_submission_date?->format('d/m/Y'),
                'doc_path' => $this->cr_doc_path,
            ],
            self::ACTION_LIVRAISON_DOE => [
                'delivery_date' => $this->doe_delivery_date?->format('d/m/Y'),
                'comment' => $this->doe_comment,
                'gc_length' => $this->doe_gc_length,
                'ml_length_extension' => $this->doe_ml_length_extension,
                'ml_length_private' => $this->doe_ml_length_private,
                'ml_length_public' => $this->doe_ml_length_public,
                'has_files' => !empty($this->doe_file_path) || !empty($this->doe_cable_shape_file),
            ],
            self::ACTION_LIVRAISON_DFT => [
                'delivery_date' => $this->dft_delivery_date?->format('d/m/Y'),
                'comment' => $this->dft_comment,
                'has_files' => !empty($this->dft_supply_file_path) || !empty($this->dft_supply_dft_file_path),
            ],
            self::ACTION_MODIFICATION_DATE => [
            'planning_date' => $this->planning_date?->format('d/m/Y'),
            'comment' => $this->planning_comment,
             ],

             self::ACTION_ROUTE_OPTIQUE => [
                'delivery_date' => $this->dft_delivery_date?->format('d/m/Y'),
                'comment' => $this->dft_comment,
                'has_files' => !empty($this->dft_supply_file_path) || !empty($this->dft_supply_dft_file_path),
            ],
            default => []
        };
    }
}
