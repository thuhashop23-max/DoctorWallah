<?php

use App\Models\Category;
use App\Models\Page;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Ensure system 'courses' page exists
        Page::firstOrCreate(
            ['slug' => 'courses'],
            [
                'title' => 'All Courses',
                'status' => 'published',
                'layout_type' => 'builder',
                'is_system' => true,
                'meta_title' => 'All Courses - DoctorWallah',
                'meta_description' => 'Choose the right course to achieve your goals. Comprehensive preparation with experienced mentors.',
                'blocks' => Page::defaultCoursesBlocks(),
            ]
        );

        // 2. Sync all categories into pages
        Page::syncCategoryPages();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Page::where('slug', 'courses')->delete();
        Page::where('layout_type', 'category')->delete();
    }
};
