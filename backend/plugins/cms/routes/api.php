<?php

use Illuminate\Support\Facades\Route;
use PS0132E282\Cms\Controllers\SiteController;

Route::name('admin.site.')->group(function () {
    Route::get('api/website/url-frontend', [SiteController::class, 'getUrlFrontend'])->name('api.url-frontend');
});
