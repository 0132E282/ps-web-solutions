<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Theme\ThemeController;
use App\Http\Controllers\Theme\ThemeOptionController;
use App\Http\Controllers\Theme\ThemeCategoryController;

Route::admin()->group(function () {
  Route::module('themes', ThemeController::class);
  Route::module('theme-options', ThemeOptionController::class);
  Route::module('theme-categories', ThemeCategoryController::class);
});
