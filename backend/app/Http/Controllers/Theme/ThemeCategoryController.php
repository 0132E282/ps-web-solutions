<?php

namespace App\Http\Controllers\Theme;

use PS0132E282\Core\Base\BaseController;
use App\Models\ThemeCategory;

class ThemeCategoryController extends BaseController
{
  protected ?string $model = ThemeCategory::class;

  const views = [
    'index' => [
      'title' => 'Categories',
      'description' => 'Manage categories list',
      'fields' => [
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
            ],
            'fields' => ['name', 'parent'],
          ],
        ],
        'sidebar' => [
          [
            'header' => [
              'title' => 'Category Information',
              'description' => 'Basic information about the category',
            ],
            'fields' => [
              'status',
              'position',
            ],
          ],
        ],
      ],
    ],
  ];
}
