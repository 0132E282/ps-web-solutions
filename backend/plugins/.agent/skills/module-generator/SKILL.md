---
name: module-generator
description: Bootstrap new features and modules using standardized Artisan commands. Use when you need to create a new Model, Controller, and Migration that follows the Essentials ecosystem patterns.
license: MIT
metadata:
  author: 0132e282
  version: "1.0"
---

# Module Generator Skill

This skill allows an agent to rapidly scaffold new features that are fully compatible with the PS Essentials "Zero-Config" CRUD system.

## 🚀 Capabilities

- **Scaffolding**: Generate Model, Controller, and Migration in one command.
- **CRUD Integration**: Automatically extends `BaseController` and `BaseModel`.
- **Architecture Compliance**: Ensures the new module follows the established directory structure and naming conventions.

## 📖 Instructions

1.  **Execute Command**: Run `php artisan ps:make-module {ModuleName}`.
2.  **Verify Files**:
    - `core/src/Models/{ModuleName}.php`
    - `cms/src/Controllers/{ModuleName}Controller.php` (or relevant package)
    - Migration file in `database/migrations/`.
3.  **Refine Model**: Update the `$casts` and `configs()` in the generated Model.
4.  **Refine UI**: Update the `const views` in the generated Controller.

## 📝 Example

```bash
php artisan ps:make-module Post
```

This will create a `Post` model, a `PostController`, and the necessary database migration, all pre-configured to work with the Admin dashboard.
