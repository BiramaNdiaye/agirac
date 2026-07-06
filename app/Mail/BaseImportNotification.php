<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

abstract class BaseImportNotification extends Mailable
{
    use Queueable, SerializesModels;

    public $files;
    public $type;

    public function __construct($files, $type)
    {
        $this->files = $files;
        $this->type = $type;
    }

    abstract protected function getSubject(): string;
    abstract protected function getMarkdownView(): string;
    abstract protected function getViewData(): array;

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->getSubject(),
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: $this->getMarkdownView(),
            with: array_merge([
                'files' => $this->files,
                'type' => $this->type,
            ], $this->getViewData()),
        );
    }
}
