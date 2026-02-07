<?php

use Illuminate\Support\Facades\Route;
use PS0132E282\Notifications\Controllers\NotificationController;

Route::middleware(['web', 'auth', 'verified'])->group(function () {
  Route::prefix('notifications')->name('admin.notifications.')->group(function () {
    Route::get('', [NotificationController::class, 'index'])->name('index');
    Route::post('{id}/read', [NotificationController::class, 'markAsRead'])->name('read');
    Route::post('read-all', [NotificationController::class, 'markAllAsRead'])->name('read-all');
    Route::delete('destroy-all', [NotificationController::class, 'destroyAll'])->name('destroy-all');
    Route::delete('{id}', [NotificationController::class, 'destroy'])->name('destroy');
  });
});
