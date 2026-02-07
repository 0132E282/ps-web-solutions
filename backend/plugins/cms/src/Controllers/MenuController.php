<?php

namespace PS0132E282\Cms\Controllers;

use PS0132E282\Cms\Models\Menu;
use PS0132E282\Core\Base\BaseController;

class MenuController extends BaseController
{
    protected ?string $model = Menu::class;

    const views = [
        'index' => [
            'fields' => [
                'id',
                ['name' => 'title', 'config' => ['primary' => true]],
                'location',
                'type',
                'status',
                'position',
                'created_at',
            ],
        ],
        'form' => [
            'sections' => [
                'main' => [
                    [
                        'header' => [
                            'title' => 'Thông tin Menu',
                            'description' => 'Cấu hình tiêu đề và vị trí của menu',
                        ],
                        'fields' => ['title', 'type', 'value'],
                    ],
                ],
                'sidebar' => [
                    [
                        'header' => [
                            'title' => 'Cài đặt hiển thị',
                            'description' => 'Trạng thái và vị trí hiển thị',
                        ],
                        'fields' => ['status', 'location', 'position', 'parent'],
                    ],
                ],
            ],
        ],
    ];
}
