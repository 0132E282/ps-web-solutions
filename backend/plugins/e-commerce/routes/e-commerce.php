<?php

use Illuminate\Support\Facades\Route;
use PS0132E282\ECommerce\Controllers\ProductController;
use PS0132E282\ECommerce\Controllers\ProductCategoryController;
use PS0132E282\ECommerce\Controllers\ProductOptionController;
use PS0132E282\ECommerce\Controllers\OrderController;

Route::module('products', ProductController::class);
Route::module('product-categories', ProductCategoryController::class);
Route::module('product-options', ProductOptionController::class);
Route::module('orders', OrderController::class);
