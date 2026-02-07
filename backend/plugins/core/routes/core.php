<?php

use Illuminate\Support\Facades\Route;
// use PS0132E282\Core\Controllers\AccountController;
// use PS0132E282\Core\Controllers\PasswordController;

Route::middleware(['web', 'auth'])->prefix('admin')->name('admin.')->group(function () {
    // Account routes
    // Route::get('account', [AccountController::class, 'index'])->name('account.index');
    // Route::patch('account', [AccountController::class, 'update'])->name('account.update');

    // Change password routes
    // Route::get('account/change-password', [PasswordController::class, 'edit'])->name('account.change-password');
    // Route::put('account/change-password', [PasswordController::class, 'update'])->name('account.change-password.update');
});
