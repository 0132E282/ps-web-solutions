<?php

use Illuminate\Support\Facades\Route;
use PS0132E282\Cms\Controllers\SiteController;

Route::get('', [SiteController::class, 'index'])->name('dashboard');
