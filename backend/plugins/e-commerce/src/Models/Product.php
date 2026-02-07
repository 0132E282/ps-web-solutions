<?php

namespace PS0132E282\ECommerce\Models;

use Aliziodev\LaravelTaxonomy\Traits\HasTaxonomy;
use PS0132E282\Core\Base\BaseModel;

class Product extends BaseModel
{
    use HasTaxonomy;

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

    /**
     * Get product categories
     */
    public function categories()
    {
        return $this->getTaxonomies('product_category');
    }

    /**
     * Get product options
     */
    public function options()
    {
        return $this->getTaxonomies('product_option');
    }

    /**
     * Scope for published products
     */
    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    /**
     * Scope for featured products
     */
    public function scopeFeatured($query)
    {
        return $query->where('featured', true);
    }

    /**
     * Check if product is in stock
     */
    public function isInStock(): bool
    {
        return $this->stock_status === 'in_stock' && $this->quantity > 0;
    }

    /**
     * Get display price (sale price if available, otherwise regular price)
     */
    public function getDisplayPrice()
    {
        return $this->sale_price ?: $this->price;
    }
}
