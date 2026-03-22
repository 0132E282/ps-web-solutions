<?php

use App\Models\ProductVariation;

return [
    'core' => [
        'enabled' => true,
    ],
    'cms' => [
        'enabled' => true,
        'settings' => [],
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
