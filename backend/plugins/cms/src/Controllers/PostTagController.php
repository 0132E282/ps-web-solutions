<?php

namespace PS0132E282\Cms\Controllers;

use PS0132E282\Cms\Models\PostTag;
use PS0132E282\Core\Base\BaseController;

class PostTagController extends BaseController
{
    protected ?string $model = PostTag::class;

    const views = [
        'index' => [
            'layout' => 'table',
            'title' => 'Post Tags',
            'description' => 'List of post tags',
            'icon' => 'Tag',
            'fields' => [
                ['accessorKey' => 'name', 'config' => ['type' => 'text', 'sortable' => true]],
                ['accessorKey' => 'description', 'config' => ['type' => 'text']],
                ['accessorKey' => 'created_at', 'config' => ['type' => 'date', 'sortable' => true]],
                ['accessorKey' => 'updated_at', 'config' => ['type' => 'date', 'sortable' => true]],
            ],
            'actions' => [
                'edit' => [
                    'name' => 'Edit',
                    'icon' => 'Edit',
                    'route' => 'admin.post-tags.edit',
                ],
            ],
        ],
    ];
}
