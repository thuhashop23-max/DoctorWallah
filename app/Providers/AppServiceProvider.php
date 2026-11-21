<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if ($this->app->environment('production') || 
            request()->server('HTTP_X_FORWARDED_PROTO') === 'https' ||
            str_contains(request()->getHost(), 'nexcourses.com')) {
            \Illuminate\Support\Facades\URL::forceScheme('https');
        }

        try {
            if (file_exists(base_path('bootstrap/cache/routes-v7.php'))) {
                @unlink(base_path('bootstrap/cache/routes-v7.php'));
            }
            if (! \Illuminate\Support\Facades\Schema::hasTable('course_purchase_sms_settings') || 
                ! \Illuminate\Support\Facades\Schema::hasTable('course_bundles') ||
                ! \Illuminate\Support\Facades\Schema::hasTable('coupons') ||
                ! \Illuminate\Support\Facades\Schema::hasColumn('courses', 'deleted_at') ||
                ! \Illuminate\Support\Facades\Schema::hasColumn('courses', 'enrolled_action_buttons') ||
                ! \Illuminate\Support\Facades\Schema::hasColumn('exam_questions', 'negative_marks') ||
                ! \Illuminate\Support\Facades\Schema::hasColumn('enrollments', 'access_key')) {
                \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
            }

            if (\Illuminate\Support\Facades\Schema::hasTable('website_settings')) {
                $setting = \App\Models\WebsiteSetting::first();
                if ($setting && ($setting->site_name !== 'NovoNex' || $setting->primary_color !== '#CC1200' || $setting->secondary_color !== '#25a2ee' || str_contains(json_encode($setting->header_settings), 'Monologue'))) {
                    $header = $setting->header_settings ?? [];
                    $header['brand_title'] = 'NovoNex';
                    $header['brand_subtitle'] = '';
                    $footer = $setting->footer_settings ?? [];
                    $footer['brand_title'] = 'NovoNex';
                    $footer['brand_subtitle'] = '';
                    $footer['description'] = 'Bangladesh’s premier online learning platform. Prepare for exams with the best mentors.';
                    $footer['email'] = 'support@nexcourses.com';
                    $footer['copyright_text'] = '© 2026 NovoNex. All rights reserved.';

                    $setting->update([
                        'site_name' => 'NovoNex',
                        'site_tagline' => 'Premier Online Learning & EdTech Platform',
                        'contact_email' => 'support@nexcourses.com',
                        'copyright_text' => '© 2026 NovoNex. All rights reserved.',
                        'primary_color' => '#CC1200',
                        'secondary_color' => '#25a2ee',
                        'header_settings' => $header,
                        'footer_settings' => $footer,
                    ]);
                }
            }

            if (\Illuminate\Support\Facades\Schema::hasTable('users')) {
                \App\Models\User::firstOrCreate(
                    ['phone' => '+8801700000001'],
                    [
                        'name' => 'Admin',
                        'email' => 'admin@novonex.com',
                        'password' => \Illuminate\Support\Facades\Hash::make('password123'),
                        'role' => \App\Models\User::ROLE_ADMIN,
                        'status' => \App\Models\User::STATUS_ACTIVE,
                    ]
                );
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Auto-migration error: ' . $e->getMessage());
        }
    }
}
