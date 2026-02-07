<?php

use Illuminate\Support\Facades\Route;
use PS0132E282\Core\Http\Controllers\Api\ItemController;

Route::group(['prefix' => 'api/items', 'middleware' => ['api']], function () {
    Route::get('{resource}', [ItemController::class, 'index'])->name('api.items.index');
    Route::post('{resource}', [ItemController::class, 'store'])->name('api.items.store');
    Route::get('{resource}/{id}', [ItemController::class, 'show'])->name('api.items.show');
});
