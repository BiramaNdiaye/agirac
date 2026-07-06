// app/Models/Notification.php
class NotificatioCovagen extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['id', 'event_id', 'event_type', 'payload', 'received_at'];
    protected $casts = ['payload' => 'array'];
}
