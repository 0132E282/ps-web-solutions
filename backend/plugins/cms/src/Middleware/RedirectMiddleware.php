<?php

namespace PS0132E282\Cms\Middleware;

use Closure;
use Illuminate\Http\Request;
use PS0132E282\Cms\Models\Redirect;
use Symfony\Component\HttpFoundation\Response;

class RedirectMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Only redirect GET requests to avoid issues with form submissions
        if ($request->isMethod('GET')) {
            $path = '/'.ltrim($request->getPathInfo(), '/');

            // Try to find an active redirect for the current path
            $redirect = Redirect::query()
                ->where('old_url', $path)
                ->where('status', true)
                ->first();

            if ($redirect) {
                return redirect($redirect->new_url, $redirect->status_code);
            }
        }

        return $next($request);
    }
}
