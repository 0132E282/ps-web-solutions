<?php

namespace PS0132E282\Core\Services;

use Illuminate\Support\Facades\Route;

/**
 * Class AdminRouteRegistrar
 * Handles fluent route registration for admin routes across domains.
 */
class AdminRouteRegistrar
{
    protected array $attributes = [
        'middleware' => ['web', 'auth', 'verified'],
        'as' => 'admin.',
    ];

    public function __construct()
    {
        //
    }

    /**
     * Define the route group.
     *
     * @param  callable|string  $callback
     */
    public function group($callback): void
    {
        $mainDomain = parse_url(config('app.url'), PHP_URL_HOST);
        $adminSubdomain = env('ADMIN_SUBDOMAIN');
        if ($adminSubdomain) {
            $attributes = array_merge($this->attributes, [
                'domain' => "{$adminSubdomain}.{$mainDomain}",
            ]);
            Route::group($attributes, $callback);
        } else {
            Route::group($this->attributes, $callback);
        }
    }
}
