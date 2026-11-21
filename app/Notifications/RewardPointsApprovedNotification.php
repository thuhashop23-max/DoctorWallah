<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class RewardPointsApprovedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public string $topicTitle,
        public int $points,
        public ?int $topicId = null,
        public ?int $submissionId = null
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'reward_points_approved',
            'title' => 'Reward Points Received!',
            'message' => "Congratulations! Your note submission for '{$this->topicTitle}' has been approved. You received {$this->points} points!",
            'points' => $this->points,
            'topic_id' => $this->topicId,
            'submission_id' => $this->submissionId,
            'link' => '/student',
        ];
    }
}
