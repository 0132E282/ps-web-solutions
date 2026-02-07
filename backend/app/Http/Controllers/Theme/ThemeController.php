<?php

namespace App\Http\Controllers\Theme;

use PS0132E282\Core\Base\BaseController;
use App\Models\Theme;

class ThemeController extends BaseController
{
  /**
   * The model associated with this controller.
   *
   * @var string
   */
  protected ?string $model = Theme::class;

  const views = [
    'index' => [
      'title' => 'Themes',
      'description' => 'Manage themes list',
      'fields' => [
        ['name' => 'image', 'width' => 20],
        ['name' => 'name', 'primary' => true],
        ['name' => 'price'],
        ['name' => 'compare_at_price'],
        ['name' => 'created_at'],
      ],
    ],
    'form' => [
      'sections' => [
        'main' => [
          [
            'header' => [
              'title' => 'Theme Information',
              'description' => 'Basic information about the theme',
            ],
            'fields' => [
              'image',
              'images',
              'name',
              'link_download',
              ['name' => 'price', 'width' => 'md'],
              ['name' => 'compare_at_price', 'width' => 'md'],
              'content',
            ],
          ],
        ],
        'sidebar' => [
          [
            'header' => [
              'title' => 'Theme Information',
              'description' => 'Basic information about the theme',
            ],
            'fields' => [
              'status',
              ['name' => 'view_count', 'disabled' => true]
            ],
          ],
        ],
      ],
    ],
  ];
}
