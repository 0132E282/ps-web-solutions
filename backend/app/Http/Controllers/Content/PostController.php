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
      'fields' => [
        ['name' => 'image', 'width' => 20],
        ['name' => 'title', 'primary' => true],
        ['name' => 'status'],
        ['name' => 'created_at'],
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
