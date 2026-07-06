<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: sans-serif; background: #f4f4f4; padding: 20px; }
        .container { max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 8px; }
        h1 { color: #333; }
        .info { margin: 20px 0; }
        .footer { margin-top: 20px; font-size: 12px; color: #888; }
    </style>
</head>
<body>
<div class="container">
    <h1>
        @if($type === 'vt')
            📥 Nouvelle demande de visite technique
        @else
            🔌 Nouvelle demande de raccordement
        @endif
    </h1>
    <p>Un nouveau fichier a été déposé par Covage.</p>
    <div class="info">
        <p><strong>Fichier :</strong> {{ $filename }}</p>
        <p><strong>RDS :</strong> {{ $rds }}</p>
        <p><strong>BCA :</strong> {{ $bca }}</p>
        <p><strong>Date :</strong> {{ $date }}</p>
    </div>
    <p>Connectez-vous à l’application pour traiter cette demande.</p>
    <div class="footer">Email automatique – ne pas répondre</div>
</div>
</body>
</html>
