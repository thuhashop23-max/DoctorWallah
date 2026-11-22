<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    @php
        try {
            $siteSettings = \App\Models\WebsiteSetting::current();
        } catch (\Throwable $e) {
            $siteSettings = null;
        }
        $siteFavicon = $siteSettings->favicon_url ?? null;
        $siteTitle = $siteSettings->site_name ?? 'DoctorWallah';
        $siteTagline = $siteSettings->site_tagline ?? 'Premier Online Learning & EdTech Platform';
        $headerSettings = $siteSettings->header_settings ?? [];
        $siteLogo = $headerSettings['logo_url'] ?? $siteSettings->logo_url ?? null;
    @endphp
    <title>{{ $siteTitle }} | {{ $siteTagline }}</title>
    @if($siteFavicon)
        <link rel="icon" id="dynamic-favicon" href="{{ $siteFavicon }}">
        <link rel="shortcut icon" href="{{ $siteFavicon }}">
        <link rel="apple-touch-icon" href="{{ $siteFavicon }}">
    @else
        <link rel="icon" id="dynamic-favicon" href="/favicon.ico" type="image/x-icon">
    @endif
    @if($siteLogo)
        <link rel="preload" as="image" href="{{ $siteLogo }}">
    @endif
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&display=swap" rel="stylesheet">
    <script>
        window.__INITIAL_SETTINGS__ = {!! json_encode($siteSettings) !!};
        (function() {
            try {
                var theme = localStorage.getItem('DoctorWallah_theme');
                if (theme === 'light') {
                    document.documentElement.classList.remove('dark');
                } else {
                    document.documentElement.classList.add('dark');
                }
            } catch (_) {}
        })();
    </script>
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/main.tsx'])
</head>
<body class="bg-slate-50 text-slate-900 dark:bg-[#060202] dark:text-slate-100 font-sans antialiased selection:bg-[#A60201] selection:text-white">
    <div id="root">
        <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center;">
            <div style="width: 38px; height: 38px; border: 3px solid rgba(166, 2, 1, 0.18); border-top-color: #A60201; border-radius: 50%; animation: dwSpin 0.75s linear infinite;"></div>
        </div>
        <style>
            @keyframes dwSpin {
                to { transform: rotate(360deg); }
            }
        </style>
    </div>
</body>
</html>
