# PS Essentials Utils

[![Latest Version on Packagist](https://img.shields.io/packagist/v/0132e282/essentials-utils.svg?style=flat-square)](https://packagist.org/packages/0132e282/essentials-utils)
[![Total Downloads](https://img.shields.io/packagist/dt/0132e282/essentials-utils.svg?style=flat-square)](https://packagist.org/packages/0132e282/essentials-utils)
[![License](https://img.shields.io/packagist/l/0132e282/essentials-utils.svg?style=flat-square)](https://packagist.org/packages/0132e282/essentials-utils)

**PS Essentials Utils** is a powerful, "Zero-Config" utility library for the Laravel framework. It provides the architectural foundation for a flexible plugin ecosystem, featuring a robust CRUD system, automated UI generation, and core enhancements for e-commerce and CMS modules.

---

## 🚀 Key Features

- **⚡ Zero-Config CRUD**: Automatically generates index, create, edit, and delete functionality based on model definitions.
- **🖥️ Dynamic UI Generation**: Define your dashboard UI (fields, sections, filters, actions) directly in your Controller using a simple PHP configuration.
- **🔄 Intelligent Request Transformation**: Automatic handling of nested fields, localized data, and file uploads.
- **📦 Modular Architecture**: Pre-built components for CMS, E-commerce, and Notifications.
- **🛠️ Laravel Enhancements**: Custom macros, base classes, and a suite of Artisan commands for rapid development.
- **📱 Inertia.js Integration**: First-class support for Inertia.js views and data fetching.

---

## 📁 Directory Structure

```text
ps-essentials-utils/
├── core/                # Core logic and base architectural classes
│   └── src/
│       ├── Base/        # Base Controllers, Services, Repositories, Resources
│       ├── Commands/    # Custom Artisan Commands (Setup, Module Generation)
│       ├── Models/      # Core Models (BaseModel, BaseTerm)
│       ├── Providers/   # Service Providers
│       └── Traits/      # Reusable Logic (CRUD, Relationships, Localization)
├── cms/                 # CMS Module (Posts, Categories, Roles, Settings)
├── e-commerce/          # E-commerce Module (Products, Orders, Categories)
├── notifications/       # Notification system utilities and services
├── composer.json        # Project dependencies and autoloading
└── README.md            # Extensive project documentation
```

---

## 🛠️ Requirements

- **PHP**: `^8.2`
- **Laravel**: `^12.0`
- **Inertia.js**: `^2.0`
- **Composer**: `^2.9`

---

## ⚙️ Installation

Install the package via Composer:

```bash
composer require 0132e282/essentials-utils
```

### Service Provider Registration

The package uses Laravel's auto-discovery. If you need manual registration, add these to `config/app.php`:

```php
'providers' => [
    PS0132E282\Core\Providers\CoreServiceProvider::class,
    PS0132E282\Core\Providers\MacroServiceProvider::class,
],
```

---

## 📖 Usage Guide

### 1. Extending Base Controller

Leverage the powerful `BaseController` to handle standard CRUD operations with minimal code.

```php
use PS0132E282\Core\Base\BaseController;
use App\Models\Post;

class PostController extends BaseController
{
    protected ?string $model = Post::class;

    const views = [
        'index' => [
            'filters' => ['status', 'category_id'],
            'actions' => ['import' => true, 'export' => true, 'duplicate' => true],
            'fields'  => [
                'image',
                ['name' => 'title', 'config' => ['primary' => true]],
                'status',
                'created_at',
            ],
        ],
        'form' => [
            'sections' => [
                'main' => [
                    [
                        'header' => ['title' => 'Basic Info', 'description' => 'Enter post details'],
                        'fields' => ['title', 'content', 'description'],
                    ],
                ],
                'sidebar' => [
                    [
                        'header' => ['title' => 'Settings'],
                        'fields' => ['image', 'status', 'published_at'],
                    ],
                ],
            ]
        ]
    ];
}
```

### 2. Standardized JSON Responses

Use the `Resource` class to return consistent API responses for single items or collections with pagination.

```php
use PS0132E282\Core\Base\Resource;

// Success with single item
return Resource::item($user);

// Success with collection/paginator
return Resource::items($users);

// Error response
return Resource::error('System busy', [], 503);
```

### 3. CMS Module Features

The `cms` package provides pre-built controllers and models for common CMS tasks:
- **Admin Management**: `AdminController`, `RoleController`
- **Content**: `PostController`, `PostCategoryController`, `PostTagController`
- **System**: `FileController`, `SettingController`, `LocaleController`

### 4. Custom Artisan Commands

Streamline your workflow with these custom commands:

| Command | Description |
| :--- | :--- |
| `php artisan ps:setup` | Run initial setup for the Essentials ecosystem. |
| `php artisan ps:make-module` | Generate a new module structure (Controller, Model, Migration). |
| `php artisan ps:translations` | Manage and sync localized strings. |

---

## 🤖 Agentic Capabilities (AI Skills)

This library is built with **"AI-First"** principles. It exports a set of structured skills that allow AI agents to manage your application with high autonomy.

👉 **View the full [Agent Skills](file:///Users/hoangphuc01975/Documents/developers/ps-essentials-utils/.agent/skills/)**

---

## 📜 License

The MIT License (MIT). Please see [License File](LICENSE.md) for more information.

---

Built with ❤️ by [0132e282](https://github.com/0132e282)
