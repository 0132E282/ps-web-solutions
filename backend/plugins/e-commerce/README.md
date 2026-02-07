# E-Commerce Plugin

A comprehensive e-commerce solution for the PS E-Commerce platform.

## Features

- 🛍️ Product Management
- 📦 Category & Taxonomy System
- 🎨 Product Options & Variants
- 🛒 Shopping Cart
- 💳 Multiple Payment Methods
- 📊 Order Management
- 💰 Tax & Shipping Calculation
- ⭐ Product Reviews
- 📈 Inventory Management

## Installation

The plugin is automatically loaded via Composer's PSR-4 autoloading.

## Configuration

Publish the configuration file:

```bash
php artisan vendor:publish --tag=e-commerce-config
```

Configuration options are available in `config/e-commerce.php`.

## Environment Variables

Add these to your `.env` file:

```env
# E-Commerce Settings
ECOMMERCE_ENABLED=true

# Currency
ECOMMERCE_CURRENCY=USD
ECOMMERCE_CURRENCY_SYMBOL=$
ECOMMERCE_CURRENCY_POSITION=before
ECOMMERCE_CURRENCY_DECIMALS=2

# Tax
ECOMMERCE_TAX_ENABLED=true
ECOMMERCE_TAX_RATE=10
ECOMMERCE_TAX_INCLUDED=false

# Shipping
ECOMMERCE_SHIPPING_ENABLED=true
ECOMMERCE_FREE_SHIPPING_THRESHOLD=100

# Product
ECOMMERCE_ALLOW_REVIEWS=true
ECOMMERCE_STOCK_MANAGEMENT=true
ECOMMERCE_LOW_STOCK_THRESHOLD=10

# Order
ECOMMERCE_ORDER_PREFIX=ORD-
ECOMMERCE_AUTO_CONFIRM=false

# Cart
ECOMMERCE_CART_LIFETIME=10080
ECOMMERCE_GUEST_CHECKOUT=true
```

## Usage

### Models

- `Product` - Product model
- `ProductCategory` - Category model using Taxonomy
- `ProductOption` - Product options/variants
- `Order` - Order model
- `OrderItem` - Order item model

### Controllers

- `ProductController` - Manage products
- `ProductCategoryController` - Manage categories
- `ProductOptionController` - Manage product options
- `OrderController` - Manage orders
- `ShopController` - Frontend shop
- `CartController` - Shopping cart
- `CheckoutController` - Checkout process

## License

MIT
