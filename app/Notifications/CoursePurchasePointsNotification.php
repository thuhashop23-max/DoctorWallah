<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class CoursePurchasePointsNotification extends Notification
{
    use Queueable;

    public function __construct(
        public string $courseTitle,
        public int $points,
        public ?int $orderId = null
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'course_purchase_points',
            'title' => 'Purchase Reward Points Received!',
            'message' => "You have received {$this->points} reward points for enrolling in '{$this->courseTitle}'!",
            'points' => $this->points,
            'order_id' => $this->orderId,
            'link' => '/student',
        ];
    }
}
