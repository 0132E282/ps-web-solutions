<?php

namespace PS0132E282\Cms\Controllers;

use PS0132E282\Cms\Models\Redirect;
use PS0132E282\Core\Base\BaseController;

class RedirectController extends BaseController
{
    protected ?string $model = Redirect::class;

    const views = [
        'index' => [
            'fields' => [
                'id',
                ['name' => 'old_url', 'config' => ['primary' => true]],
                'new_url',
                'status_code',
                'status',
                'created_at',
            ],
        ],
        'form' => [
            'sections' => [
                'main' => [
                    [
                        'header' => [
                            'title' => 'Thông tin Chuyển hướng',
                            'description' => 'Cấu hình URL cũ và URL mới',
                        ],
                        'fields' => ['old_url', 'new_url'],
                    ],
                ],
                'sidebar' => [
                    [
                        'header' => [
                            'title' => 'Thông tin bổ sung',
                        ],
                        'fields' => ['status', 'status_code'],
                    ],
                ],
            ],
        ],
    ];
}
