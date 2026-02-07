<?php

namespace PS0132E282\Cms\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Cookie;
use Inertia\Inertia;

class LocaleController extends Controller
{
    /**
     * Change application locale.
     */
    public function update(Request $request): \Illuminate\Http\RedirectResponse
    {
        $request->validate([
            'locale' => ['required', 'string', 'in:en,vi'],
        ]);

        $locale = $request->input('locale');

        App::setLocale($locale);

        // Set cookie for locale (1 year)
        $cookie = Cookie::make('locale', $locale, 60 * 24 * 365, '/', null, false, false);

        return back()->withCookie($cookie);
    }
}

