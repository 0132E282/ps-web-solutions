<?php
/*
 * @var array $configs['sidebar'] : Sidebar config
 * @var array $configs['configs'] : Configs config
 * icon: use lucide-react
*/

return [
  'prefix' => env('ADMIN_PREFIX', null),
  'sidebar' => [
    'top' => [
      [
        'title' => 'Dashboard',
        'route' => 'admin.site.dashboard',
        'icon' => 'LayoutGrid',
      ],
      [
        'title' => 'Themes',
        'icon' => 'Package',
        'children' => [
          [
            'title' => 'Themes',
            'route' => 'admin.themes.index',
          ],
          [
            'title' => 'Danh mục themes',
            'route' => 'admin.theme-categories.index',
          ],
          [
            'title' => 'Options themes',
            'route' => 'admin.theme-options.index',
          ],
        ],
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
        'title' => 'Dự án',
        'icon' => 'FolderKanban',
        'children' => [
          [
            'title' => 'Danh sách dự án',
            'route' => 'admin.projects.index',
          ],
          [
            'title' => 'Danh mục dự án',
            'route' => 'admin.project-categories.index',
          ],
        ],
      ],
      [
        'title' => 'Website',
        'icon' => 'Globe',
        'children' => [
          [
            'title' => 'Slider & Banner',
            'route' => 'admin.sliders.index',
          ],
          [
            'title' => 'Menus',
            'route' => 'admin.menus.index',
          ],
          [
            'title' => 'Điều hướng',
            'route' => 'admin.redirects.index',
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
        'route' => 'admin.account.index',
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
