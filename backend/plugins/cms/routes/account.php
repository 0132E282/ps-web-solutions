<?php

use Illuminate\Support\Facades\Route;
use PS0132E282\Cms\Controllers\AccountController;
use PS0132E282\Cms\Controllers\PasswordController;

// Account routes
Route::get('', [AccountController::class, 'index'])->name('profile');
Route::put('', [AccountController::class, 'update'])->name('profile.update');

// Change password routes
Route::get('change-password', [PasswordController::class, 'edit'])->name('change-password');
Route::put('change-password', [AccountController::class, 'changePassword'])->name('change-password.update');
