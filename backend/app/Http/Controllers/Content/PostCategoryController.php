<?php

namespace App\Http\Controllers\Content;

use PS0132E282\Core\Base\BaseController;
use App\Models\Content\PostCategory;

class PostCategoryController extends BaseController
{
  /**
   * The model associated with this controller.
   *
   * @var string
   */
  protected ?string $model = PostCategory::class;

  const views = [
    'index' => [
      'title' => 'Post Categories',
      'description' => 'Manage blog post categories',
      'fields' => [
        ['name' => 'image', 'width' => 20],
        ['name' => 'name', 'primary' => true],
        ['name' => 'status'],
        ['name' => 'created_at'],
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
            'fields' => [
              'image',
              'name',
              'description',
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
            ],
          ],
        ],
      ],
    ],
  ];
}
