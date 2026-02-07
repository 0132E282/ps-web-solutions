<?php

namespace PS0132E282\Core\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Priority: query parameter > cookie > config
        $locale = $request->query('locale') 
            ?? $request->cookie('locale') 
            ?? config('app.locale', 'en');

        // Get available locales from config or default
        $availableLocales = config('app.available_locales');
        if (!is_array($availableLocales) || empty($availableLocales)) {
            $availableLocales = ['en', 'vi'];
        }

        // Validate locale
        if (!in_array($locale, $availableLocales, true)) {
            $locale = config('app.locale', 'en');
        }

        App::setLocale($locale);

        // If locale came from query parameter, set cookie for future requests
        if ($request->query('locale') && in_array($request->query('locale'), $availableLocales, true)) {
            $response = $next($request);
            return $response->withCookie(cookie('locale', $locale, 60 * 24 * 365, '/', null, false, false));
        }

        return $next($request);
    }
}

