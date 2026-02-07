<?php

namespace PS0132E282\ECommerce\Models;

use PS0132E282\Core\Base\BaseModel;

class ProductVariation extends BaseModel
{
    protected $table = 'product_variations';

    protected $fillable = [
        'product_id',
        'sku',
        'barcode',
        'price',
        'name',
        'compare_at_price',
        'cost',
        'price_retail',
        'price_wholesale',
        'price_agency_c3',
        'price_staff',
        'price_import',
        'vat',
        'vat_price',
        'apply_tax',
        'stock_on_hand',
        'stock_available',
        'allow_sale',
        'attribute_name',
        'attribute_value',
        'weight',
        'unit',
        'image',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'compare_at_price' => 'decimal:2',
        'cost' => 'decimal:2',
        'price_retail' => 'decimal:2',
        'price_wholesale' => 'decimal:2',
        'price_agency_c3' => 'decimal:2',
        'price_staff' => 'decimal:2',
        'price_import' => 'decimal:2',
        'vat' => 'decimal:2',
        'vat_price' => 'decimal:2',
        'apply_tax' => 'boolean',
        'allow_sale' => 'boolean',
        'weight' => 'decimal:2',
        'stock_on_hand' => 'integer',
        'stock_available' => 'integer',
    ];

    public function configs(): array
    {
        return [
            'sku' => ['ui' => 'text', 'config' => ['label' => 'Mã SKU', 'validation' => 'required']],
            'image' => ['ui' => 'attachment', 'config' => ['label' => 'Hình ảnh']],
            'is_default' => ['ui' => 'checkbox', 'config' => ['label' => 'Là phiên bản mặc định']],
            'barcode' => ['ui' => 'text', 'config' => ['label' => 'Mã barcode']],
            'name' => ['ui' => 'text', 'config' => ['label' => 'Tên phiên bản', 'validation' => 'required']],
            'weight' => ['ui' => 'number', 'config' => ['label' => 'Khối lượng (g)']],
            'images' => ['ui' => 'multiple-attachments', 'config' => ['label' => 'Hình ảnh']],
            'unit' => ['ui' => 'text', 'config' => ['label' => 'Đơn vị tính']],
            'price_retail' => ['ui' => 'number', 'config' => ['label' => 'Giá bán lẻ', 'validation' => 'required']],
            'price' => ['ui' => 'number', 'config' => ['label' => 'Giá bán', 'validation' => 'required']],
            'price_wholesale' => ['ui' => 'number', 'config' => ['label' => 'Giá bán buôn']],
            'compare_at_price' => ['ui' => 'number', 'config' => ['label' => 'Giá so sánh']],
            'price_agency_c3' => ['ui' => 'number', 'config' => ['label' => 'Giá Đại lý C3']],
            'price_staff' => ['ui' => 'number', 'config' => ['label' => 'Giá CBNV']],
            'events' => ['ui' => 'number', 'config' => ['label' => 'Events']],
            'price_import' => ['ui' => 'number', 'config' => ['label' => 'Giá nhập']],
            'allow_sale' => ['ui' => 'switch', 'config' => ['label' => 'Cho phép bán']],
            'apply_tax' => ['ui' => 'switch', 'config' => ['label' => 'Áp dụng thuế']],
            'options' => ['ui' => 'multiple-selects', 'config' => ['collection' => 'product-options', 'label' => 'Thuộc tính'], 'validation' => 'required'],
        ];
    }

    public static function productDataVariationConfig($ui = 'data-variation', $config = null): array
    {
        return [
            'ui' => $ui,
            'config' => [
                'fields' => ['image', 'name', 'is_default', 'sku', 'price', 'compare_at_price', 'options'],
            ],
        ];
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function options()
    {
        return $this->belongsToMany(ProductOption::class);
    }
}
