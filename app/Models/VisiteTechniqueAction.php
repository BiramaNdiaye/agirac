<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VisiteTechniqueAction extends Model
{
    protected $table = 'visite_technique_actions';
    
    public $timestamps = false;
    
    protected $fillable = [
        'visite_technique_id',
        'action_type',
        'prefix',
        'source_file',
        'source',
        'file_date',
        'file_time',
        'file_timestamp',
        'demande_comment',
        'planning_date',
        'planning_comment',
        'impossibility_fail_reason',
        'impossibility_comment',
        'crvt_effective_date',
        'crvt_comment',
        'crvt_infra_to_be_created',
        'crvt_result_status',
        'crvt_submission_date',
        'crvt_doc',
        'raw_data',
	'crvt_ko_status', 'crvt_ko_effective_date', 'crvt_ko_comment', 'crvt_ko_fail_reason',
        'imported_at'
    ];
    
    protected $casts = [
        'file_date' => 'date',
        'file_time' => 'datetime',
        'planning_date' => 'date',
        'crvt_effective_date' => 'date',
        'crvt_submission_date' => 'date',
        'crvt_infra_to_be_created' => 'boolean',
        'imported_at' => 'datetime',
        'raw_data' => 'array'
    ];
    
    // Constantes pour les types d'actions
    const ACTION_DEMANDE = 'demande';
    const ACTION_PLANIFICATION = 'planification';
    const ACTION_IMPOSSIBILITE = 'impossibilite';
    const ACTION_LIVRAISON_CRVT = 'livraison_crvt';
    const ACTION_CRVT_RECU = 'crvt_recu';
    const ACTION_MODIFICATION_DATE = 'modification_date';

    // Mapping des préfixes
    public static $prefixMapping = [
        'OTPLANIFVTDATE' => self::ACTION_DEMANDE,
        'PLANIFVTDATE' => self::ACTION_PLANIFICATION,
        'PLANIFDATEVTKO' => self::ACTION_IMPOSSIBILITE,
        'CRVTCLI' => self::ACTION_LIVRAISON_CRVT,
	'DOCKO' => self::ACTION_CRVT_RECU, 
    'EDITPLANIFDATE' => self::ACTION_MODIFICATION_DATE,
    ];
    
    // Libellés des actions
    public static $actionLabels = [
        self::ACTION_DEMANDE => 'Demande de visite technique',
        self::ACTION_PLANIFICATION => 'Planification de visite technique',
        self::ACTION_IMPOSSIBILITE => 'Impossibilité de visite technique',
        self::ACTION_LIVRAISON_CRVT => 'Livraison CRVT',
	 self::ACTION_CRVT_RECU => 'CRVT reçu de Covage',
      self::ACTION_MODIFICATION_DATE => 'Modification de date',
    ];
    
    // Icônes des actions
    public static $actionIcons = [
        self::ACTION_DEMANDE => '📥',
        self::ACTION_PLANIFICATION => '📅',
        self::ACTION_IMPOSSIBILITE => '⚠️',
        self::ACTION_LIVRAISON_CRVT => '✅',
	 self::ACTION_CRVT_RECU => '📋',
     self::ACTION_MODIFICATION_DATE => '✏️', 
    ];
    
    // Couleurs des actions
    public static $actionColors = [
        self::ACTION_DEMANDE => 'blue',
        self::ACTION_PLANIFICATION => 'green',
        self::ACTION_IMPOSSIBILITE => 'red',
        self::ACTION_LIVRAISON_CRVT => 'purple',
        self::ACTION_CRVT_RECU => 'cyan',
         self::ACTION_MODIFICATION_DATE => 'amber',
    ];
    
    /**
     * Relation inverse avec la visite technique
     */
    public function visiteTechnique()
    {
        return $this->belongsTo(VisiteTechnique::class, 'visite_technique_id');
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
     * Accesseur pour les données spécifiques
     */
    public function getSpecificDataAttribute()
    {
        return match($this->action_type) {
            self::ACTION_DEMANDE => [
                'comment' => $this->demande_comment,
            ],
            self::ACTION_PLANIFICATION => [
                'planning_date' => $this->planning_date?->format('d/m/Y'),
                'comment' => $this->planning_comment,
            ],
            self::ACTION_IMPOSSIBILITE => [
                'fail_reason' => $this->impossibility_fail_reason,
                'comment' => $this->impossibility_comment,
            ],
            self::ACTION_LIVRAISON_CRVT => [
                'effective_date' => $this->crvt_effective_date?->format('d/m/Y'),
                'comment' => $this->crvt_comment,
                'infra_to_be_created' => $this->crvt_infra_to_be_created,
                'result_status' => $this->crvt_result_status,
                'submission_date' => $this->crvt_submission_date?->format('d/m/Y'),
                'doc' => $this->crvt_doc,
            ],
            self::ACTION_MODIFICATION_DATE => [
            'planning_date' => $this->planning_date?->format('d/m/Y'),
            'comment' => $this->planning_comment,
        ],
            default => []
        };
    }
    
    /**
     * Accesseur pour la date formatée
     */
    public function getFormattedDateAttribute()
    {
        return $this->file_date?->format('d/m/Y') ?? '-';
    }
}
