<?php

namespace PS0132E282\Cms\Controllers;

use PS0132E282\Cms\Models\Slider;
use PS0132E282\Core\Base\BaseController;

class SliderController extends BaseController
{
    protected ?string $model = Slider::class;

    const views = [
        'index' => [
            'filters' => ['status', 'location'],
            'actions' => ['duplicate' => true],
            'fields' => [
                'image',
                ['name' => 'title', 'config' => ['primary' => true]],
                'status',
                'location',
                'priority',
                'created_at',
            ],
        ],
        'form' => [
            'sections' => [
                'main' => [
                    [
                        'header' => [
                            'title' => 'Thông tin Slider & Banner',
                            'description' => 'Cấu hình thông tin cơ bản của slider và banner',
                        ],
                        'fields' => ['title', 'link', 'target', 'status'],
                    ],
                    [
                        'header' => [
                            'title' => 'Hình ảnh',
                            'description' => 'Hình ảnh hiển thị trên slider hoặc banner',
                        ],
                        'fields' => ['image', 'image_mobile'],
                    ],
                ],
                'sidebar' => [
                    [
                        'header' => [
                            'title' => 'Cài đặt hiển thị',
                            'description' => 'Trạng thái và vị trí hiển thị',
                        ],
                        'fields' => ['location', 'priority'],
                    ],
                ],
            ],
        ],
    ];
}
