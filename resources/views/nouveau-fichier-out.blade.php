{{-- resources/views/emails/nouveau-fichier-out.blade.php --}}

<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body  { font-family: Arial, sans-serif; color: #333; }
        .box  { background: #f4f4f4; border-left: 4px solid #4CAF50; padding: 16px; margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        td    { padding: 8px 12px; border-bottom: 1px solid #ddd; }
        td:first-child { font-weight: bold; color: #555; width: 160px; }
    </style>
</head>
<body>
    <h2>📂 Nouveau fichier détecté dans /OUT (SFTP)</h2>

    <div class="box">
        <table>
            <tr><td>Nom du fichier</td><td>{{ $fileInfo['filename'] }}</td></tr>
            <tr><td>Extension</td><td>{{ strtoupper($fileInfo['extension'] ?: '—') }}</td></tr>
            <tr><td>Taille</td><td>{{ number_format($fileInfo['size'] / 1024, 2) }} Ko</td></tr>
            <tr><td>Modifié le</td><td>{{ $fileInfo['modified_at'] }}</td></tr>
            <tr><td>Chemin SFTP</td><td>{{ $fileInfo['path'] }}</td></tr>
        </table>
    </div>

    <p style="color:#888; font-size:12px;">
        Notification automatique — surveillance SFTP /OUT
    </p>
</body>
</html>
