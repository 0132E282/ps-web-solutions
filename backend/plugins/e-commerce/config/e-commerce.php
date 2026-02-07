<?php

return [
    /*
    |--------------------------------------------------------------------------
    | E-Commerce Plugin Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains configuration settings for the e-commerce plugin
    |
    */

    'enabled' => env('ECOMMERCE_ENABLED', true),

    /*
    |--------------------------------------------------------------------------
    | Currency Settings
    |--------------------------------------------------------------------------
    */
    'currency' => [
        'default' => env('ECOMMERCE_CURRENCY', 'USD'),
        'symbol' => env('ECOMMERCE_CURRENCY_SYMBOL', '$'),
        'position' => env('ECOMMERCE_CURRENCY_POSITION', 'before'), // before or after
        'decimals' => env('ECOMMERCE_CURRENCY_DECIMALS', 2),
        'decimal_separator' => env('ECOMMERCE_DECIMAL_SEPARATOR', '.'),
        'thousand_separator' => env('ECOMMERCE_THOUSAND_SEPARATOR', ','),
    ],

    /*
    |--------------------------------------------------------------------------
    | Tax Settings
    |--------------------------------------------------------------------------
    */
    'tax' => [
        'enabled' => env('ECOMMERCE_TAX_ENABLED', true),
        'rate' => env('ECOMMERCE_TAX_RATE', 10), // percentage
        'included_in_price' => env('ECOMMERCE_TAX_INCLUDED', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Shipping Settings
    |--------------------------------------------------------------------------
    */
    'shipping' => [
        'enabled' => env('ECOMMERCE_SHIPPING_ENABLED', true),
        'free_shipping_threshold' => env('ECOMMERCE_FREE_SHIPPING_THRESHOLD', 100),
    ],

    /*
    |--------------------------------------------------------------------------
    | Product Settings
    |--------------------------------------------------------------------------
    */
    'product' => [
        'allow_reviews' => env('ECOMMERCE_ALLOW_REVIEWS', true),
        'review_approval' => env('ECOMMERCE_REVIEW_APPROVAL', true),
        'stock_management' => env('ECOMMERCE_STOCK_MANAGEMENT', true),
        'low_stock_threshold' => env('ECOMMERCE_LOW_STOCK_THRESHOLD', 10),
    ],

    /*
    |--------------------------------------------------------------------------
    | Order Settings
    |--------------------------------------------------------------------------
    */
    'order' => [
        'prefix' => env('ECOMMERCE_ORDER_PREFIX', 'ORD-'),
        'auto_confirm' => env('ECOMMERCE_AUTO_CONFIRM', false),
        'statuses' => [
            'pending' => ['label' => 'Pending', 'color' => 'yellow'],
            'processing' => ['label' => 'Processing', 'color' => 'blue'],
            'completed' => ['label' => 'Completed', 'color' => 'green'],
            'cancelled' => ['label' => 'Cancelled', 'color' => 'red'],
            'refunded' => ['label' => 'Refunded', 'color' => 'gray'],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Payment Settings
    |--------------------------------------------------------------------------
    */
    'payment' => [
        'methods' => [
            'cod' => ['label' => 'Cash on Delivery', 'enabled' => true],
            'bank_transfer' => ['label' => 'Bank Transfer', 'enabled' => true],
            'paypal' => ['label' => 'PayPal', 'enabled' => false],
            'stripe' => ['label' => 'Stripe', 'enabled' => false],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Cart Settings
    |--------------------------------------------------------------------------
    */
    'cart' => [
        'session_lifetime' => env('ECOMMERCE_CART_LIFETIME', 60 * 24 * 7), // 7 days in minutes
        'allow_guest_checkout' => env('ECOMMERCE_GUEST_CHECKOUT', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | VAPF (Variant/Attribute/Price/Filter) Settings
    |--------------------------------------------------------------------------
    | Configuration for product variants, attributes, pricing modifiers, and filters
    */
    'vapf' => [
        // Variant Settings
        'variants' => [
            'enabled' => env('ECOMMERCE_VARIANTS_ENABLED', true),
            'max_options_per_product' => env('ECOMMERCE_MAX_OPTIONS', 10),
            'max_values_per_option' => env('ECOMMERCE_MAX_VALUES_PER_OPTION', 50),
            'allow_multiple_selection' => env('ECOMMERCE_ALLOW_MULTIPLE_SELECTION', false),
            'generate_sku_from_variant' => env('ECOMMERCE_GENERATE_VARIANT_SKU', true),
        ],

        // Attribute Settings
        'attributes' => [
            'default_types' => ['select', 'radio', 'checkbox', 'color', 'image'],
            'required_by_default' => env('ECOMMERCE_ATTRIBUTES_REQUIRED_DEFAULT', false),
            'show_in_listing' => env('ECOMMERCE_SHOW_ATTRIBUTES_LISTING', true),
            'show_in_filters' => env('ECOMMERCE_SHOW_ATTRIBUTES_FILTERS', true),
        ],

        // Price Modifier Settings
        'price_modifiers' => [
            'enabled' => env('ECOMMERCE_PRICE_MODIFIERS_ENABLED', true),
            'type' => env('ECOMMERCE_PRICE_MODIFIER_TYPE', 'fixed'), // fixed or percentage
            'allow_negative' => env('ECOMMERCE_ALLOW_NEGATIVE_MODIFIERS', false),
            'apply_tax_to_modifiers' => env('ECOMMERCE_TAX_ON_MODIFIERS', true),
        ],

        // Filter Settings
        'filters' => [
            'enabled' => env('ECOMMERCE_FILTERS_ENABLED', true),
            'show_count' => env('ECOMMERCE_SHOW_FILTER_COUNT', true),
            'collapse_by_default' => env('ECOMMERCE_COLLAPSE_FILTERS', false),
            'max_visible_options' => env('ECOMMERCE_MAX_VISIBLE_FILTER_OPTIONS', 10),
            'enable_search' => env('ECOMMERCE_FILTER_SEARCH_ENABLED', true),
        ],

        // Datatable Display Settings
        'datatable' => [
            'show_thumbnail' => env('ECOMMERCE_DATATABLE_SHOW_THUMBNAIL', true),
            'show_price_modifier' => env('ECOMMERCE_DATATABLE_SHOW_PRICE_MODIFIER', true),
            'show_stock_status' => env('ECOMMERCE_DATATABLE_SHOW_STOCK', true),
            'default_sort' => env('ECOMMERCE_DATATABLE_SORT', 'sort_order'), // sort_order, name, created_at
            'items_per_page' => env('ECOMMERCE_DATATABLE_PER_PAGE', 25),
        ],

        // Validation Rules
        'validation' => [
            'option_name_max_length' => 255,
            'option_value_max_length' => 255,
            'option_slug_pattern' => '^[a-z0-9]+(?:-[a-z0-9]+)*$',
        ],
    ],
];
