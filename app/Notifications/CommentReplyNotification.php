<?php

namespace App\Notifications;

use App\Models\LessonComment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class CommentReplyNotification extends Notification
{
    use Queueable;

    public function __construct(public LessonComment $reply)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $lesson = $this->reply->lesson;
        $course = $lesson->course;
        $teacher = $this->reply->user;

        return [
            'type' => 'comment_reply',
            'title' => 'New Reply to Question',
            'message' => "Instructor {$teacher->name} replied to your question in '{$lesson->title}'.",
            'reply_id' => $this->reply->id,
            'lesson_id' => $lesson->id,
            'course_id' => $course->id,
            'course_title' => $course->title,
            'teacher_name' => $teacher->name,
            'link' => "/learning/{$course->id}/lessons/{$lesson->id}",
        ];
    }
}
