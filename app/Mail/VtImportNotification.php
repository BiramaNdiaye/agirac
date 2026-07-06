<?php

namespace App\Mail;

class VtImportNotification extends BaseImportNotification
{
    protected function getSubject(): string
    {
        return "📋 Nouveau(x) fichier(s) de visites techniques importé(s)";
    }

    protected function getMarkdownView(): string
    {
        return 'emails.imports.vt-import';
    }

    protected function getViewData(): array
    {
        return [
            'title' => 'Import de visites techniques',
            'icon' => '🔧',
        ];
    }
}
