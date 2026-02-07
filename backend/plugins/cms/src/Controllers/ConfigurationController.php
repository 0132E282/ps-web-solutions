<?php

namespace PS0132E282\Cms\Controllers;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class ConfigurationController extends Controller
{
    public function index()
    {
        $config = config('core.admin.configs', []);

        return Inertia::render('cms/settings/index', [
            'sections' => $config['sections'] ?? [],
        ]);
    }
}
