#!/bin/bash

# Configuration
WATCH_DIR="/var/www/Agirac/storage/app/archives"
LOG_FILE="/var/www/Agirac/storage/logs/surveillance.log"
EMAIL_TO="birama.ndiaye@tstconnect.fr"   # Remplacez par votre email
LAST_STATE_FILE="/tmp/archives_last_state.txt"

# Fonction pour envoyer une notification (email + log)
notify() {
    local filename="$1"
    local fullpath="$2"
    local date=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Log local
    echo "$date - Nouveau fichier détecté : $filename" >> "$LOG_FILE"
    
    # Envoi d'email (nécessite mailutils installé)
    echo "Un nouveau fichier a été récupéré dans archives : $filename
Chemin : $fullpath
Date : $date" | mail -s "[Covage] Nouveau fichier VT/RACCO" "$EMAIL_TO"
    
    # Optionnel : notification système (si interface graphique)
    # notify-send "Covage" "Nouveau fichier : $filename"
}

# Vérifier que le dossier existe
if [ ! -d "$WATCH_DIR" ]; then
    echo "Erreur : le dossier $WATCH_DIR n'existe pas."
    exit 1
fi

# Utiliser inotifywait pour surveiller les événements 'create' et 'move'
inotifywait -m -r -e create -e moved_to --format '%w%f' "$WATCH_DIR" | while read NEWFILE
do
    # Ignorer les fichiers temporaires ou les dossiers
    if [[ -f "$NEWFILE" && ( "$NEWFILE" =~ \.zip$ || "$NEWFILE" =~ \.csv$ ) ]]; then
        filename=$(basename "$NEWFILE")
        # Vérifier si le fichier n'a pas déjà été traité (éviter les doublons)
        if ! grep -q "$filename" "$LAST_STATE_FILE" 2>/dev/null; then
            notify "$filename" "$NEWFILE"
            echo "$filename" >> "$LAST_STATE_FILE"
        fi
    fi
done
