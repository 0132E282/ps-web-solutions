<?php

namespace App\Http\Controllers\Theme;

use PS0132E282\Core\Base\BaseController;
use App\Models\Theme\ThemeOption;

class ThemeOptionController extends BaseController
{
  protected ?string $model = ThemeOption::class;

  const views = [
    'index' => [
      'title' => 'Options',
      'description' => 'Manage options list',
      'load-items' => 'tree',
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
              'title' => 'Option Information',
              'description' => 'Basic information about the option',
            ],
            'fields' => [
              'name',

            ],
          ],

        ],
        'sidebar' => [
          [
            'header' => [
              'title' => 'Sidebar',
              'description' => 'Sidebar information',
            ],
            'fields' => [
              'status',
              'parent',
            ],
          ],
        ],
      ],
    ],
  ];
}
