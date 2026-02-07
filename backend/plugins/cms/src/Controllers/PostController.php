<?php

namespace PS0132E282\Cms\Controllers;

use PS0132E282\Core\Base\BaseController;
use PS0132E282\Cms\Models\Post;

class PostController extends BaseController
{
    protected ?string $model =  Post::class; // Set your model here

    const views = [
        'index' => [
            'filters' => ['status'],
            'actions' => ['import' => true, 'export' => true, 'duplicate' => true],
            'fields' => [
                'image',
                ['name' => 'title', 'config' => ['primary' => true]],
                'status',
                'created_at',
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
                        'fields' => ['title', 'content', 'description'],
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
                        'fields' => ['image', 'status', [
                            'name' => 'related_posts',
                            'type' => 'multiple-selects',
                            'config' => [
                                'label' => 'Related Posts',
                                'wrap' => true,
                                'showSelectAll' => true,
                                'validation' => 'required|exists:posts,id',
                                'query' => [
                                    'collection' => 'post',
                                    'filters' => [
                                        'status' => ['_eq' => 'published'],
                                        'id' => ['_neq' => '$params.id'],
                                    ],
                                    'fields' => 'id,title',
                                ],
                            ],
                        ], 'position', 'published_at'],
                    ],
                ],
            ]
        ]
    ];
}
