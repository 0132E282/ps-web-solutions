<?php

return [
    [
        'name' => 'core',
        'enabled' => true,
    ],
    [
        'name' => 'cms',
        'enabled' => true,
        'settings' => [
            // Ví dụ: trang settings cho CMS
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
    ],
    [
        'name' => 'e-commerce',
        'enabled' => true,
    ],
];
