<?php

namespace PS0132E282\ECommerce\Controllers;

use PS0132E282\Core\Base\BaseController;
use PS0132E282\ECommerce\Models\Order;

class OrderController extends BaseController
{
    protected ?string $model = Order::class;

    const views = [
        'index' => [
            'title' => 'Orders',
            'description' => 'Manage customer orders',
            'fields' => [
                ['name' => 'order_number', 'config' => ['primary' => true]],
                'customer_email',
                'total',
                'status',
                'payment_status',
                'created_at'
            ],
        ],
        'form' => [
            'sections' => [
                'main' => [
                    [
                        'header' => [
                            'title' => 'Order Information',
                            'description' => 'Basic order details',
                        ],
                        'fields' => ['order_number', 'customer_email', 'customer_first_name', 'customer_last_name', 'customer_phone'],
                    ],
                    [
                        'header' => [
                            'title' => 'Billing Address',
                            'description' => 'Customer billing information',
                        ],
                        'fields' => ['billing_address_1', 'billing_address_2', 'billing_city', 'billing_state', 'billing_postcode', 'billing_country'],
                    ],
                    [
                        'header' => [
                            'title' => 'Shipping Address',
                            'description' => 'Delivery address',
                        ],
                        'fields' => ['shipping_address_1', 'shipping_address_2', 'shipping_city', 'shipping_state', 'shipping_postcode', 'shipping_country'],
                    ],
                    [
                        'header' => [
                            'title' => 'Order Totals',
                            'description' => 'Financial breakdown',
                        ],
                        'fields' => ['subtotal', 'tax', 'shipping', 'discount', 'total'],
                    ],
                ],
                'sidebar' => [
                    [
                        'header' => [
                            'title' => 'Status',
                            'description' => 'Order and payment status',
                        ],
                        'fields' => ['status', 'payment_status', 'payment_method'],
                    ],
                    [
                        'header' => [
                            'title' => 'Notes',
                            'description' => 'Additional information',
                        ],
                        'fields' => ['customer_note', 'admin_note'],
                    ],
                ],
            ],
        ],
    ];
}
