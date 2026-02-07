<?php

namespace PS0132E282\ECommerce\Controllers;

use PS0132E282\Core\Base\BaseController;
use PS0132E282\ECommerce\Models\ProductOption;

class ProductOptionController extends BaseController
{
    protected ?string $model = ProductOption::class;

    const views = [
        'index' => [
            'title' => 'Product Options',
            'description' => 'Manage product options (size, color, material, etc.)',
            'fields' => [
                ['name' => 'name', 'config' => ['primary' => true]],
                'property.type',
                'created_at',
            ],
        ],
        'form' => [
            'sections' => [
                'main' => [
                    [
                        'header' => [
                            'title' => 'Option Information',
                            'description' => 'Basic information about the product option',
                        ],
                        'fields' => ['name', 'parent'],
                    ],
                    [
                        'header' => [
                            'title' => 'Option Configuration',
                            'description' => 'Configure option type and values',
                        ],
                        'fields' => [['name' => 'property.type', 'config' => ['layout' => 'horizontal']], 'property.values', 'property.is_required'],
                    ],
                ],
                'sidebar' => [
                    [
                        'header' => [
                            'title' => 'Settings',
                            'description' => 'Option settings',
                        ],
                        'fields' => [['name' => 'status', 'config' => ['layout' => 'horizontal']], 'sort_order'],
                    ],
                ],
            ],
        ],
    ];
}
