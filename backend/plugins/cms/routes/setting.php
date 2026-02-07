<?php

use Illuminate\Support\Facades\Route;
use PS0132E282\Cms\Controllers\ActivityLogController;
use PS0132E282\Cms\Controllers\ConfigurationController;
use PS0132E282\Cms\Controllers\RoleController;
use PS0132E282\Cms\Controllers\ApplicationKeyController;

use PS0132E282\Cms\Controllers\SettingController;


Route::get('/', [ConfigurationController::class, 'index'])->name('index');
Route::prefix('/roles')->name('roles.')->group(function () {
    Route::get('', [RoleController::class, 'index'])->name('index');
    Route::post('', [RoleController::class, 'store'])->name('store');
    Route::put('/{id}', [RoleController::class, 'update'])->name('update');
    Route::delete('/{id}', [RoleController::class, 'destroy'])->name('delete');
    Route::put('/{id}/permissions', [RoleController::class, 'permissions'])->name('permissions');
});

Route::prefix('/application-keys')->name('application-keys.')->group(function () {
    Route::get('', [ApplicationKeyController::class, 'index'])->name('index');
    Route::post('', [ApplicationKeyController::class, 'store'])->name('store');
    Route::put('/{id}', [ApplicationKeyController::class, 'update'])->name('update');
    Route::delete('/{id}', [ApplicationKeyController::class, 'destroy'])->name('destroy');
    Route::put('/{id}/permissions', [ApplicationKeyController::class, 'permissions'])->name('permissions');
});

Route::prefix('/activity-logs')->name('activity-logs.')->group(function () {
    Route::get('', [ActivityLogController::class, 'index'])->name('index');
});

Route::get('/{key}', [SettingController::class, 'index'])->name('show');
Route::post('/{key}', [SettingController::class, 'save'])->name('save');
