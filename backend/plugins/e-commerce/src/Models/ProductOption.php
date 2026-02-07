<?php

namespace PS0132E282\ECommerce\Models;

use PS0132E282\Core\Base\BaseTerm;

class ProductOption extends BaseTerm
{
    protected function getTaxonomyName(): string
    {
        return 'product_option';
    }

    public function configs(): array
    {
        return [
            'name' => ['type' => 'text', 'config' => ['label' => 'Option Name', 'placeholder' => 'e.g., size, color, material', 'validation' => 'required|max:255']],
            'slug' => ['type' => 'slug', 'config' => ['label' => 'Slug', 'validation' => 'required|max:255']],
            'property.type' => ['type' => 'button-radio', 'config' => ['label' => 'Option Type', 'options' => [['label' => 'Select', 'value' => 'select'], ['label' => 'Radio', 'value' => 'radio'], ['label' => 'Checkbox', 'value' => 'checkbox']], 'validation' => 'required|in:select,radio,checkbox']],
            'property.values' => ['type' => 'repeater', 'config' => ['label' => 'Option Values', 'fields' => ['label' => ['type' => 'text', 'config' => ['label' => 'Label', 'validation' => 'required']], 'value' => ['type' => 'text', 'config' => ['label' => 'Value', 'validation' => 'required']], 'price_modifier' => ['type' => 'number', 'config' => ['label' => 'Price Modifier', 'validation' => 'nullable|numeric']]], 'validation' => 'nullable|array']],
            'property.is_required' => ['type' => 'switch', 'config' => ['label' => 'Required', 'validation' => 'boolean']],
            'sort_order' => ['type' => 'number', 'config' => ['label' => 'Sort Order', 'placeholder' => '0', 'validation' => 'integer|min:0']],
            'parent' => ['type' => 'select', 'config' => ['label' => 'Parent Option', 'collection' => 'product_options', 'validation' => 'nullable|exists:taxonomies,id']],
            'status' => ['type' => 'button-radio', 'config' => ['label' => 'Status', 'options' => [['label' => 'Published', 'value' => 'published'], ['label' => 'Draft', 'value' => 'draft']], 'validation' => 'required|in:published,draft']],
            'children' => ['type' => 'collection', 'config' => ['label' => 'Children Options', 'collection' => 'product_options']],
        ];
    }

 
    public function products()
    {
        return $this->attachedModels(Product::class);
    }
}
