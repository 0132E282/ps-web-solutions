<?php

namespace App\Http\Controllers\Content;

use PS0132E282\Core\Base\BaseController;
use App\Models\Content\Post;

class PostController extends BaseController
{
  /**
   * The model associated with this controller.
   *
   * @var string
   */
  protected ?string $model = Post::class;

  const views = [
    'index' => [
      'title' => 'Posts',
      'description' => 'Manage blog posts',
      'actions' => [
        'import' => [
          'fields' => ['title', 'slug', 'description', 'content', 'image', 'status', 'created_at', 'updated_at'],
        ],
        'export' => [
          'fields' => ['title', 'slug', 'description', 'content', 'image', 'status', 'created_at', 'updated_at'],
        ],
        'duplicate' => true
      ],
      'fields' => [
        'image',
        ['name' => 'title', 'config' => ['primary' => true]],
        'status',
        'created_at',
      ],
      'dashboards' => [
        [
          'title' => 'Tổng bài viết',
          'ui' => [
            'icon' => 'Files',
            'class' => 'bg-indigo-600'
          ],
          'query' => [
            'collection' => 'post',
            'fields' => 'id',
            'loaditems' => 'count',
          ],
        ],
        [
          'title' => 'Bài viết mới',
          'ui' => [
            'icon' => 'Zap',
            'class' => 'bg-emerald-600'
          ],
          'query' => [
            'collection' => 'post',
            'filters' => [
              'status' => ['_eq' => 'published'],
            ],
            'fields' => 'id',
            'loaditems' => 'count',
          ],
        ],
      ],
    ],
    'form' => [
      'sections' => [
        'main' => [
          [
            'header' => [
              'title' => 'Post Information',
              'description' => 'Basic information about the post',
            ],
            'fields' => [
              'image',
              'title',
              'description',
              'content',
            ],
          ],
        ],
        'sidebar' => [
          [
            'header' => [
              'title' => 'Publish Settings',
              'description' => 'Status and visibility settings',
            ],
            'fields' => [
              'status',
              'categories',
              'related_posts',
              'is_featured',
              ['name' => 'featured_position', 'filters' => ['is_featured' => ['_req' => true]]],
              'published_at',
            ],
          ],
        ],
      ],
    ],
  ];
}
