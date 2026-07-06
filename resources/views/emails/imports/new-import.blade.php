<x-mail::message>
# Nouveau(x) fichier(s) importé(s)

Bonjour,

Un ou plusieurs fichiers ont été récemment importés via le système.

**Type d'import :** {{ $type }}

**Fichiers concernés :**
@foreach($files as $file)
- {{ $file }}
@endforeach

<x-mail::button :url="config('app.url')">
Voir le tableau de bord
</x-mail::button>

Merci de votre attention.

Cordialement,<br>
L'équipe technique
</x-mail::message>
