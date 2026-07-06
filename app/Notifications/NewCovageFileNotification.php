<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewCovageFileNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $fileName;
    protected $type; // 'vt' ou 'raccordement'
    protected $details;

    public function __construct($fileName, $type, $details = [])
    {
        $this->fileName = $fileName;
        $this->type = $type;
        $this->details = $details;
    }

    public function via($notifiable)
    {
        // Vous pouvez utiliser plusieurs canaux
        return ['mail', 'slack'];
    }

    public function toMail($notifiable)
    {
        $subject = $this->type === 'vt'
            ? 'Nouveau fichier de visite technique reçu'
            : 'Nouveau fichier de raccordement reçu';

        return (new MailMessage)
            ->subject($subject)
            ->greeting('Bonjour,')
            ->line("Un nouveau fichier a été déposé par Covage :")
            ->line("**Fichier :** {$this->fileName}")
            ->line("**Type :** " . ($this->type === 'vt' ? 'Visite technique' : 'Raccordement'))
            ->when(!empty($this->details), function ($mail) {
                foreach ($this->details as $key => $value) {
                    $mail->line("**{$key} :** {$value}");
                }
            })
            ->action('Voir les détails', url('/dashboard'))
            ->line('Merci de votre attention.');
    }

    public function toSlack($notifiable)
    {
        $message = "📁 *Nouveau fichier reçu de Covage*\n".
                   "• Fichier : `{$this->fileName}`\n".
                   "• Type : " . ($this->type === 'vt' ? 'Visite technique' : 'Raccordement');

        if (!empty($this->details)) {
            foreach ($this->details as $key => $value) {
                $message .= "\n• {$key} : {$value}";
            }
        }

        return (new SlackMessage)
            ->content($message);
    }
}
