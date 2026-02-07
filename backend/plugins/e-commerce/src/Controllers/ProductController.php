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
            'fields' => [
                ['name' => 'name', 'config' => ['primary' => true]],
                'sku',
                'price',
                'quantity',
                'status',
                'created_at'
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
                        'fields' => ['name', 'slug', 'sku', 'short_description', 'description'],
                    ],
                    [
                        'header' => [
                            'title' => 'Pricing',
                            'description' => 'Product pricing information',
                        ],
                        'fields' => ['price', 'sale_price', 'cost'],
                    ],
                    [
                        'header' => [
                            'title' => 'Inventory',
                            'description' => 'Stock and inventory management',
                        ],
                        'fields' => ['quantity', 'stock_status'],
                    ],
                    [
                        'header' => [
                            'title' => 'Shipping',
                            'description' => 'Product dimensions and weight',
                        ],
                        'fields' => ['weight', 'length', 'width', 'height'],
                    ],
                ],
                'sidebar' => [
                    [
                        'header' => [
                            'title' => 'Status',
                            'description' => 'Product visibility',
                        ],
                        'fields' => ['status', 'featured'],
                    ],
                    [
                        'header' => [
                            'title' => 'Categories & Options',
                            'description' => 'Organize your product',
                        ],
                        'fields' => ['categories', 'options'],
                    ],
                    [
                        'header' => [
                            'title' => 'SEO',
                            'description' => 'Search engine optimization',
                        ],
                        'fields' => ['meta_title', 'meta_description', 'meta_keywords'],
                    ],
                ],
            ],
        ],
    ];
}
