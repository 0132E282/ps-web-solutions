<?php

use Illuminate\Support\Facades\Route;
use PS0132E282\ECommerce\Controllers\OrderController;
use PS0132E282\ECommerce\Controllers\ProductCategoryController;
use PS0132E282\ECommerce\Controllers\ProductController;
use PS0132E282\ECommerce\Controllers\ProductOptionController;
use PS0132E282\ECommerce\Controllers\ProductVariantController;

// # GOOD: Sử dụng Route Macro 'admin' để xử lý domain/subdomain linh hoạt
Route::admin(function () {

    Route::module('products', ProductController::class);
    Route::module('product-categories', ProductCategoryController::class);
    Route::module('product-variants', ProductVariantController::class);
    Route::module('product-options', ProductOptionController::class);
    Route::module('orders', OrderController::class);
});
