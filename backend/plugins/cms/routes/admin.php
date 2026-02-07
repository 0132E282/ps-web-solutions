<?php

use Illuminate\Support\Facades\Route;
use PS0132E282\Cms\Controllers\AdminController;

Route::get('', [AdminController::class, 'index'])->name('index');
Route::get('/create', [AdminController::class, 'form'])->name('create');
Route::post('/store', [AdminController::class, 'store'])->name('store');
Route::get('/{id}', [AdminController::class, 'form'])->name('update');
Route::put('/{id}', [AdminController::class, 'edit'])->name('edit');
Route::put('/{id}/password', [AdminController::class, 'updatePassword'])->name('updatePassword');
Route::delete('/{id}', [AdminController::class, 'destroy'])->name('destroy');
