<?php

namespace PS0132E282\ECommerce\Controllers;

use PS0132E282\Core\Base\BaseController;
use PS0132E282\ECommerce\Models\Product;

class ProductController extends BaseController
{
    protected ?string $model = Product::class;

    const views = [
        'index' => [
            'title' => 'Products',
            'description' => 'Manage your products',
            'filters' => ['status'],
            'actions' => ['create' => true, 'import' => true, 'export' => true, 'duplicate' => true],
            'fields' => [
                ['name' => 'name', 'config' => ['primary' => true]],
                'sku',
                'price',
                'quantity',
                'status',
                'created_at',
            ],
        ],
        'form' => [
            'sections' => [
                'main' => [
                    [
                        'header' => [
                            'title' => 'Product Information',
                            'description' => 'Basic information about the product',
                        ],
                        'fields' => [
                            'name',
                            'slug',
                            'spu',
                            ['name' => 'featured', 'config' => ['width' => 'md']],
                            ['name' => 'status', 'config' => ['width' => 'md', 'layout' => 'horizontal']],
                            ['name' => 'categories', 'config' => ['width' => 'md']],
                            ['name' => 'tags', 'config' => ['width' => 'md']],
                            // ['name' => 'related_products', 'config' => ['width' => 'md']],
                        ],
                    ],
                    [
                        'header' => [
                            'title' => 'product variation',
                            'description' => 'Basic information about the product',
                        ],
                        'fields' => ['variations'],
                    ],
                    [
                        'header' => [
                            'title' => 'Content',
                            'description' => 'Product content',
                        ],
                        'fields' => ['description', 'content'],
                    ],
                    [
                        'header' => [
                            'title' => 'SEO',
                            'description' => 'Search engine optimization',
                        ],
                        'fields' => ['seo'],
                    ],
                ],
                // 'sidebar' => [
                //     [
                //         'header' => [
                //             'title' => 'Status',
                //             'description' => 'Product visibility',
                //         ],
                //         'fields' => ['status', 'featured'],
                //     ],
                //     [
                //         'header' => [
                //             'title' => 'Categories & Options',
                //             'description' => 'Organize your product',
                //         ],
                //         'fields' => ['categories', 'options'],
                //     ],
                // ],
            ],
        ],
    ];
}
