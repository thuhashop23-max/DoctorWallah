<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PaymentConfirmedNotification extends Notification
{
    use Queueable;

    public function __construct(public Order $order)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $course = $this->order->course;

        return [
            'type' => 'payment_confirmed',
            'title' => 'Payment Successful & Enrollment Confirmed',
            'message' => "Your payment for {$course->title} has been confirmed. You can start your classes now!",
            'order_id' => $this->order->id,
            'order_number' => $this->order->order_number,
            'course_id' => $course->id,
            'course_title' => $course->title,
            'link' => "/student/my-courses",
        ];
    }
}
