<?php

/*
 * @var array $configs['sidebar'] : Sidebar config
 * @var array $configs['configs'] : Configs config
 * icon: use lucide-react
*/

return [
    'sidebar' => [
        'top' => [
            [
                'title' => 'Dashboard',
                'route' => 'admin.site.index',
                'icon' => 'LayoutGrid',
            ],
            [
                'title' => 'Bài viết',
                'icon' => 'FileText',
                'children' => [
                    [
                        'title' => 'Danh sách bài viết',
                        'route' => 'admin.posts.index',
                    ],
                    [
                        'title' => 'Danh mục bài viết',
                        'route' => 'admin.post-categories.index',
                    ],
                    [
                        'title' => 'Tag bài viết',
                        'route' => 'admin.post-tags.index',
                    ],
                ],
            ],
            [
                'title' => 'Sản phẩm',
                'icon' => 'Package',
                'children' => [
                    [
                        'title' => 'Danh sách sản phẩm',
                        'route' => 'admin.products.index',
                    ],
                    [
                        'title' => 'Danh mục sản phẩm',
                        'route' => 'admin.product-categories.index',
                    ],
                    [
                        'title' => 'Tag sản phẩm',
                        'route' => 'admin.product-tags.index',
                    ],
                    [
                        'title' => 'Thuộc tính sản phẩm',
                        'route' => 'admin.product-options.index',
                    ],
                ],
            ],
            [
                'title' => 'Website',
                'icon' => 'Globe',
                'children' => [
                    [
                        'title' => 'Slider',
                        'route' => 'admin.sliders.index',
                    ],
                    [
                        'title' => 'Chuyển hướng',
                        'route' => 'admin.redirects.index',
                    ],
                    [
                        'title' => 'Menu',
                        'route' => 'admin.menus.index',
                    ],

                ],
            ],
        ],
        'bottom' => [
            [
                'title' => 'Hệ thống',
                'route' => 'admin.settings.index',
                'icon' => 'Settings2',
            ],
            [
                'title' => 'Tệp tin',
                'route' => 'admin.files.index',
                'icon' => 'Layers',
            ],
        ],
        'account' => [
            [
                'title' => 'Tài khoản',
                'route' => 'admin.account.profile',
                'icon' => 'User',
            ],
        ],
    ],
    'configs' => [
        'sections' => [
            [
                'title' => 'Thiết lập hệ thống',
                'cards' => [
                    [
                        'title' => 'Website',
                        'description' => 'Quản lý thông tin website',
                        'icon' => 'Globe',
                        'route' => 'admin.settings.show',
                        'params' => ['key' => 'website'],
                    ],
                    [
                        'title' => 'Vai trò',
                        'description' => 'Quản lý vai trò và phân quyền',
                        'icon' => 'Users',
                        'route' => 'admin.settings.roles.index',
                    ],
                    [
                        'title' => 'Nhân viên',
                        'description' => 'Quản lý nhân viên',
                        'icon' => 'Settings',
                        'route' => 'admin.admins.index',
                    ],
                    [
                        'title' => 'Khóa API',
                        'description' => 'Quản lý khóa API',
                        'icon' => 'Key',
                        'route' => 'admin.settings.application-keys.index',
                    ],
                    [
                        'title' => 'Nhật ký hoạt động',
                        'description' => 'Quản lý nhật ký hoạt động',
                        'icon' => 'Clock',
                        'route' => 'admin.settings.activity-logs.index',
                    ],
                ],
            ],
        ],
    ],
];
