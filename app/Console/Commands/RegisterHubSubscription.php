<?php
namespace App\Console\Commands;
use app\Services\HubSubscriber;
use Illuminate\Console\Command;

class RegisterHubSubscription extends Command
{
    protected $signature = 'hub:subscribe';
    protected $description = 'Enregistre une subscription auprès du hub de notifications';  

public function handle(HubSubscriber $subscriber): void
{
    $subscriber->subscribe('eventType=serviceOrderStateChangeNotification');
    $this->info('Subscription registered.');
}
}