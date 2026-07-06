<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Commentaire extends Model
{
    protected $table = 'commentaires';
    
    public $timestamps = true;
    
    protected $fillable = [
        'uuid',
        'type_document',
        'prefix',
        'source_file',
        'source',
        'file_date',
        'file_time',
        'file_timestamp',
        'rds',
        'bca',
        'commande_type',
        'commande_id',
        'auteur',
        'contenu',
        'type_commentaire',
        'est_reponse',
        'reponse_a_id',
        'lu',
        'lu_at',
        'fichiers_joints',
        'raw_data',
        'imported_at'
    ];
    
    protected $casts = [
        'file_date' => 'date',
        'file_time' => 'datetime',
        'est_reponse' => 'boolean',
        'lu' => 'boolean',
        'lu_at' => 'datetime',
        'fichiers_joints' => 'array',
        'raw_data' => 'array',
        'imported_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
    
    // Constantes pour les types de documents
    const TYPE_DOCUMENT_COMMENT = 'COMMENT';
    const TYPE_DOCUMENT_REPONSE = 'REPONSE_COMMENT';
    
    // Constantes pour les types de commandes
    const COMMANDE_VT = 'visite_technique';
    const COMMANDE_RACCORDEMENT = 'raccordement';
    
    // Constantes pour les types de commentaires (CORRECTION: éviter les doublons)
    const TYPE_INFO = 'info';
    const TYPE_QUESTION = 'question';
    const TYPE_REPONSE_COMMENTAIRE = 'reponse';  // ← Renommé pour éviter conflit
    const TYPE_CONFIRMATION = 'confirmation';
    
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
            if (empty($model->imported_at)) {
                $model->imported_at = now();
            }
        });
    }

public function markAsRead()
{
    $this->lu_at = now();
    $this->save();
}    
    public function commande()
    {
        if ($this->commande_type === self::COMMANDE_VT) {
            return $this->belongsTo(VisiteTechnique::class, 'commande_id');
        }
        return $this->belongsTo(Raccordement::class, 'commande_id');
    }
    
    public function reponses()
    {
        return $this->hasMany(Commentaire::class, 'reponse_a_id')->orderBy('created_at', 'asc');
    }
    
    public function reponseA()
    {
        return $this->belongsTo(Commentaire::class, 'reponse_a_id');
    }
    
    public function marquerCommeLu()
    {
        $this->update(['lu' => true, 'lu_at' => now()]);
    }
    
    public function getTypeLabelAttribute()
    {
        $labels = [
            self::TYPE_INFO => 'ℹ️ Information',
            self::TYPE_QUESTION => '❓ Question',
            self::TYPE_REPONSE_COMMENTAIRE => '📝 Réponse',
            self::TYPE_CONFIRMATION => '✅ Confirmation',
        ];
        return $labels[$this->type_commentaire] ?? $this->type_commentaire;
    }
    
    public function getSourceLabelAttribute()
    {
        if ($this->source === 'IN') {
            return '📤 Envoyé (notre app)';
        } elseif ($this->source === 'OUT') {
            return '📥 Reçu (Covage)';
        }
        return $this->source ?? 'ARCHIVE';
    }
    
    public function getDocumentTypeLabelAttribute()
    {
        if ($this->type_document === self::TYPE_DOCUMENT_COMMENT) {
            return 'Commentaire';
        }
        return 'Réponse au commentaire';
    }
}
