<?php

namespace PS0132E282\ECommerce\Controllers;

use PS0132E282\Core\Base\BaseController;
use PS0132E282\ECommerce\Models\ProductCategory;

class ProductCategoryController extends BaseController
{
    protected ?string $model = ProductCategory::class;

    const views = [
        'index' => [
            'title' => 'Product Categories',
            'description' => 'Manage product categories',
            'fields' => [
                ['name' => 'name', 'config' => ['primary' => true]],
                'sort_order',
                'status',
                'created_at',
            ],
        ],
        'form' => [
            'sections' => [
                'main' => [
                    [
                        'header' => [
                            'title' => 'Category Information',
                            'description' => 'Basic information about the category',
                        ],
                        'fields' => ['name', 'slug', 'description', 'parent'],
                    ],
                ],
                'sidebar' => [
                    [
                        'header' => [
                            'title' => 'Settings',
                            'description' => 'Category settings',
                        ],
                        'fields' => ['status', 'sort_order'],
                    ],
                ],
            ],
        ],
    ];
}
