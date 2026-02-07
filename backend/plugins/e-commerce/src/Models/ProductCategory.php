<?php

namespace PS0132E282\ECommerce\Models;

use PS0132E282\Core\Base\BaseTerm;

class ProductCategory extends BaseTerm
{
    protected function getTaxonomyName(): string
    {
        return 'product_category';
    }

    public function configs(): array
    {
        return [
            'name' => ['type' => 'text', 'config' => ['label' => 'Category Name', 'placeholder' => 'e.g., Electronics, Clothing', 'validation' => 'required|max:255']],
            'slug' => ['type' => 'slug', 'config' => ['label' => 'Slug', 'validation' => 'required|max:255']],
            'description' => ['type' => 'textarea', 'config' => ['label' => 'Description', 'validation' => 'nullable']],
            'sort_order' => ['type' => 'number', 'config' => ['label' => 'Sort Order', 'placeholder' => '0', 'validation' => 'integer|min:0']],
            'parent' => ['type' => 'select', 'config' => ['label' => 'Parent Category', 'collection' => 'product_categories', 'validation' => 'nullable|exists:taxonomies,id']],
            'status' => ['type' => 'button-radio', 'config' => ['label' => 'Status', 'options' => [['label' => 'Published', 'value' => 'published'], ['label' => 'Draft', 'value' => 'draft']], 'validation' => 'required|in:published,draft']],
            'children' => ['type' => 'collection', 'config' => ['label' => 'Subcategories', 'collection' => 'product_categories']],
        ];
    }

    public function products()
    {
        return $this->attachedModels(Product::class);
    }
}
