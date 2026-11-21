<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CategoryManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $student;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::create([
            'name' => 'Admin User',
            'phone' => '+8801700000001',
            'email' => 'admin@example.com',
            'password' => Hash::make('password123'),
            'role' => User::ROLE_ADMIN,
            'status' => User::STATUS_ACTIVE,
        ]);

        $this->student = User::create([
            'name' => 'Student User',
            'phone' => '+8801711111111',
            'email' => 'student@example.com',
            'password' => Hash::make('password123'),
            'role' => User::ROLE_STUDENT,
            'status' => User::STATUS_ACTIVE,
        ]);
    }

    public function test_admin_can_list_categories(): void
    {
        Category::create(['name' => 'Free Courses', 'slug' => 'free-courses']);
        Category::create(['name' => 'Paid Courses', 'slug' => 'paid-courses']);

        Sanctum::actingAs($this->admin);

        $response = $this->getJson('/api/admin/categories');

        $response->assertStatus(200)
            ->assertJsonCount(2)
            ->assertJsonFragment(['slug' => 'free-courses'])
            ->assertJsonFragment(['slug' => 'paid-courses']);
    }

    public function test_non_admin_cannot_manage_categories(): void
    {
        Sanctum::actingAs($this->student);

        $response = $this->getJson('/api/admin/categories');
        $response->assertStatus(403);

        $response = $this->postJson('/api/admin/categories', ['name' => 'New Category']);
        $response->assertStatus(403);
    }

    public function test_admin_can_create_category(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->postJson('/api/admin/categories', [
            'name' => 'HSC Physics',
            'slug' => 'hsc-physics',
            'description' => 'Physics courses for HSC students',
        ]);

        $response->assertStatus(201)
            ->assertJsonFragment(['name' => 'HSC Physics'])
            ->assertJsonFragment(['slug' => 'hsc-physics']);

        $this->assertDatabaseHas('categories', [
            'name' => 'HSC Physics',
            'slug' => 'hsc-physics',
        ]);
    }

    public function test_admin_can_update_category(): void
    {
        $cat = Category::create([
            'name' => 'Old Name',
            'slug' => 'old-name',
        ]);

        Sanctum::actingAs($this->admin);

        $response = $this->putJson("/api/admin/categories/{$cat->id}", [
            'name' => 'Updated Category',
            'slug' => 'updated-category',
            'description' => 'New Info',
        ]);

        $response->assertStatus(200)
            ->assertJsonFragment(['name' => 'Updated Category'])
            ->assertJsonFragment(['slug' => 'updated-category']);

        $this->assertDatabaseHas('categories', [
            'id' => $cat->id,
            'name' => 'Updated Category',
            'slug' => 'updated-category',
        ]);
    }

    public function test_admin_can_delete_category_and_courses_are_detached(): void
    {
        $cat = Category::create([
            'name' => 'Category to Delete',
            'slug' => 'to-delete',
        ]);

        $course = Course::create([
            'title' => 'Test Course',
            'slug' => 'test-course',
            'price' => 0,
            'status' => 'published',
        ]);

        $course->categories()->attach($cat->id);
        $this->assertEquals(1, $course->fresh()->categories()->count());

        Sanctum::actingAs($this->admin);

        $response = $this->deleteJson("/api/admin/categories/{$cat->id}");

        $response->assertStatus(200);

        $this->assertDatabaseMissing('categories', ['id' => $cat->id]);
        $this->assertEquals(0, $course->fresh()->categories()->count());
        $this->assertDatabaseHas('courses', ['id' => $course->id]); // Course remains intact
    }

    public function test_courses_support_multiple_categories_and_public_filter(): void
    {
        $freeCat = Category::create(['name' => 'Free Courses', 'slug' => 'free-courses']);
        $physicsCat = Category::create(['name' => 'HSC Physics', 'slug' => 'hsc-physics']);
        $mathCat = Category::create(['name' => 'HSC Math', 'slug' => 'hsc-math']);

        // Course with multiple categories (both free and physics)
        $course1 = Course::create([
            'title' => 'Free Physics Masterclass',
            'slug' => 'free-physics',
            'price' => 0,
            'status' => 'published',
        ]);
        $course1->categories()->attach([$freeCat->id, $physicsCat->id]);

        // Course only in math
        $course2 = Course::create([
            'title' => 'Higher Math Course',
            'slug' => 'hsc-math-course',
            'price' => 1500,
            'status' => 'published',
        ]);
        $course2->categories()->attach([$mathCat->id]);

        // Query by free-courses: course1 should appear, course2 should not
        $responseFree = $this->getJson('/api/courses?category=free-courses');
        $responseFree->assertStatus(200);
        $dataFree = $responseFree->json('data');
        $this->assertCount(1, $dataFree);
        $this->assertEquals('free-physics', $dataFree[0]['slug']);

        // Query by hsc-physics: course1 should appear
        $responsePhysics = $this->getJson('/api/courses?category=hsc-physics');
        $responsePhysics->assertStatus(200);
        $dataPhysics = $responsePhysics->json('data');
        $this->assertCount(1, $dataPhysics);
        $this->assertEquals('free-physics', $dataPhysics[0]['slug']);

        // Query all courses: both course1 and course2 should appear
        $responseAll = $this->getJson('/api/courses');
        $responseAll->assertStatus(200);
        $this->assertCount(2, $responseAll->json('data'));
    }
}
