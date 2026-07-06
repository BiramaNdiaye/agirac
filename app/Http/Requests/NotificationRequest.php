<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class NotificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // L’authentification HMAC a déjà eu lieu
    }

    public function rules(): array
    {
        return [
            'eventId'     => 'required|string',
            'eventType'   => 'required|string',
            'eventTime' => 'required|date_format:Y-m-d\TH:i:s.v\Z',
            'resource'    => 'required|array',
            // Ajoutez d’autres champs selon la spécification TMF 697
        ];
    }

    public function messages(): array
    {
        return [
            'eventId.required' => 'Le champ eventId est obligatoire',
        ];
    }

    protected function prepareForValidation()
{
    // Convertir "2026-04-14T10:00:00.000Z" en "2026-04-14T10:00:00.000000+00:00"
    if ($this->has('eventTime')) {
        $eventTime = $this->get('eventTime');
        // Remplacer Z par +00:00
        $eventTime = str_replace('Z', '+00:00', $eventTime);
        // Si il y a 3 chiffres de millisecondes, passer à 6 chiffres
        if (preg_match('/\.(\d{3})\+00:00$/', $eventTime, $matches)) {
            $eventTime = str_replace($matches[1], str_pad($matches[1], 6, '0', STR_PAD_RIGHT), $eventTime);
        }
        $this->merge(['eventTime' => $eventTime]);
    }
}
}