<?php

namespace App\Http\Controllers\Content;

use PS0132E282\Core\Base\BaseController;
use App\Models\Content\Project;

class ProjectController extends BaseController
{
  /**
   * The model associated with this controller.
   *
   * @var string
   */
  protected ?string $model = Project::class;

  const views = [
    'index' => [
      'title' => 'Projects',
      'description' => 'Manage portfolio projects',
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
              'title' => 'Project Information',
              'description' => 'Basic information about the project',
            ],
            'fields' => [
              'image',
              'name',
              'slug',
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
            ],
          ],
        ],
      ],
    ],
  ];
}
