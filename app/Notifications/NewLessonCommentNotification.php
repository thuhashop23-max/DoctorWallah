<?php

namespace App\Notifications;

use App\Models\LessonComment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class NewLessonCommentNotification extends Notification
{
    use Queueable;

    public function __construct(public LessonComment $comment)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $lesson = $this->comment->lesson;
        $course = $lesson->course;
        $student = $this->comment->user;

        return [
            'type' => 'lesson_comment',
            'title' => 'New Question / Comment',
            'message' => "{$student->name} asked a question in '{$lesson->title}' of {$course->title}.",
            'comment_id' => $this->comment->id,
            'lesson_id' => $lesson->id,
            'course_id' => $course->id,
            'course_title' => $course->title,
            'user_name' => $student->name,
            'link' => "/learning/{$course->id}/lessons/{$lesson->id}",
        ];
    }
}
