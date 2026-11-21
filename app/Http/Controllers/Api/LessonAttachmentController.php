<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Models\LessonAttachment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LessonAttachmentController extends Controller
{
    /**
     * Upload a physical file attachment for a lesson.
     */
    public function upload(Request $request, Lesson $lesson): JsonResponse
    {
        $user = auth()->user();
        if (! $user->isAdmin() && ! $lesson->course->isAssignedTeacher($user->id)) {
            abort(403, 'You do not have permission to upload materials to this lesson.');
        }

        // If client submitted link payload to this endpoint
        if ($request->input('type') === 'link' || $request->filled('link_url') || $request->filled('url')) {
            return $this->storeLink($request, $lesson);
        }

        $request->validate([
            'file' => ['required', 'file', 'max:51200'], // 50MB max
        ]);

        $file = $request->file('file');
        $originalName = $file->getClientOriginalName();
        $extension = strtolower($file->getClientOriginalExtension());
        $fileSize = $file->getSize();

        // Store in private storage directory
        $path = $file->store('private/attachments');

        $attachment = $lesson->attachments()->create([
            'file_name' => $originalName,
            'file_type' => $extension ?: 'file',
            'file_size' => $fileSize,
            'file_path' => $path,
            'is_private' => true,
        ]);

        return response()->json([
            'message' => 'File uploaded successfully.',
            'attachment' => $attachment,
        ], 201);
    }

    /**
     * Store an external link (Google Drive, Docs, etc.) as study material.
     */
    public function storeLink(Request $request, Lesson $lesson): JsonResponse
    {
        $user = auth()->user();
        if (! $user->isAdmin() && ! $lesson->course->isAssignedTeacher($user->id)) {
            abort(403, 'You do not have permission to attach materials to this lesson.');
        }

        $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'url' => ['required', 'url', 'max:2000'],
        ]);

        $url = trim($request->input('url'));
        $title = trim($request->input('title'));

        // Detect type (Google Drive, Google Docs, PDF, or general web link)
        $fileType = 'link';
        if (str_contains($url, 'drive.google.com') || str_contains($url, 'docs.google.com')) {
            $fileType = 'google_drive';
        } elseif (preg_match('/\.(pdf)$/i', parse_url($url, PHP_URL_PATH) ?? '')) {
            $fileType = 'pdf';
        }

        $attachment = $lesson->attachments()->create([
            'file_name' => $title,
            'file_type' => $fileType,
            'file_size' => 0,
            'file_path' => $url,
            'is_private' => false,
        ]);

        return response()->json([
            'message' => 'Study material link added successfully.',
            'attachment' => $attachment,
        ], 201);
    }

    /**
     * Delete an attachment.
     */
    public function delete(LessonAttachment $attachment): JsonResponse
    {
        $user = auth()->user();
        $course = $attachment->lesson->course;
        if (! $user->isAdmin() && ! $course->isAssignedTeacher($user->id)) {
            abort(403, 'You do not have permission to delete this material.');
        }

        // Only delete from storage if it's a locally stored file (not external link)
        $isExternal = str_starts_with($attachment->file_path, 'http://') || str_starts_with($attachment->file_path, 'https://');
        if (! $isExternal && Storage::exists($attachment->file_path)) {
            Storage::delete($attachment->file_path);
        }

        $attachment->delete();

        return response()->json([
            'message' => 'Material deleted successfully.',
        ]);
    }

    /**
     * Download or redirect to attachment.
     */
    public function download(Request $request, LessonAttachment $attachment): StreamedResponse|BinaryFileResponse|RedirectResponse
    {
        // 1. If it is an external link or Google Drive link, redirect directly to the URL
        if (str_starts_with($attachment->file_path, 'http://') || str_starts_with($attachment->file_path, 'https://')) {
            return redirect()->away($attachment->file_path);
        }

        // 2. Resolve authenticated user from Bearer header or query token
        $user = auth()->user();
        if (! $user && $request->filled('token')) {
            $personalToken = \Laravel\Sanctum\PersonalAccessToken::findToken($request->query('token'));
            if ($personalToken && $personalToken->tokenable) {
                $user = $personalToken->tokenable;
            }
        }

        $lesson = $attachment->lesson;
        $course = $lesson->course;

        // Verify authorization
        $canAccess = false;
        if ($user) {
            if ($user->isAdmin()) {
                $canAccess = true;
            } elseif ($user->isTeacher() && $course->isAssignedTeacher($user->id)) {
                $canAccess = true;
            } elseif ($user->isEnrolledIn($course->id)) {
                $canAccess = true;
            }
        }
        if ($lesson->is_preview) {
            $canAccess = true;
        }

        if (! $canAccess) {
            abort(403, 'You must be enrolled in the course to download this study material.');
        }

        // 1. Check in public path (e.g. materials/...)
        $publicFile = public_path($attachment->file_path);
        if (file_exists($publicFile) && is_file($publicFile)) {
            return response()->download($publicFile, $attachment->file_name);
        }

        // 2. Check in public disk
        if (Storage::disk('public')->exists($attachment->file_path)) {
            return Storage::disk('public')->download($attachment->file_path, $attachment->file_name);
        }

        // 3. Check in default storage disk
        if (Storage::exists($attachment->file_path)) {
            return Storage::download($attachment->file_path, $attachment->file_name);
        }

        // 4. Check in private storage path
        $privateFile = storage_path('app/' . $attachment->file_path);
        if (file_exists($privateFile) && is_file($privateFile)) {
            return response()->download($privateFile, $attachment->file_name);
        }

        abort(404, 'File not found in storage.');
    }
}
