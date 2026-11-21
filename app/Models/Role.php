<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class Role extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'permissions',
        'is_system',
    ];

    protected $casts = [
        'permissions' => 'array',
        'is_system' => 'boolean',
    ];

    /**
     * Relationship to users assigned this custom role.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'custom_role_id');
    }

    /**
     * Check if this role has a specific permission.
     */
    public function hasPermission(string $permission): bool
    {
        $perms = $this->permissions ?? [];

        if (in_array('*', $perms, true)) {
            return true;
        }

        if (in_array($permission, $perms, true)) {
            return true;
        }

        // Support module wildcard e.g. "courses.*"
        $parts = explode('.', $permission);
        if (count($parts) > 1 && in_array($parts[0] . '.*', $perms, true)) {
            return true;
        }

        return false;
    }

    /**
     * Check if table exists and self-heal schema if running before migration.
     */
    public static function ensureSchema(): void
    {
        try {
            if (! Schema::hasTable('roles')) {
                Schema::create('roles', function (Blueprint $table) {
                    $table->id();
                    $table->string('name');
                    $table->string('slug')->unique();
                    $table->text('description')->nullable();
                    $table->json('permissions')->nullable();
                    $table->boolean('is_system')->default(false);
                    $table->timestamps();
                });
            }

            if (Schema::hasTable('users') && ! Schema::hasColumn('users', 'custom_role_id')) {
                Schema::table('users', function (Blueprint $table) {
                    $table->unsignedBigInteger('custom_role_id')->nullable()->after('role')->index();
                });
            }
        } catch (\Throwable $e) {
            // Ignore schema creation errors in read-only / unmigrated contexts
        }
    }

    /**
     * Return list of all granular system permissions grouped by module.
     */
    public static function permissionCatalog(): array
    {
        return [
            [
                'module' => 'courses',
                'name' => 'Courses & Curriculum',
                'icon' => 'BookOpen',
                'permissions' => [
                    ['key' => 'courses.view', 'label' => 'View Courses'],
                    ['key' => 'courses.create', 'label' => 'Create Courses'],
                    ['key' => 'courses.edit', 'label' => 'Edit Courses & Content'],
                    ['key' => 'courses.delete', 'label' => 'Delete Courses'],
                    ['key' => 'courses.categories', 'label' => 'Course Categories'],
                    ['key' => 'courses.enroll', 'label' => 'Manual Enrollment'],
                ],
            ],
            [
                'module' => 'bundles',
                'name' => 'Combo Course Bundles',
                'icon' => 'Boxes',
                'permissions' => [
                    ['key' => 'bundles.view', 'label' => 'View Bundles'],
                    ['key' => 'bundles.manage', 'label' => 'Manage Bundles'],
                ],
            ],
            [
                'module' => 'exams',
                'name' => 'Exams & Quizzes',
                'icon' => 'ClipboardList',
                'permissions' => [
                    ['key' => 'exams.view', 'label' => 'View Exams'],
                    ['key' => 'exams.create', 'label' => 'Create Exams'],
                    ['key' => 'exams.edit', 'label' => 'Edit Exams & Questions'],
                    ['key' => 'exams.grade', 'label' => 'Grade & Submissions'],
                    ['key' => 'exams.delete', 'label' => 'Delete Exams'],
                ],
            ],
            [
                'module' => 'orders',
                'name' => 'Orders & Enrollments',
                'icon' => 'ShoppingCart',
                'permissions' => [
                    ['key' => 'orders.view', 'label' => 'View Orders'],
                    ['key' => 'orders.manage', 'label' => 'Manage Orders'],
                ],
            ],
            [
                'module' => 'payments',
                'name' => 'Payment Gateways',
                'icon' => 'CreditCard',
                'permissions' => [
                    ['key' => 'payments.manual', 'label' => 'Manual Gateways'],
                    ['key' => 'payments.shurjopay', 'label' => 'shurjoPay Integration'],
                ],
            ],
            [
                'module' => 'users',
                'name' => 'User & Student Management',
                'icon' => 'Users',
                'permissions' => [
                    ['key' => 'users.view', 'label' => 'View Users'],
                    ['key' => 'users.create', 'label' => 'Create New User'],
                    ['key' => 'users.edit', 'label' => 'Edit User & Status'],
                    ['key' => 'roles.manage', 'label' => 'Manage Custom Roles'],
                ],
            ],
            [
                'module' => 'marketing',
                'name' => 'Marketing & Coupons',
                'icon' => 'TicketPercent',
                'permissions' => [
                    ['key' => 'marketing.coupons', 'label' => 'Manage Coupons'],
                    ['key' => 'marketing.affiliates', 'label' => 'Affiliate Settings'],
                ],
            ],
            [
                'module' => 'announcements',
                'name' => 'Announcements & Notifications',
                'icon' => 'Megaphone',
                'permissions' => [
                    ['key' => 'announcements.manage', 'label' => 'Send Announcements'],
                ],
            ],
            [
                'module' => 'sms',
                'name' => 'SMS Gateway & Push',
                'icon' => 'MessageSquareText',
                'permissions' => [
                    ['key' => 'sms.settings', 'label' => 'SMS Config'],
                    ['key' => 'sms.send', 'label' => 'Send SMS Campaigns'],
                ],
            ],
            [
                'module' => 'appearance',
                'name' => 'Website Design & Pages',
                'icon' => 'Palette',
                'permissions' => [
                    ['key' => 'pages.manage', 'label' => 'Page Builder'],
                    ['key' => 'appearance.manage', 'label' => 'Website Appearance'],
                    ['key' => 'media.manage', 'label' => 'Media Library'],
                ],
            ],
            [
                'module' => 'analytics',
                'name' => 'Reports & Analytics',
                'icon' => 'BarChart3',
                'permissions' => [
                    ['key' => 'analytics.view', 'label' => 'View Analytics'],
                ],
            ],
            [
                'module' => 'settings',
                'name' => 'System Settings',
                'icon' => 'Settings',
                'permissions' => [
                    ['key' => 'settings.manage', 'label' => 'Manage Settings'],
                ],
            ],
        ];
    }
}

