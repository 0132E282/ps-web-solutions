<?php

namespace PS0132E282\ECommerce\Models;

use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    protected $fillable = [
        'order_id',
        'product_id',
        'product_name',
        'product_sku',
        'product_options',
        'quantity',
        'price',
        'subtotal',
        'tax',
        'total',
    ];

    protected $casts = [
        'product_options' => 'array',
        'quantity' => 'integer',
        'price' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'tax' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    /**
     * Relationships
     */
    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Calculate totals
     */
    public function calculateTotals()
    {
        $this->subtotal = $this->price * $this->quantity;
        
        // Calculate tax if enabled
        if (config('e-commerce.tax.enabled')) {
            $taxRate = config('e-commerce.tax.rate', 0) / 100;
            $this->tax = $this->subtotal * $taxRate;
        }
        
        $this->total = $this->subtotal + $this->tax;
    }
}
