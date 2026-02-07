<?php

namespace PS0132E282\Cms\Controllers;

use PS0132E282\Core\Base\BaseController;
use PS0132E282\Cms\Models\PostCategory;

class PostCategoryController extends BaseController
{
    protected ?string $model = PostCategory::class;

    const views = [
        'index' => [
            'title' => 'Post Categories',
            'load-items' => 'tree',
            'fields' => [
                ['name' => 'name', 'config' => ['primary' => true]],
                ['name' => 'status', 'config' => ['type' => 'badge']],
                ['name' => 'created_at', 'config' => ['type' => 'date']],
            ],
        ],
        'form' => [
            'sections' => [
                'main' => [
                    [
                        'header' => [
                            'title' => 'Thông tin',
                            'description' => 'Thông tin của danh mục bài viết',
                        ],
                        'fields' => ['name', 'slug', 'parent_id'],
                    ],
                    [
                        'header' => [
                            'title' => 'SEO',
                            'description' => 'SEO của danh mục bài viết',
                        ],
                        'fields' => ['seo'],
                    ],
                ],
                'sidebar' => [
                    [
                        'header' => [
                            'title' => 'Cài đặt',
                            'description' => 'Cài đặt của danh mục bài viết',
                        ],
                        'fields' => ['position', 'status'],
                    ],
                ],
            ],
        ],
    ];
}
