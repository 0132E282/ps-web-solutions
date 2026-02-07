<?php

namespace App\Http\Controllers\Theme;

use PS0132E282\Core\Base\BaseController;
use App\Models\ThemeTag;

class ThemeTagController extends BaseController
{
  protected ?string $model = ThemeTag::class;

  const views = [
    'index' => [
      'title' => 'Tags',
      'description' => 'Manage tags list',
      'fields' => [
        ['name' => 'name', 'primary' => true],
        ['name' => 'slug'],
        ['name' => 'status'],
        ['name' => 'created_at'],
      ],
    ],
    'form' => [
      'sections' => [
        'main' => [
          [
            'header' => [
              'title' => 'Tag Information',
              'description' => 'Basic information about the tag',
            ],
            'fields' => [
              'name',
              'slug',
              'status',
            ],
          ],
        ],
      ],
    ],
  ];
}
