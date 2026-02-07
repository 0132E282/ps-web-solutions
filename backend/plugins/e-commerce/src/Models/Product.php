<?php

namespace PS0132E282\ECommerce\Models;

use Aliziodev\LaravelTaxonomy\Traits\HasTaxonomy;
use PS0132E282\Core\Base\BaseModel;
use PS0132E282\Core\Traits\HasSeo;

class Product extends BaseModel
{
    use HasSeo, HasTaxonomy;

    public function configs(): array
    {
        return [
            'title' => ['ui' => 'text', 'config' => ['validation' => 'required|max:255']],
            'content' => ['ui' => 'editor', 'config' => ['validation' => 'required']],
            'slug' => ['ui' => 'slug', 'config' => ['validation' => 'required|max:255']],
            'description' => ['ui' => 'textarea', 'config' => ['validation' => 'required|max:255']],
            'position' => ['ui' => 'text', 'config' => ['validation' => 'required|max:255']],
            'status' => ['ui' => 'button-radio', 'config' => ['layout' => 'horizontal', 'options' => [['label' => 'Published', 'value' => 'published'], ['label' => 'Draft', 'value' => 'draft'], ['label' => 'Archived', 'value' => 'archived']], 'validation' => 'required|in:published,draft,archived']],
            'image' => ['ui' => 'attachment', 'config' => ['validation' => 'required|exists:media,id']],
            'related_products' => ['ui' => 'multiple-selects', 'config' => ['collection' => 'products', 'labelby' => 'title', 'validation' => 'required|exists:products,id']],
            'categories' => ['ui' => 'multiple-selects', 'config' => ['collection' => 'categories', 'labelby' => 'title', 'validation' => 'required|exists:taxonomies,id']],
            'featured' => ['ui' => 'checkbox', 'config' => ['validation' => 'required|boolean']],
            'tags' => ['ui' => 'multiple-selects', 'config' => ['collection' => 'tags', 'labelby' => 'title', 'validation' => 'required|exists:taxonomies,id']],
            'published_at' => ['ui' => 'date', 'config' => ['validation' => 'required|date']],
            'attribute_data' => ['ui' => 'array', 'config' => ['validation' => 'required']],
            'variations' => model_class(class: ProductVariation::class)::productDataVariationConfig(),
            'seo' => $this->seo::configsSingleCondition(),
        ];
    }

    protected $fillable = [
        'name',
        'slug',
        'sku',
        'description',
        'short_description',
        'price',
        'sale_price',
        'cost',
        'quantity',
        'stock_status',
        'weight',
        'length',
        'width',
        'height',
        'status',
        'featured',
        'meta_title',
        'meta_description',
        'meta_keywords',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'sale_price' => 'decimal:2',
        'cost' => 'decimal:2',
        'quantity' => 'integer',
        'weight' => 'decimal:2',
        'length' => 'decimal:2',
        'width' => 'decimal:2',
        'height' => 'decimal:2',
        'featured' => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($product) {
            $product->variations()->delete();
        });
    }

    public function categories()
    {
        return $this->taxonomies()->where('type', 'product_category');
    }

    public function options()
    {
        return $this->taxonomies()->where('type', 'product_option');
    }

    public function variations()
    {
        return $this->hasMany(ProductVariation::class);
    }

    public function related_products()
    {
        return $this->belongsToMany(Product::class, 'product_related_products', 'product_id', 'related_product_id');
    }

    public function tags()
    {
        return $this->taxonomies()->where('type', 'product_tag');
    }
}
