# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Laravel 12 + React 19 application with Inertia.js, using a modular plugin architecture (PS Essentials Utils). Features zero-config CRUD, dynamic UI generation, and automatic plugin discovery.

## Development Commands

```bash
# Start development (PHP server, queue, logs, Vite HMR)
composer dev

# Start with SSR
composer dev:ssr

# Run tests
composer test               # Full suite (lint + PHPUnit)
php artisan test --filter=MethodName  # Single test

# Linting and formatting
composer lint               # Fix PHP with Pint
npm run lint                # Fix JS/TS with ESLint
npm run format              # Format with Prettier
npm run types               # TypeScript type check

# Build
npm run build               # Production build
npm run build:ssr           # Build with SSR
```

## Architecture

### Backend (Laravel)

Controllers extend `BaseController` or `CmsController` from the plugin system. Configuration is declarative via the `const views` property:

```php
class PostController extends BaseController
{
    protected ?string $model = Post::class;

    const views = [
        'index' => [
            'filters' => ['status'],
            'fields' => ['title', 'status', 'created_at'],
        ],
        'form' => [
            'sections' => [
                'main' => [['fields' => ['title', 'content']]],
            ]
        ]
    ];
}
```

Route macro for resources:
```php
Route::module('products', ProductController::class);
```

### Frontend (React/TypeScript)

- **Entry**: `resources/js/app.tsx` (Inertia auto-init)
- **Pages**: `resources/js/pages/*.tsx` (auto-resolved by Vite glob)
- **Layouts**: `AppLayout`, `AuthLayout`, `SettingsLayout`
- **Components**: shadcn/ui primitives in `components/ui/`
- **State**: Redux Toolkit + Redux Saga in `actions/`
- **Validation**: Zod schemas with React Hook Form

### Plugin System

Plugins live in `plugins/` and are auto-discovered:
- `core/` - Base classes, UI components, utilities
- `cms/` - Posts, categories, roles
- `e-commerce/` - Products, orders
- `notifications/` - Notification system

Plugin pages auto-resolve: route `core/admins/index` → `plugins/core/resources/js/pages/admins/index.tsx`

### Import Aliases (tsconfig.json)

```typescript
@/*        → resources/js/*
@core/*    → plugins/core/resources/js/*
@plugins/* → plugins/*
@routes/*  → resources/js/routes/*
```

## Key Patterns

### Standardized API Responses

```php
use PS0132E282\Core\Base\Resource;

return Resource::item($user);      // Single item
return Resource::items($users);    // Collection with pagination
return Resource::error('msg', [], 503);
```

### Query Macros

```php
// Tree structure for hierarchical data
Category::query()->tree('parent_id', 'name', 'asc')->get();

// Paginated loading with filters
Product::query()->loadItems(fn($q) => $q->where('status', 'active'), ['per_page' => 20]);
```

### Artisan Commands

```bash
php artisan essentials:setup    # Initial project setup
php artisan ps:make-module      # Generate module structure
php artisan essentials:translations  # Sync translations
```

## Database

Uses SQLite by default (`database/database.sqlite`). Eloquent models in `app/Models/` and `plugins/*/src/Models/`.

## Testing

PHPUnit for backend tests. Run `composer test` which clears config cache, runs lint check, then executes tests.

## Tech Stack Reference

- PHP 8.2+, Laravel 12, Inertia.js 2
- React 19, TypeScript 5.7, Vite 7
- Tailwind CSS 4, shadcn/ui, Radix UI
- Redux Toolkit, Redux Saga
- Zod validation, React Hook Form
- i18next for internationalization
- Laravel Fortify for 2FA
