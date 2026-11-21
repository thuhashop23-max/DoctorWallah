<?php

use App\Models\Page;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Home Page (System protected)
        Page::firstOrCreate(
            ['slug' => 'home'],
            [
                'title' => 'Home Page',
                'status' => 'published',
                'layout_type' => 'builder',
                'is_system' => true,
                'meta_title' => 'DoctorWallah | Best Online Learning Platform in Bangladesh',
                'meta_description' => 'Leading online education platform in Bangladesh. Premier preparation for HSC and university admissions.',
                'blocks' => Page::defaultHomeBlocks(),
            ]
        );

        // 2. Privacy Policy Page
        Page::firstOrCreate(
            ['slug' => 'privacy-policy'],
            [
                'title' => 'Privacy Policy',
                'status' => 'published',
                'layout_type' => 'builder',
                'is_system' => false,
                'meta_title' => 'Privacy Policy - DoctorWallah',
                'meta_description' => 'DoctorWallah privacy policy and data protection terms.',
                'blocks' => [
                    [
                        'id' => 'block_hero_privacy',
                        'type' => 'cta_banner',
                        'title' => 'Header Banner',
                        'settings' => [
                            'badge' => 'Legal & Terms',
                            'title' => 'Privacy Policy',
                            'subtitle' => 'DoctorWallah is dedicated to safeguarding your personal data and privacy.',
                            'buttonText' => '',
                            'buttonLink' => '',
                            'bgColor' => 'slate',
                        ]
                    ],
                    [
                        'id' => 'block_text_privacy',
                        'type' => 'rich_text',
                        'title' => 'Privacy Content',
                        'settings' => [
                            'content' => "<h2>1. Information Collection & Usage</h2>\n<p>We collect student names, mobile numbers, and email addresses to manage accounts, communicate updates, and deliver course materials.</p>\n<h2>2. Payment & Security</h2>\n<p>All payments are securely processed through verified banking and mobile payment gateways. We do not store sensitive payment PINs or passwords.</p>\n<h2>3. Contact Us</h2>\n<p>If you have any questions or inquiries, please contact our support team directly.</p>"
                        ]
                    ]
                ],
            ]
        );

        // 3. Terms and Conditions
        Page::firstOrCreate(
            ['slug' => 'terms'],
            [
                'title' => 'Terms & Conditions',
                'status' => 'published',
                'layout_type' => 'builder',
                'is_system' => false,
                'meta_title' => 'Terms and Conditions - DoctorWallah',
                'meta_description' => 'Terms and conditions of using DoctorWallah.',
                'blocks' => [
                    [
                        'id' => 'block_hero_terms',
                        'type' => 'cta_banner',
                        'title' => 'Terms Banner',
                        'settings' => [
                            'badge' => 'Rules & Guidelines',
                            'title' => 'Terms & Conditions',
                            'subtitle' => 'Rules and guidelines for using the DoctorWallah platform.',
                            'buttonText' => '',
                            'buttonLink' => '',
                            'bgColor' => 'sky',
                        ]
                    ],
                    [
                        'id' => 'block_text_terms',
                        'type' => 'rich_text',
                        'title' => 'Terms Content',
                        'settings' => [
                            'content' => "<h2>1. Course Access & Usage Rules</h2>\n<p>All course videos and study materials are strictly for individual personal educational use. Unauthorized distribution, copying, or downloading is strictly prohibited.</p>\n<h2>2. Account Integrity</h2>\n<p>Each registered account belongs to a single student. Sharing account credentials with multiple individuals may lead to temporary or permanent suspension.</p>"
                        ]
                    ]
                ],
            ]
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Page::whereIn('slug', ['home', 'privacy-policy', 'terms'])->delete();
    }
};
