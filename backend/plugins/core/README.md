# PS E-commerce Core

Core library for PS E-commerce platform, providing essential features including admin management, roles & permissions, API keys, configuration system, and modern UI components.

## Features

- **Admin Management**: Complete admin user management system
- **Roles & Permissions**: Flexible role-based permission system powered by Spatie Laravel Permission
- **API Keys**: API key management and authentication
- **Configuration**: Dynamic system configuration management
- **Settings**: Application settings management
- **Notifications**: Notification system
- **Localization**: Multi-language support (i18n)
- **UI Components**: Modern React/TypeScript components built with shadcn/ui
- **Plugin System**: Extensible plugin architecture with automatic page resolution

## Installation

This package is part of the PS E-commerce monorepo and is automatically loaded when installed via Composer.

### Setup Project

After installation, run the setup command to configure templates and install frontend dependencies:

```bash
php artisan essentials:setup
```

**Options:**
- `--force`: Overwrite existing files without confirmation
- `--merge`: Merge with existing files when possible (for `vite.config.ts`, `tsconfig.json`)
- `--skip-npm`: Skip frontend dependencies installation

**What it does:**
- Copies core templates (`app.tsx`, `components.json`, `tailwind.config.ts`, `vite.config.ts`, `tsconfig.json`)
- Merges plugin dependencies from `plugins/core/package.json` into root `package.json`
- Installs frontend dependencies using `pnpm` or `npm`

## Usage

### Base Controller

Extend `CmsController` for automatic CRUD operations:

```php
use PS0132E282\Core\Base\CmsController;
use App\Models\Product;

class ProductController extends CmsController
{
    protected $model = Product::class;
    
    protected function getPage(string $action): string
    {
        return "products/{$action}";
    }
}
```

### Traits

#### HasCrudAction

Provides CRUD operations, filtering, and tree queries:

```php
use PS0132E282\Core\Traits\HasCrudAction;

class CategoryController extends CmsController
{
    use HasCrudAction;
    
    // Tree query
    $categories = Category::query()->tree('parent_id', 'name', 'asc')->get();
}
```

#### HasRolesAndPermissions

Add role and permission management to models:

```php
use PS0132E282\Core\Traits\HasRolesAndPermissions;

class Admin extends Authenticatable
{
    use HasRolesAndPermissions;
}
```

#### AutoTransform

Automatic data transformation for API responses:

```php
use PS0132E282\Core\Traits\AutoTransform;

class ProductController extends CmsController
{
    use AutoTransform;
    
    protected function transform($item) {
        return [
            'id' => $item->id,
            'name' => $item->name,
        ];
    }
}
```

### Route Macros

Use the `module` macro for resource routes:

```php
Route::module('products', ProductController::class);
// Creates: admin.products.index, admin.products.show, etc.
```

### Query Macros

#### Tree Query

Build hierarchical data structures:

```php
$categories = Category::query()
    ->tree('parent_id', 'created_at', 'desc')
    ->get();
```

#### Load Items

Load items with pagination and filtering:

```php
$products = Product::query()
    ->loadItems(function($query) {
        $query->where('status', 'active');
    }, ['per_page' => 20])
    ->get();
```

### Middleware

#### Permission Middleware

```php
Route::middleware(['permission:manage-products'])->group(function() {
    // Routes requiring permission
});
```

#### Role Middleware

```php
Route::middleware(['role:admin'])->group(function() {
    // Routes requiring role
});
```

### Commands

#### Setup Command

```bash
php artisan essentials:setup [--force] [--merge] [--skip-npm]
```

#### Translations Command

```bash
php artisan essentials:translations
```

## Structure

```
plugins/core/
├── src/
│   ├── Base/
│   │   ├── CmsController.php
│   │   ├── PluginManager.php
│   │   └── Traits/
│   │       ├── HasCrudAction.php
│   │       ├── HasRolesAndPermissions.php
│   │       ├── AutoTransform.php
│   │       └── ...
│   ├── Commands/
│   │   ├── SetupCommand.php
│   │   └── TranslationsCommand.php
│   ├── Controllers/
│   │   ├── AdminController.php
│   │   ├── RoleController.php
│   │   └── ...
│   ├── Models/
│   │   ├── Admin.php
│   │   ├── ApiKey.php
│   │   └── ...
│   ├── Middleware/
│   │   ├── PermissionMiddleware.php
│   │   └── RoleMiddleware.php
│   └── Providers/
│       └── CoreServiceProvider.php
├── resources/
│   ├── js/
│   │   ├── pages/
│   │   ├── components/
│   │   └── utils/
│   └── templates/
├── config/
│   ├── configuration.php
│   └── plugins.php
├── composer.json
└── README.md
```

## Plugin Page Resolution

Plugin pages are automatically resolved by Inertia. Pages in `plugins/core/resources/js/pages/` can be accessed via route names like `core/admins/index`.

**Example:**
- Route: `core/admins/index`
- Resolves to: `plugins/core/resources/js/pages/admins/index.tsx`
- Fallback: `plugins/core/resources/js/pages/index.tsx`

## Development

### Formatting

```bash
composer format
```

### Testing

```bash
composer test
```

### Frontend Development

The plugin uses React with TypeScript and shadcn/ui components. Frontend assets are bundled via Vite.

```bash
npm run dev    # Development with HMR
npm run build  # Production build
```

## License

MIT
