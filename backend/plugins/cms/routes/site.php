<?php

use Illuminate\Support\Facades\Route;
use PS0132E282\Cms\Controllers\SiteController;

Route::prefix('')->group(function () {
    Route::get('', [SiteController::class, 'index'])->name('index');
    Route::get('analytics', [SiteController::class, 'analytics'])->name('analytics');
    Route::get('ads', [SiteController::class, 'ads'])->name('ads');
    Route::get('search-console', [SiteController::class, 'searchConsole'])->name('search-console');
});
