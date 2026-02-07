<?php

use Illuminate\Support\Facades\Route;
use PS0132E282\Cms\Controllers\PostController;
use PS0132E282\Cms\Controllers\PostCategoryController;
use PS0132E282\Cms\Controllers\PostTagController;
use PS0132E282\Cms\Controllers\RedirectController;
use PS0132E282\Cms\Controllers\MenuController;

Route::admin()->group(function () {
    Route::prefix('')->name('admin.site.')->group(__DIR__ . '/site.php');
    Route::prefix('admins')->name('admin.admins.')->group(__DIR__ . '/admin.php');
    Route::prefix('files')->name('admin.files.')->group(__DIR__ . '/files.php');
    Route::prefix('settings')->name('admin.settings.')->group(__DIR__ . '/setting.php');
    Route::prefix('account')->name('admin.account.')->group(__DIR__ . '/account.php');
    Route::module('posts', PostController::class);
    Route::module('post-categories', PostCategoryController::class);
    Route::module('post-tags', PostTagController::class);
    Route::module('redirects', RedirectController::class);
    Route::module('menus', MenuController::class);
});
