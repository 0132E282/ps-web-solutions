<?php

use App\Models\ProductVariation;

return [
    'core' => [
        'enabled' => true,
    ],
    'cms' => [
        'enabled' => true,
        'settings' => [
            [
                'key' => 'cms-general',
                'view' => 'settings/cms-general',
                'data' => [],
            ],
            [
                'key' => 'cms-seo',
                'view' => 'settings/cms-seo',
                'data' => [],
            ],
        ],
        'sliders' => [
            'home' => 'sliders.home',
            'home-mobile' => 'sliders.home-mobile',
        ],
        'menus' => [
            'location' => [
                'header' => 'menus.header',
                'footer' => 'menus.footer',
            ],

        ],
    ],
    'e-commerce' => [
        'enabled' => false,
        'models' => [
            'ProductVariation' => ProductVariation::class,
        ],
    ],
    'notification' => [
        'enabled' => false,
    ],
];
