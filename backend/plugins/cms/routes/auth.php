<?php

use Illuminate\Support\Facades\Route;
use PS0132E282\CMS\Controllers\Auth\SocialAuthController;
use PS0132E282\CMS\Controllers\Auth\AuthController;

Route::group(['middleware' => ['web']], function () {
    Route::get('/login', [AuthController::class, 'login'])->name('login');
    Route::get('/auth/{provider}', [SocialAuthController::class, 'redirectToProvider'])->name('auth.social');
    Route::get('/auth/{provider}/callback', [SocialAuthController::class, 'handleProviderCallback'])->name('auth.social.callback');
});
