<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Page;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PublicPageController extends Controller
{
    /**
     * Get published page by slug for frontend rendering.
     */
    public function show(Request $request, string $slug): JsonResponse
    {
        $page = Page::where('slug', $slug)->first();

        // Special fallback for Home page if missing or not created
        if (!$page && $slug === 'home') {
            return response()->json([
                'page' => [
                    'id' => 0,
                    'title' => 'Home Page',
                    'slug' => 'home',
                    'status' => 'published',
                    'layout_type' => 'builder',
                    'blocks' => Page::defaultHomeBlocks(),
                    'custom_css' => '',
                    'is_system' => true,
                ],
            ]);
        }

        // Special fallback for Courses page if missing or not created
        if (!$page && $slug === 'courses') {
            return response()->json([
                'page' => [
                    'id' => 0,
                    'title' => 'All Courses',
                    'slug' => 'courses',
                    'status' => 'published',
                    'layout_type' => 'builder',
                    'blocks' => Page::defaultCoursesBlocks(),
                    'custom_css' => '',
                    'is_system' => true,
                ],
            ]);
        }

        // If not found, try finding by category- prefix or vice-versa
        if (!$page && str_starts_with($slug, 'category-')) {
            $catSlug = substr($slug, 9);
            $cat = \App\Models\Category::where('slug', $catSlug)->first();
            if ($cat) {
                $page = Page::firstOrCreate(
                    ['slug' => $slug],
                    [
                        'title' => $cat->name,
                        'status' => 'published',
                        'layout_type' => 'category',
                        'is_system' => false,
                        'meta_title' => $cat->name . ' - Novonex Academy',
                        'meta_description' => $cat->description ?? ($cat->name . ' all courses.'),
                        'blocks' => Page::defaultCategoryBlocks($cat),
                    ]
                );
            }
        }

        if (!$page) {
            return response()->json([
                'message' => 'Page not found.',
            ], 404);
        }

        // If draft, only allow if user is an admin
        if ($page->status === 'draft') {
            $user = $request->user('sanctum');
            if (!$user || $user->role !== User::ROLE_ADMIN) {
                return response()->json([
                    'message' => 'This page is currently draft or unpublished.',
                ], 404);
            }
        }

        // Ensure video testimonials section exists in home blocks
        if ($slug === 'home' && is_array($page->blocks)) {
            $hasVideoBlock = false;
            $defaultVideoBlock = null;
            foreach (Page::defaultHomeBlocks() as $db) {
                if (($db['type'] ?? '') === 'video_testimonials') {
                    $defaultVideoBlock = $db;
                    break;
                }
            }

            $updatedBlocks = [];
            foreach ($page->blocks as $b) {
                if (($b['type'] ?? '') === 'video_testimonials') {
                    $hasVideoBlock = true;
                    $items = $b['settings']['items'] ?? [];
                    if (!is_array($items) || count($items) === 0 || empty($items[0]['videoUrl']) || str_contains($items[0]['videoUrl'] ?? '', 'dQw4w9WgXcQ')) {
                        $b['settings']['items'] = $defaultVideoBlock['settings']['items'] ?? [];
                    }
                }
                $updatedBlocks[] = $b;
            }

            if (!$hasVideoBlock && $defaultVideoBlock) {
                $newBlocks = [];
                $inserted = false;
                foreach ($page->blocks as $b) {
                    $newBlocks[] = $b;
                    if (($b['type'] ?? '') === 'teachers_showcase') {
                        $newBlocks[] = $defaultVideoBlock;
                        $inserted = true;
                    }
                }
                if (!$inserted) {
                    $newBlocks[] = $defaultVideoBlock;
                }
                $page->blocks = $newBlocks;
                try {
                    $page->save();
                } catch (\Throwable $e) {}
            } else {
                $page->blocks = $updatedBlocks;
            }
        }

        return response()->json([
            'page' => $page,
        ]);
    }
}
