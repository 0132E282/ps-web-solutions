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
            'home' => 'Slider trang chủ',
            'home-mobile' => 'Slider trang chủ (Mobile)',
            'banner-home' => 'Banner trang chủ',
            'banner-side' => 'Banner thanh bên',
            'banner-popup' => 'Banner Popup',
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
            // 'ProductVariation' => ProductVariation::class,
        ],
    ],
    'notification' => [
        'enabled' => false,
    ],
];
