# CMS Plugin

CMS plugin built on top of Core plugin, providing content management functionality.

## Features

- Built on Core plugin infrastructure
- Uses Core's CmsController for automatic CRUD operations
- Leverages Core's UI components and utilities
- Extensible architecture

## Installation

This plugin requires the Core plugin to be installed first.

```bash
composer require 0132e282/cms
```

## Usage

### Controllers

Extend `PS0132E282\Core\Base\CmsController` to use Core's CRUD functionality:

```php
use PS0132E282\Core\Base\CmsController;

class PostController extends CmsController
{
    protected ?string $model = Post::class;
    
    const views = [
        'index' => [
            'title' => 'Posts',
            'fields' => [
                ['accessorKey' => 'title', 'config' => ['type' => 'text']],
            ],
        ],
        'form' => [
            'title' => 'Post',
            'sections' => [
                'main' => [
                    [
                        'header' => ['title' => 'Post Details'],
                        'fields' => [
                            ['accessorKey' => 'title', 'config' => ['required' => true]],
                        ],
                    ],
                ],
            ],
        ],
    ];
}
```

### Frontend

Use Core's components in your React/TypeScript pages:

```tsx
import { Form } from '@core/components/form';
import { Section } from '@core/components/section';
import AppLayout from '@core/layouts/app-layout';
```

## Structure

```
cms/
├── src/
│   ├── Controllers/     # Controllers using Core's CmsController
│   ├── Models/          # CMS models
│   └── Providers/       # Service providers
├── routes/              # Route definitions
├── resources/js/        # Frontend resources
└── config/             # Configuration files
```










