<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewImportNotification extends Mailable
{
    use Queueable, SerializesModels;

    public $files;
    public $type;

    public function __construct($files, $type)
    {
        $this->files = $files;
        $this->type = $type;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Nouveau(x) fichier(s) importé(s) - {$this->type}",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.imports.new-import',
            with: [
                'files' => $this->files,
                'type' => $this->type,
            ],
        );
    }
}
