<?php

namespace App\Mail;

class RaccordementImportNotification extends BaseImportNotification
{
    protected function getSubject(): string
    {
        return "🔌 Nouveau(x) fichier(s) de raccordements importé(s)";
    }

    protected function getMarkdownView(): string
    {
        return 'emails.imports.raccordement-import';
    }

    protected function getViewData(): array
    {
        return [
            'title' => 'Import de raccordements',
            'icon' => '🔌',
        ];
    }
}
