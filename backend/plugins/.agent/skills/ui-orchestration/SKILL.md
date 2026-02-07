---
name: ui-orchestration
description: Autonomously manage and reshape the admin dashboard UI by modifying controller view configurations. Use when you need to add/remove fields, organize sections, or enable UI actions like import/export without touching frontend code.
license: MIT
metadata:
  author: 0132e282
  version: "1.0"
---

# UI Orchestration Skill

This skill allows an agent to control the user interface of the Essentials Admin dashboard directly from the PHP backend.

## 🚀 Capabilities

- **Dynamic Field Management**: Add, remove, or reorder fields in the `index` and `form` views.
- **Section Organization**: Group fields into `main` or `sidebar` sections to optimize the user experience.
- **UI Actions**: Enable or disable global actions like `import`, `export`, and `duplicate`.
- **Intelligent Filtering**: Define filters for the data table (e.g., status, categories).

## 📖 Instructions

1.  **Locate the Controller**: Find the controller extending `BaseController`.
2.  **Define `const views`**:
    - Use the `index` key for table configurations.
    - Use the `form` key for creation/editing layouts.
3.  **Field Configuration**:
    - Simple fields: `'field_name'`
    - Advanced fields: `['name' => 'field_name', 'config' => [...]]`
4.  **Section Management**: Define `sections` within the `form` view to group fields.

## 📝 Example

```php
const views = [
    'index' => [
        'fields'  => ['image', 'title', 'status'],
        'actions' => ['import' => true, 'export' => true]
    ],
    'form' => [
        'sections' => [
            'main' => [
                [
                    'header' => ['title' => 'General'],
                    'fields' => ['title', 'content']
                ]
            ]
        ]
    ]
];
```
