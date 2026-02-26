<?php

use Illuminate\Support\Facades\Route;
use PS0132E282\Cms\Controllers\AdminController;
use PS0132E282\Cms\Controllers\MenuController;
use PS0132E282\Cms\Controllers\RedirectController;

Route::controller(AdminController::class)->group(function () {
  Route::get('', 'index')->name('index');
  Route::get('/create', 'form')->name('create');
  Route::post('/store', 'store')->name('store');
  Route::get('/{id}', 'form')->name('show');
  Route::put('/{id}', 'edit')->name('update');
  Route::put('/{id}/password', 'updatePassword')->name('updatePassword');
  Route::delete('/{id}', 'destroy')->name('destroy');
  Route::post('bulk/delete', 'bulkDestroy')->name('bulk-delete');
  Route::post('bulk/force-delete', 'bulkForceDestroy')->name('bulk-force-delete');
});

Route::module('redirects', RedirectController::class);
Route::module('menus', MenuController::class);
