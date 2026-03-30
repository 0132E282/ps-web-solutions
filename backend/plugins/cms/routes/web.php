<?php

use Illuminate\Support\Facades\Route;
use PS0132E282\Cms\Controllers\MenuController;
use PS0132E282\Cms\Controllers\RedirectController;
use PS0132E282\Cms\Controllers\SliderController;

Route::admin(function () {
    Route::prefix('')->name('site.')->group(__DIR__ . '/site.php');
    Route::prefix('admins')->name('admins.')->group(__DIR__ . '/admin.php');
    Route::prefix('files')->name('files.')->group(__DIR__ . '/files.php');
    Route::prefix('account')->name('account.')->group(__DIR__ . '/account.php');
    Route::module('sliders', SliderController::class);
    Route::module('menus', MenuController::class);
    Route::module('redirects', RedirectController::class);
    Route::prefix('settings')->name('settings.')->group(__DIR__ . '/setting.php');
});
