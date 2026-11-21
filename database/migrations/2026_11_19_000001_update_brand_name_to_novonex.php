<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('website_settings')) {
            $settings = DB::table('website_settings')->first();
            if ($settings) {
                $header = !empty($settings->header_settings) ? json_decode($settings->header_settings, true) : [];
                $footer = !empty($settings->footer_settings) ? json_decode($settings->footer_settings, true) : [];

                if (is_array($header)) {
                    $header['brand_title'] = 'NovoNex';
                    $header['brand_title_en'] = 'NovoNex';
                    $header['brand_subtitle'] = '';
                    $header['brand_subtitle_en'] = '';
                }
                if (is_array($footer)) {
                    $footer['brand_title'] = 'NovoNex';
                    $footer['brand_title_en'] = 'NovoNex';
                    $footer['brand_subtitle'] = '';
                    $footer['brand_subtitle_en'] = '';
                    $footer['email'] = 'support@nexcourses.com';
                    $footer['copyright_text'] = '© 2026 NovoNex. All rights reserved.';
                    $footer['copyright_text_en'] = '© 2026 NovoNex. All rights reserved.';
                }

                DB::table('website_settings')->where('id', $settings->id)->update([
                    'site_name' => 'NovoNex',
                    'site_tagline' => 'Premier Online Learning & EdTech Platform',
                    'contact_email' => 'support@nexcourses.com',
                    'copyright_text' => '© 2026 NovoNex. All rights reserved.',
                    'primary_color' => '#CC1200',
                    'secondary_color' => '#25a2ee',
                    'header_settings' => json_encode($header),
                    'footer_settings' => json_encode($footer),
                ]);
            }
        }

        if (Schema::hasTable('pages')) {
            $pages = DB::table('pages')->get();
            foreach ($pages as $p) {
                $rawMeta = $p->meta_title ?? '';
                $rawBlocks = $p->blocks ?? '';

                $newMeta = str_ireplace(['Monologue Edu', 'Monologue'], 'NovoNex', $rawMeta);
                $newBlocks = str_ireplace(['Monologue Edu', 'Monologue'], 'NovoNex', $rawBlocks);

                if ($newMeta !== $rawMeta || $newBlocks !== $rawBlocks) {
                    DB::table('pages')->where('id', $p->id)->update([
                        'meta_title' => $newMeta,
                        'blocks' => $newBlocks,
                    ]);
                }
            }
        }

        if (Schema::hasTable('course_purchase_sms_settings')) {
            $sms = DB::table('course_purchase_sms_settings')->first();
            if ($sms && !empty($sms->general_template)) {
                $newTpl = str_ireplace(['Monologue Edu', 'Monologue'], 'NovoNex', $sms->general_template);
                if ($newTpl !== $sms->general_template) {
                    DB::table('course_purchase_sms_settings')->where('id', $sms->id)->update([
                        'general_template' => $newTpl,
                    ]);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
