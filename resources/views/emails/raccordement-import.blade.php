<x-mail::message>
# 🔌 {{ $title }}

Bonjour,

Un ou plusieurs fichiers de raccordements ont été importés.

**Type d'import :** {{ $type }}

**Fichiers concernés :**
@foreach($files as $file)
- {{ $file }}
@endforeach

<x-mail::button :url="config('app.url').'/raccordements'">
Voir les raccordements
</x-mail::button>

Merci de votre attention.

Cordialement,<br>
L'équipe technique
</x-mail::message>
