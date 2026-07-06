<?php
// app/Models/FichierImporte.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FichierImporte extends Model
{
    protected $fillable = [
        'nom_fichier', 'prefixe', 'type_fichier', 'reference', 
        'chemin_stockage', 'chemin_zip', 'nom_zip', 'contenu_brut', 
        'donnees_extraites', 'date_fichier', 'hash_fichier', 
        'taille_fichier', 'commande_id', 'statut_traitement', 'erreur_message'
    ];
    
    protected $casts = [
        'contenu_brut' => 'array',
        'donnees_extraites' => 'array',
        'date_fichier' => 'datetime'
    ];
    
    public function commande()
    {
        return $this->belongsTo(Commande::class);
    }
}
