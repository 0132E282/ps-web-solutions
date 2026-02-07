<?php

use Illuminate\Support\Facades\Route;
use PS0132E282\Cms\Controllers\FileController;

Route::get('', [FileController::class, 'index'])->name('index');
Route::get('/folders-tree', [FileController::class, 'getFoldersTree'])->name('foldersTree');
Route::post('', [FileController::class, 'store'])->name('store');
Route::post('/folder', [FileController::class, 'createFolder'])->name('createFolder');
Route::put('/{id}/rename', [FileController::class, 'rename'])->name('rename');
Route::post('/move', [FileController::class, 'move'])->name('move');
Route::post('/{id}/duplicate', [FileController::class, 'duplicate'])->name('duplicate');
Route::delete('', [FileController::class, 'destroy'])->name('destroy');
Route::get('/{id}/download', [FileController::class, 'download'])->name('download');
Route::post('/download-zip', [FileController::class, 'downloadZip'])->name('downloadZip');
Route::post('/compress', [FileController::class, 'compress'])->name('compress');
Route::post('/{id}/extract', [FileController::class, 'extract'])->name('extract');
