<?php

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
    ],
    'e-commerce' => [
        'enabled' => true,
    ],
];
