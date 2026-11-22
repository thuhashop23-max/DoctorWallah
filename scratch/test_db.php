<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $settings = \App\Models\WebsiteSetting::first();
    echo "SETTINGS:\n";
    echo json_encode([
        'site_name' => $settings->site_name,
        'logo_url' => $settings->logo_url,
        'favicon_url' => $settings->favicon_url,
        'header_settings' => $settings->header_settings,
    ], JSON_PRETTY_PRINT) . "\n\n";

    echo "MEDIA:\n";
    $media = \Illuminate\Support\Facades\DB::table('media')->get();
    echo json_encode($media, JSON_PRETTY_PRINT) . "\n";
} catch (\Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
